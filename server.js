const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const snarkjs = require("snarkjs");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const STATE_PATH = path.join(__dirname, "moodachu_state.json");

function ensureState() {
  let shouldSave = false;
  if (!fs.existsSync(STATE_PATH)) {
    fs.writeFileSync(STATE_PATH, JSON.stringify({ pairs: {}, invitations: {}, users: {}, usernames: {} }, null, 2));
  }
  const content = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  // Ensure all expected top-level keys exist (migrate older state files)
  if (!content.pairs) { content.pairs = {}; shouldSave = true; }
  if (!content.invitations) { content.invitations = {}; shouldSave = true; }
  if (!content.users) { content.users = {}; shouldSave = true; }
  if (!content.usernames) { content.usernames = {}; shouldSave = true; }
  if (shouldSave) saveState(content);
  return content;
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function toBytes32(str) {
  const buf = Buffer.alloc(32);
  buf.write(str);
  return "0x" + buf.toString("hex");
}

async function simulateSubmit(pairId, claimedState, vkPath, proofPath, publicPath) {
  const vk = JSON.parse(fs.readFileSync(vkPath, "utf8"));
  const proof = JSON.parse(fs.readFileSync(proofPath, "utf8"));
  const publicSignals = JSON.parse(fs.readFileSync(publicPath, "utf8"));

  const ok = await snarkjs.groth16.verify(vk, publicSignals, proof);
  if (!ok) return { success: false, error: "Invalid ZK Proof" };

  const state = ensureState();
  const nowTs = Math.floor(Date.now() / 1000);

  if (!state.pairs[pairId]) {
    state.pairs[pairId] = {
      id: pairId,
      petState: claimedState,
      lastUpdate: nowTs,
      updateCount: 1
    };

    saveState(state);

    return {
      success: true,
      created: true,
      state: state.pairs[pairId],
      events: [
        { type: "PairCreated", pairId: toBytes32(pairId), timestamp: nowTs },
        { type: "PetStateUpdated", pairId: toBytes32(pairId), newState: claimedState, timestamp: nowTs }
      ]
    };
  } else {
    const p = state.pairs[pairId];
    p.petState = claimedState;
    p.updateCount++;
    p.lastUpdate = nowTs;

    saveState(state);

    return {
      success: true,
      created: false,
      state: p,
      events: [
        { type: "PetStateUpdated", pairId: toBytes32(pairId), newState: claimedState, timestamp: nowTs }
      ]
    };
  }
}

app.get("/pair/:id", (req, res) => {
  const state = ensureState();
  const pair = state.pairs[req.params.id];
  if (!pair) return res.json({ exists: false });
  res.json({ exists: true, pair });
});

  // Get all pairs for a username (participant)
  app.get('/pairs', (req, res) => {
    const state = ensureState();
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'username query required' });
    const normalized = (username || '').trim().toLowerCase();
    const list = Object.values(state.pairs || {}).filter(p => (p.participants || []).map(x => (x || '').trim().toLowerCase()).includes(normalized));
    // attach metadata: partner (other username) and displayName if available
    const decorated = list.map(p => {
      const other = (p.participants || []).find(u => (u || '').trim().toLowerCase() !== normalized) || null;
      const partnerUser = other && state.usernames[other] ? state.users[state.usernames[other]] : null;
      return { ...p, partnerUsername: other, partnerDisplayName: partnerUser?.displayName || other };
    });
    console.log(`[pairs] queried for ${normalized} found ${decorated.length}`);
    res.json({ success: true, pairs: decorated });
  });

app.post("/submit-proof", async (req, res) => {
  try {
    const { pairId, claimedState } = req.body;

    const vkPath = path.join(__dirname, "zk/keys/verification_key.json");
    const proofPath = path.join(__dirname, "zk/test/proof.json");
    const publicPath = path.join(__dirname, "zk/test/public.json");

    const result = await simulateSubmit(pairId, claimedState, vkPath, proofPath, publicPath);
    res.json(result);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add simple email endpoint to send invites/notifications via SMTP.
app.post('/send-email', async (req, res) => {
  try {
    const { to, subject, text, html } = req.body;
    // Setup transporter: prefer environment variables for production use
    let transporter;
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      });
        console.log('[mail] Using SMTP provider', process.env.SMTP_HOST || 'unknown');
    } else {
      // Use ethereal test account if no env vars are supplied
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        }
      });
        console.log('[mail] Using Ethereal test account (preview available)');
    }

    const fromAddress = process.env.FROM_EMAIL || 'no-reply@moodachu.local';
    const mail = await transporter.sendMail({ from: fromAddress, to, subject, text, html });

    // In case ethereal is used, return preview URL so the frontend can display it in logs
    let preview = null;
    if (nodemailer.getTestMessageUrl) {
      preview = nodemailer.getTestMessageUrl(mail);
    }
    if (preview) console.log('[mail] Ethereal preview', preview);

    res.json({ success: true, messageId: mail.messageId, preview });
  } catch (err) {
    console.error('[send-email] err', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Register a user and assign a unique username if requestedUsername is taken
app.post('/users', (req, res) => {
  try {
    const { uid, requestedUsername, displayName, email } = req.body;
    if (!uid) return res.status(400).json({ success: false, error: 'uid required' });
    const state = ensureState();
    if (state.users[uid]) {
      console.log(`[users] user already registered uid=${uid} username=${state.users[uid].username}`);
      return res.json({ success: true, user: state.users[uid] });
    }
    // Remove erroneous check — this route is for registering a new user
    const base = (requestedUsername || displayName || (email || '').split('@')[0] || 'user').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    let username = base;
    let suffix = 1;
    while (state.usernames[username]) {
      username = `${base}${suffix}`;
      suffix++;
    }
    // store user
    state.users[uid] = { uid, username, displayName: displayName || username, email };
    state.usernames[username] = uid;
    saveState(state);
    console.log(`[users] registered uid=${uid} username=${username}`);
    res.json({ success: true, user: state.users[uid] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/users/:uid', (req, res) => {
  const state = ensureState();
  const u = state.users[req.params.uid];
  if (!u) return res.status(404).json({ success: false, error: 'user not found' });
  res.json({ success: true, user: u });
});

app.get('/users/username/:username', (req, res) => {
  const state = ensureState();
  const username = (req.params.username || '').trim().toLowerCase();
  const uid = state.usernames[username];
  console.log(`[users] get by username: ${username} -> ${uid || 'notfound'}`);
  if (!uid) return res.status(404).json({ success: false, error: 'user not found' });
  const user = state.users[uid];
  console.log(`[users] found user ${JSON.stringify(user)}`);
  res.json({ success: true, user });
});

// Create an invitation (persist invite and optionally send email)
app.post('/invite', (req, res) => {
  try {
    let { toUsername, fromUid, fromUsername, fromDisplayName, petName, partnerName } = req.body;
    toUsername = (toUsername || '').trim().toLowerCase();
    fromUsername = (fromUsername || fromDisplayName || '').trim().toLowerCase();
    const state = ensureState();
    // Verify recipient username exists
    if (!state.usernames[toUsername]) return res.status(404).json({ success: false, error: 'recipient username not found' });
    const id = Math.random().toString(36).slice(2, 9);
    let fromDisplayNameFinal = fromDisplayName || fromUsername;
    if (fromUid && state.users[fromUid]) fromDisplayNameFinal = state.users[fromUid].displayName || fromDisplayNameFinal;
    state.invitations[id] = {
      id,
      toUsername,
      fromUid: fromUid || null,
      fromUsername: fromUsername || null,
      fromDisplayName: fromDisplayNameFinal || null,
      petName,
      partnerName,
      accepted: false,
      createdAt: Math.floor(Date.now() / 1000)
    };
    saveState(state);
    console.log(`[invite] created id=${id} to=${toUsername} from=${fromUsername} pet=${petName}`);
    res.json({ success: true, id, invite: state.invitations[id] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/invitations', (req, res) => {
  const state = ensureState();
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: 'username query required' });
  const normalized = (username || '').trim().toLowerCase();
  const list = Object.values(state.invitations || {}).filter(i => (i.toUsername || '').trim().toLowerCase() === normalized && !i.accepted);
  console.log(`[invitations] queried for ${normalized} found ${list.length}`);
  res.json({ success: true, invites: list });
});

app.post('/invitations/:id/accept', async (req, res) => {
  try {
    const state = ensureState();
    const id = req.params.id;
    if (!state.invitations[id]) return res.status(404).json({ success: false, error: 'invite not found' });
    state.invitations[id].accepted = true;
    const invite = state.invitations[id];
    console.log(`[invite] accept id=${id} to=${invite.toUsername} from=${invite.fromUsername}`);
    // create a pair entry
    const pairId = Math.random().toString(36).slice(2, 9);
    state.pairs[pairId] = { id: pairId, petState: 0, lastUpdate: Math.floor(Date.now() / 1000), updateCount: 0, petName: invite.petName, participants: [invite.fromUsername, invite.toUsername] };
    saveState(state);
    res.json({ success: true, pairId, invite: state.invitations[id], pair: state.pairs[pairId] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Moodachu Midnight Simulator running at http://localhost:${PORT}`);
});

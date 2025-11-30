const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const snarkjs = require("snarkjs");

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const STATE_PATH = path.join(__dirname, "moodachu_state.json");

function ensureState() {
  if (!fs.existsSync(STATE_PATH)) {
    fs.writeFileSync(STATE_PATH, JSON.stringify({ pairs: {} }, null, 2));
  }
  return JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
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

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Moodachu Midnight Simulator running at http://localhost:${PORT}`);
});

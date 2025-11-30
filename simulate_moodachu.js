// simulate_moodachu.js
// Minimal local simulator for your Midnight contract logic.
// Usage examples at bottom of this file.

const fs = require('fs');
const path = require('path');
const snarkjs = require('snarkjs');

const STATE_PATH = path.join(__dirname, 'moodachu_state.json');

// Helper: load JSON safely
function loadJSON(p) {
  return JSON.parse(fs.readFileSync(path.resolve(p), 'utf8'));
}

// Helper: save state file
function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

// Ensure state file exists
function ensureState() {
  if (!fs.existsSync(STATE_PATH)) {
    saveState({ pairs: {} });
  }
  return loadJSON(STATE_PATH);
}

// Convert a string id (like "couple1") to bytes32-like hex for display
function toBytes32(str) {
  const buf = Buffer.alloc(32);
  buf.write(str, 0, 'utf8');
  return '0x' + buf.toString('hex');
}

// Main simulator logic: mimics submitProof(pairId, claimedState, proof)
async function submitProof({ pairId, claimedState, vkPath, proofPath, publicPath }) {
  // defaults
  vkPath = vkPath || path.join(__dirname, 'zk', 'keys', 'verification_key.json');
  proofPath = proofPath || path.join(__dirname, 'zk', 'test', 'proof.json');
  publicPath = publicPath || path.join(__dirname, 'zk', 'test', 'public.json');

  if (!fs.existsSync(vkPath)) throw new Error('VK file not found: ' + vkPath);
  if (!fs.existsSync(proofPath)) throw new Error('Proof file not found: ' + proofPath);
  if (!fs.existsSync(publicPath)) throw new Error('Public file not found: ' + publicPath);

  console.log('Loading VK:', vkPath);
  const vk = loadJSON(vkPath);

  console.log('Loading proof:', proofPath);
  const proof = loadJSON(proofPath);

  console.log('Loading public signals:', publicPath);
  const publicSignals = loadJSON(publicPath);

  // Validate public input (your circuit expects 1 public input: claimedState)
  if (!Array.isArray(publicSignals)) {
    throw new Error('public.json must be an array of public signals');
  }
  if (publicSignals.length < 1) {
    throw new Error('public.json has no public signals');
  }

  // Optional: quick check public input matches claimedState (helps catch mismatch)
  const public0 = Number(publicSignals[0]);
  if (Number(claimedState) !== public0) {
    console.warn(`Warning: claimedState (${claimedState}) != publicSignals[0] (${public0}). Proceeding but double-check.`);
  }

  // Verify proof with snarkjs
  console.log('Verifying proof with snarkjs...');
  const ok = await snarkjs.groth16.verify(vk, publicSignals, proof);

  if (!ok) {
    console.error('Proof verification FAILED.');
    return { success: false, reason: 'invalid-proof' };
  }

  console.log('Proof OK ✅ — applying contract logic (simulated)');

  // load and update state
  const state = ensureState();

  // Use a bytes32-ish key so it mirrors on-chain pairId handling
  const canonicalId = pairId || ('pair_' + public0);
  const key = canonicalId;

  const nowTs = Math.floor(Date.now() / 1000);

  if (!state.pairs[key]) {
    // create new pair
    state.pairs[key] = {
      id: key,
      petState: Number(claimedState),
      lastUpdate: nowTs,
      updateCount: 1
    };
    console.log('Event: PairCreated', { pairId: toBytes32(key), timestamp: nowTs });
    console.log('Event: PetStateUpdated', { pairId: toBytes32(key), newState: Number(claimedState), timestamp: nowTs });
  } else {
    const p = state.pairs[key];
    p.petState = Number(claimedState);
    p.updateCount = (p.updateCount || 0) + 1;
    p.lastUpdate = nowTs;
    console.log('Event: PetStateUpdated', { pairId: toBytes32(key), newState: Number(claimedState), timestamp: nowTs });
  }

  saveState(state);

  return { success: true, state: state.pairs[key] };
}

// Getter
function getPair(pairId) {
  const state = ensureState();
  return state.pairs[pairId] || null;
}

// CLI interface (very small)
async function cli() {
  const argv = process.argv.slice(2);

  if (argv.length === 0) {
    console.log('Usage:');
    console.log('  node simulate_moodachu.js submit --pairId <id> --state <0|1|2|3|4> [--vk path] [--proof path] [--public path]');
    console.log('  node simulate_moodachu.js get --pairId <id>');
    process.exit(0);
  }

  const cmd = argv[0];

  // simple arg parsing
  const args = {};
  for (let i = 1; i < argv.length; i += 2) {
    const k = argv[i];
    const v = argv[i + 1];
    if (!k || !v) continue;
    if (k.startsWith('--')) args[k.slice(2)] = v;
  }

  if (cmd === 'submit') {
    const pairId = args.pairId || ('pair_' + Date.now());
    const claimedState = args.state;
    if (claimedState === undefined) {
      console.error('--state is required (0..4)');
      process.exit(1);
    }
    try {
      const res = await submitProof({
        pairId,
        claimedState,
        vkPath: args.vk,
        proofPath: args.proof,
        publicPath: args.public
      });
      console.log('Result:', res);
    } catch (err) {
      console.error('Error during submission:', err.message);
      process.exit(1);
    }
  } else if (cmd === 'get') {
    const pairId = args.pairId;
    if (!pairId) {
      console.error('--pairId is required for get');
      process.exit(1);
    }
    const p = getPair(pairId);
    console.log('Pair:', p);
  } else {
    console.error('Unknown command:', cmd);
    process.exit(1);
  }
}

// Run CLI
cli();

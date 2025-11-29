// ============================================================
//  MOODACHU ZK PROVER (FINAL WORKING VERSION)
// ============================================================

const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

module.exports = async function generateMoodachuProof(input) {
    try {
        // ---------------- PATHS ----------------
        const root = path.join(__dirname, "..");
        const buildDir = path.join(root, "build", "moodachu_js");

        const wasmPath = path.join(buildDir, "moodachu.wasm");
        const wcPath   = path.join(buildDir, "witness_calculator.js");
        const provingKeyPath = path.join(root, "keys", "proving_key.zkey");

        if (!fs.existsSync(wasmPath)) throw new Error("Missing WASM: " + wasmPath);
        if (!fs.existsSync(wcPath)) throw new Error("Missing witness_calculator.js: " + wcPath);
        if (!fs.existsSync(provingKeyPath)) throw new Error("Missing proving key: " + provingKeyPath);

        // ---------------- LOAD WASM ----------------
        const wasmBuffer = fs.readFileSync(wasmPath);

        // ---------------- LOAD WITNESS CALCULATOR ----------------
        const wcBuilder = require(wcPath);  // returns a function
        const wc = await wcBuilder(wasmBuffer);

        if (typeof wc.calculateWTNSBin !== "function") {
            throw new Error("witnessCalculator missing calculateWTNSBin()");
        }

        // ---------------- GENERATE WITNESS (BINARY) ----------------
        const witnessBin = await wc.calculateWTNSBin(input, 0);

        // ---------------- GENERATE PROOF ----------------
        const { proof, publicSignals } = await snarkjs.groth16.prove(
            provingKeyPath,
            witnessBin
        );

        return { proof, publicSignals };

    } catch (err) {
        console.error("❌ Error generating Moodachu proof:", err);
        throw err;
    }
};

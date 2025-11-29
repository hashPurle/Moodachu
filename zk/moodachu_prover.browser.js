// ============================================================
//  MOODACHU BROWSER ZK PROVER (PURE WASM)
// ============================================================

import * as snarkjs from "snarkjs";

// Public assets served by Next.js
import wasmUrl from "@/public/zk/moodachu.wasm?url";
import zkeyUrl from "@/public/zk/proving_key.zkey?url";
import wcUrl from "@/public/zk/witness_calculator.js?url";

export async function generateMoodachuProofBrowser(input) {
    // 1. Load WASM
    const wasmResponse = await fetch(wasmUrl);
    const wasmBuffer = await wasmResponse.arrayBuffer();

    // 2. Load witness_calculator.js dynamically
    const wcModule = await import(wcUrl);
    const wcBuilder = wcModule.default || wcModule;

    // 3. Build witness calculator
    const wc = await wcBuilder(wasmBuffer);

    // 4. Generate witness (binary)
    const witnessBin = await wc.calculateWTNSBin(input, 0);

    // 5. Load proving key
    const zkeyResponse = await fetch(zkeyUrl);
    const zkeyBuffer = await zkeyResponse.arrayBuffer();

    // 6. Generate proof
    const { proof, publicSignals } = await snarkjs.groth16.prove(
        new Uint8Array(zkeyBuffer),
        witnessBin
    );

    return { proof, publicSignals };
}

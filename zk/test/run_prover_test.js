const generateMoodachuProof = require("../prover/moodachu_prover");

(async () => {
    const input = {
        tagA: 0,
        tagB: 0,
        interactionType: 0
    };

    const { proof, publicSignals } = await generateMoodachuProof(input);

    console.log("Proof:", proof);
    console.log("Public Signals:", publicSignals);
})();

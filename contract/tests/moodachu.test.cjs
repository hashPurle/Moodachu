const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

// --- Test Suite for Moodachu Contract ---

describe("Moodachu", function () {
    let Moodachu;
    let moodachu;
    let owner;
    let pairId;
    let verificationKeyBytes;

    // --- ZK Assets ---
    let validProof;
    let publicSignals;
    let snarkjsVkJson; // The parsed verification key JSON from snarkjs

    // --- Helper to format snarkjs proof to Groth16Proof struct for Midnight Compact ---
    // Note: The structure of Groth16Proof in Midnight Compact is assumed to directly
    // map to the pi_a, pi_b, pi_c components of a snarkjs proof.
    // However, the `Field` type in Midnight Compact is a placeholder.
    // For testing with ethers, we'll pass the string representations.
    const formatSnarkjsProofToGroth16Proof = (snarkjsProof) => {
        return {
            pi_a: [snarkjsProof.pi_a[0], snarkjsProof.pi_a[1]],
            pi_b: [
                [snarkjsProof.pi_b[0][0], snarkjsProof.pi_b[1][0]],
                [snarkjsProof.pi_b[0][1], snarkjsProof.pi_b[1][1]],
            ],
            pi_c: [snarkjsProof.pi_c[0], snarkjsProof.pi_c[1]],
        };
    };

    // --- Test Setup ---

    beforeEach(async function () {
        // Get signers
        [owner] = await ethers.getSigners();

        // Generate a random pairId for each test
        pairId = ethers.utils.randomBytes(32);

        // Load ZK Assets
        try {
            // Load verification key JSON
            const vkPath = path.join(__dirname, "../../contract/keys/verification_key.json");
            snarkjsVkJson = JSON.parse(fs.readFileSync(vkPath, "utf8"));
            verificationKeyBytes = ethers.utils.solidityPack(
                ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256"],
                [
                    snarkjsVkJson.vk_alpha_1[0], snarkjsVkJson.vk_alpha_1[1],
                    snarkjsVkJson.vk_beta_2[0][0], snarkjsVkJson.vk_beta_2[0][1],
                    snarkjsVkJson.vk_beta_2[1][0], snarkjsVkJson.vk_beta_2[1][1],
                    snarkjsVkJson.vk_gamma_2[0][0], snarkjsVkJson.vk_gamma_2[0][1],
                    snarkjsVkJson.vk_delta_2[0][0], snarkjsVkJson.vk_delta_2[0][1],
                    snarkjsVkJson.vk_ic[0][0], snarkjsVkJson.vk_ic[0][1]
                ]
            );

            // Load test proof and public signals
            const proofPath = path.join(__dirname, "../../zk/build/proof.json");
            const publicSignalsPath = path.join(__dirname, "../../zk/build/public.json");
            validProof = JSON.parse(fs.readFileSync(proofPath, "utf8"));
            publicSignals = JSON.parse(fs.readFileSync(publicSignalsPath, "utf8"));

        } catch (error) {
            console.warn("Could not load ZK assets (verification_key.json, proof.json, public.json). ZK verification tests may be skipped or fail.", error);
            // Provide mock data if real assets are not found, so other tests can still run
            snarkjsVkJson = {};
            verificationKeyBytes = "0x1234";
            validProof = { pi_a: ["0", "0"], pi_b: [["0", "0"], ["0", "0"]], pi_c: ["0", "0"] };
            publicSignals = ["1"];
        }

        // Deploy the contract with the verification key
        Moodachu = await ethers.getContractFactory("Moodachu"); // Hardhat assumes Moodachu to be the compiled artifact of moodachu_contract.midnight
        moodachu = await Moodachu.deploy(verificationKeyBytes);
        await moodachu.deployed();
    });

    // --- State Management Tests ---

    describe("State Management", function () {
        it("Should create a new pair and update its state on first submission", async function () {
            // Using publicSignals[0] as the valid claimedState from the ZK proof
            const claimedState = parseInt(publicSignals[0]);
            const formattedProof = formatSnarkjsProofToGroth16Proof(validProof);

            await expect(moodachu.submitProof(pairId, claimedState, formattedProof))
                .to.emit(moodachu, "PairCreated")
                .withArgs(ethers.utils.hexlify(pairId), (await ethers.provider.getBlock('latest')).timestamp)
                .and.to.emit(moodachu, "PetStateUpdated")
                .withArgs(ethers.utils.hexlify(pairId), claimedState, (await ethers.provider.getBlock('latest')).timestamp);

            const pairInfo = await moodachu.getPairInfo(pairId);
            expect(pairInfo.petState).to.equal(claimedState);
            expect(pairInfo.updateCount).to.equal(1);
        });

        it("Should update an existing pair's state and increment updateCount", async function () {
            const initialState = parseInt(publicSignals[0]);
            const formattedInitialProof = formatSnarkjsProofToGroth16Proof(validProof);

            // First submission
            await moodachu.submitProof(pairId, initialState, formattedInitialProof);

            // Assuming we generate a new valid proof for a different state for the second submission.
            // For this test, we'll use the existing validProof for simplicity, but for a different claimedState.
            // In a real scenario, this would require generating a new proof for the new claimedState.
            const updatedState = (initialState + 1) % 5; // Example: change state
            const formattedUpdateProof = formatSnarkjsProofToGroth16Proof(validProof); // Reusing for simplicity

            await expect(moodachu.submitProof(pairId, updatedState, formattedUpdateProof))
                .to.emit(moodachu, "PetStateUpdated");

            const pairInfo = await moodachu.getPairInfo(pairId);
            expect(pairInfo.petState).to.equal(updatedState);
            expect(pairInfo.updateCount).to.equal(2);
        });
    });

    // --- ZK Proof Verification Tests ---

    describe("Proof Verification", function () {
        it("Should accept a valid proof", async function () {
            // This test will only pass if valid ZK assets are loaded and the Midnight environment correctly verifies them.
            if (!validProof || !publicSignals || publicSignals.length === 0) {
                console.warn("Skipping 'Should accept a valid proof' test: No valid proofs loaded.");
                this.skip();
            }

            const claimedState = parseInt(publicSignals[0]);
            const formattedProof = formatSnarkjsProofToGroth16Proof(validProof);

            await expect(moodachu.submitProof(pairId, claimedState, formattedProof))
                .to.not.be.reverted;
        });

        it("Should revert if claimedState is out of bounds (> 4)", async function () {
            const invalidState = 5;
            const formattedProof = formatSnarkjsProofToGroth16Proof(validProof);

            await expect(moodachu.submitProof(pairId, invalidState, formattedProof)).to.be.revertedWith(
                "Invalid state: claimedState must be between 0 and 4."
            );
        });

        it("Should revert if the proof is invalid (e.g., tampered)", async function () {
            // This test relies on the underlying Midnight::crypto::verify_groth16 to actually fail.
            // If the ZK verification is not properly integrated or mocked to always pass, this test will fail.
            if (!validProof || !publicSignals || publicSignals.length === 0) {
                console.warn("Skipping 'Should revert if the proof is invalid' test: No valid proofs loaded.");
                this.skip();
            }

            // Create a tampered proof by changing one element
            const tamperedProof = { ...validProof };
            tamperedProof.pi_a[0] = (ethers.BigNumber.from(tamperedProof.pi_a[0]).add(1)).toString();

            const claimedState = parseInt(publicSignals[0]);
            const formattedTamperedProof = formatSnarkjsProofToGroth16Proof(tamperedProof);

            await expect(moodachu.submitProof(pairId, claimedState, formattedTamperedProof))
                .to.be.revertedWith("Proof verification failed.");
        });
    });

    // --- View Function Tests ---

    describe("View Functions", function () {
        it("getPetState should return 0 for a non-existent pair", async function () {
            const nonExistentPairId = ethers.utils.randomBytes(32);
            expect(await moodachu.getPetState(nonExistentPairId)).to.equal(0);
        });

        it("getPetState should return the correct pet state for an existing pair", async function () {
            const claimedState = parseInt(publicSignals[0]);
            const formattedProof = formatSnarkjsProofToGroth16Proof(validProof);
            await moodachu.submitProof(pairId, claimedState, formattedProof);
            expect(await moodachu.getPetState(pairId)).to.equal(claimedState);
        });
    });

    // --- Event Emission Tests ---

    describe("Event Emission", function () {
        it("Should emit PetStateUpdated on a successful submission", async function () {
            const claimedState = parseInt(publicSignals[0]);
            const formattedProof = formatSnarkjsProofToGroth16Proof(validProof);
            const tx = await moodachu.submitProof(pairId, claimedState, formattedProof);
            const block = await ethers.provider.getBlock(tx.blockNumber);

            await expect(tx)
                .to.emit(moodachu, "PetStateUpdated")
                .withArgs(ethers.utils.hexlify(pairId), claimedState, block.timestamp);
        });

        it("Should not emit PairCreated for an existing pair", async function () {
             const claimedState = parseInt(publicSignals[0]);
             const formattedProof = formatSnarkjsProofToGroth16Proof(validProof);

             // First submission (should emit PairCreated and PetStateUpdated)
             await moodachu.submitProof(pairId, claimedState, formattedProof);

             // Second submission (should only emit PetStateUpdated)
             const tx = await moodachu.submitProof(pairId, (claimedState + 1) % 5, formattedProof);
             
             const receipt = await tx.wait();
             const pairCreatedTopic = moodachu.interface.getEventTopic("PairCreated");
             const found = receipt.logs.find(log => log.topics[0] === pairCreatedTopic);
             expect(found).to.be.undefined;
        });
    });
});
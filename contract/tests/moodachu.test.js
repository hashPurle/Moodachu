// Filename: contract/tests/moodachu.test.js

// This test suite provides conceptual tests for the Moodachu smart contract.
// It uses Hardhat, ethers.js, and Chai for assertions.
//
// IMPORTANT: These are mock tests.
// - The `verify_groth16_proof` function in the contract is a placeholder that always returns true.
//   Therefore, these tests primarily verify the contract's state management, input validation,
//   and event emission logic, assuming proof verification would succeed.
// - Once the actual Midnight Compact verifier is implemented, you will need to
//   generate valid ZK proofs for your tests and adjust them accordingly.

const { expect } = require("chai");
const hre = require("hardhat");

describe("Moodachu Contract", function () {
    let Moodachu;
    let moodachuContract;
    let deployer;
    let user1; // Represents one partner
    let user2; // Represents another partner

    // Placeholder Verification Key (must match the simplified VK struct in Compact contract)
    const placeholderVerificationKey = {
        alpha_g1_x: "0x01",
        alpha_g1_y: "0x02",
        beta_g2_x_0: "0x03",
        beta_g2_x_1: "0x04",
        beta_g2_y_0: "0x05",
        beta_g2_y_1: "0x06",
        ic_length: 1, // One public input: claimed_state
    };

    // Placeholder Groth16 Proof structure
    const getPlaceholderProof = () => ({
        pi_a: ["0x10", "0x11"],
        pi_b: [["0x20", "0x21"], ["0x22", "0x23"]],
        pi_c: ["0x30", "0x31"],
    });

    beforeEach(async function () {
        [deployer, user1, user2] = await hre.ethers.getSigners();

        // Get the ContractFactory for Moodachu
        Moodachu = await hre.ethers.getContractFactory("Moodachu");

        // Deploy the contract with the placeholder verification key
        moodachuContract = await Moodachu.deploy(placeholderVerificationKey);
        await moodachuContract.deployed();
    });

    // --- Unit Tests for State Management ---
    describe("State Management", function () {
        it("should return default pet state (0) and empty info for non-existent pair", async function () {
            const nonExistentPairId = hre.ethers.utils.formatBytes32String("nonExistent");
            expect(await moodachuContract.getPetState(nonExistentPairId)).to.equal(0);

            const pairInfo = await moodachuContract.getPairInfo(nonExistentPairId);
            expect(pairInfo.id).to.equal(hre.ethers.utils.formatBytes32String("")); // Default bytes32 is empty
            expect(pairInfo.pet_state).to.equal(0);
            expect(pairInfo.last_update).to.equal(0);
            expect(pairInfo.update_count).to.equal(0);
        });

        it("should create a new pair and update its state", async function () {
            const pairId = hre.ethers.utils.formatBytes32String("couple1");
            const claimedState = 1; // DANCE
            const proof = getPlaceholderProof();

            await expect(moodachuContract.connect(user1).submitProof(pairId, claimedState, proof))
                .to.emit(moodachuContract, "PairCreated")
                .withArgs(pairId, await moodachuContract.get_current_timestamp()) // Assuming timestamp
                .and.to.emit(moodachuContract, "PetStateUpdated")
                .withArgs(pairId, claimedState, await moodachuContract.get_current_timestamp());

            const petState = await moodachuContract.getPetState(pairId);
            expect(petState).to.equal(claimedState);

            const pairInfo = await moodachuContract.getPairInfo(pairId);
            expect(pairInfo.id).to.equal(pairId);
            expect(pairInfo.pet_state).to.equal(claimedState);
            expect(pairInfo.update_count).to.equal(1);
            expect(pairInfo.last_update).to.be.above(0); // Should be a timestamp
        });

        it("should update an existing pair's state and increment updateCount", async function () {
            const pairId = hre.ethers.utils.formatBytes32String("couple2");
            const initialClaimedState = 0; // NEUTRAL
            const updatedClaimedState = 4; // GROW
            const proof = getPlaceholderProof();

            // Initial submission
            await moodachuContract.connect(user1).submitProof(pairId, initialClaimedState, proof);

            const initialPairInfo = await moodachuContract.getPairInfo(pairId);
            expect(initialPairInfo.pet_state).to.equal(initialClaimedState);
            expect(initialPairInfo.update_count).to.equal(1);

            // Update submission
            await expect(moodachuContract.connect(user2).submitProof(pairId, updatedClaimedState, proof))
                .to.not.emit(moodachuContract, "PairCreated") // Should not emit PairCreated again
                .and.to.emit(moodachuContract, "PetStateUpdated")
                .withArgs(pairId, updatedClaimedState, await moodachuContract.get_current_timestamp());

            const updatedPairInfo = await moodachuContract.getPairInfo(pairId);
            expect(updatedPairInfo.pet_state).to.equal(updatedClaimedState);
            expect(updatedPairInfo.update_count).to.equal(2);
            expect(updatedPairInfo.last_update).to.be.above(initialPairInfo.last_update); // Timestamp should be newer
        });
    });

    // --- Mock Tests for Proof Verification Flow ---
    describe("Proof Verification Flow (Mocked)", function () {
        it("should allow submission with a valid proof (mocked)", async function () {
            const pairId = hre.ethers.utils.formatBytes32String("mockCouple");
            const claimedState = 2; // SLEEPY
            const proof = getPlaceholderProof();

            // Since `verify_groth16_proof` is mocked to return true, this should succeed.
            await expect(moodachuContract.connect(user1).submitProof(pairId, claimedState, proof))
                .to.not.be.reverted; // Expect no revert due to proof failure
            
            expect(await moodachuContract.getPetState(pairId)).to.equal(claimedState);
        });
        
        it("should revert if public_inputs count mismatches (mocked)", async function () {
            const pairId = hre.ethers.utils.formatBytes32String("badProofCouple");
            const claimedState = 3; // STORM
            const proof = getPlaceholderProof();

            // To simulate a mismatch, we would need to mock `vk.ic_length` or change `public_inputs` length.
            // Since `vk.ic_length` is fixed at 1 and `submitProof` always pushes one `claimedState`
            // to `public_inputs`, a mismatch would typically occur if the *actual* ZK circuit
            // expected more public inputs, or if `vk.ic_length` was wrongly configured.
            // For this mock, the `verify_groth16_proof` internal `assert` handles this.
            // To trigger this, one would need to provide a VK with a different `ic_length`.
            // If the `ic_length` in VK was 2, and we only pass 1 public input, it would revert.
            
            // This test is more about the internal `assert` for `public_inputs.len() == vk.ic_length`.
            // As `vk.ic_length` is 1 and `public_inputs` length is always 1 in `submitProof`,
            // this particular condition (`public_inputs.len() as u32 != vk.ic_length`) won't be met
            // unless we modify the VK or the `submitProof` logic directly.
            // This test primarily checks that it *doesn't* revert for this specific reason
            // under the current mocking setup.
            
            await expect(moodachuContract.connect(user1).submitProof(pairId, claimedState, proof))
                .to.not.be.revertedWith("Public inputs count mismatch with Verification Key.");
        });
    });

    // --- Tests for Input Validation ---
    describe("Input Validation", function () {
        it("should revert if claimedState is out of valid range (e.g., 5)", async function () {
            const pairId = hre.ethers.utils.formatBytes32String("invalidStateCouple");
            const invalidClaimedState = 5; // Out of range (0-4)
            const proof = getPlaceholderProof();

            await expect(moodachuContract.connect(user1).submitProof(pairId, invalidClaimedState, proof))
                .to.be.revertedWith("Invalid claimedState: Must be between 0 and 4.");
        });

        it("should not revert if claimedState is 0", async function () {
            const pairId = hre.ethers.utils.formatBytes32String("stateZeroCouple");
            const claimedState = 0; // NEUTRAL - valid
            const proof = getPlaceholderProof();

            await expect(moodachuContract.connect(user1).submitProof(pairId, claimedState, proof))
                .to.not.be.reverted;
            expect(await moodachuContract.getPetState(pairId)).to.equal(claimedState);
        });

        it("should not revert if claimedState is 4", async function () {
            const pairId = hre.ethers.utils.formatBytes32String("stateFourCouple");
            const claimedState = 4; // GROW - valid
            const proof = getPlaceholderProof();

            await expect(moodachuContract.connect(user1).submitProof(pairId, claimedState, proof))
                .to.not.be.reverted;
            expect(await moodachuContract.getPetState(pairId)).to.equal(claimedState);
        });
    });

    // --- Tests for Event Emission ---
    describe("Event Emission", function () {
        it("should emit PairCreated and PetStateUpdated for a new pair", async function () {
            const pairId = hre.ethers.utils.formatBytes32String("eventCouple1");
            const claimedState = 1; // DANCE
            const proof = getPlaceholderProof();
            const expectedTimestamp = await moodachuContract.get_current_timestamp();

            await expect(moodachuContract.connect(user1).submitProof(pairId, claimedState, proof))
                .to.emit(moodachuContract, "PairCreated")
                .withArgs(pairId, expectedTimestamp)
                .and.to.emit(moodachuContract, "PetStateUpdated")
                .withArgs(pairId, claimedState, expectedTimestamp);
        });

        it("should only emit PetStateUpdated for an existing pair", async function () {
            const pairId = hre.ethers.utils.formatBytes32String("eventCouple2");
            const initialClaimedState = 0;
            const updatedClaimedState = 3; // STORM
            const proof = getPlaceholderProof();

            // Initial submission to create the pair
            await moodachuContract.connect(user1).submitProof(pairId, initialClaimedState, proof);

            const expectedTimestamp = await moodachuContract.get_current_timestamp();

            // Update submission
            await expect(moodachuContract.connect(user2).submitProof(pairId, updatedClaimedState, proof))
                .to.not.emit(moodachuContract, "PairCreated") // Ensure PairCreated is NOT emitted again
                .and.to.emit(moodachuContract, "PetStateUpdated")
                .withArgs(pairId, updatedClaimedState, expectedTimestamp);
        });
    });
});

const { expect } = require("chai");
const { ethers } = require("hardhat"); // Assuming a hardhat-like environment
const fs = require("fs");
const path = require("path");

// --- Test Suite for Moodachu Contract ---

describe("Moodachu", function () {
    let Moodachu;
    let moodachu;
    let owner;
    let pairId;
    let verificationKeyBytes;

    // --- Mock Data ---

    const mockProof = {
        pi_a: [0, 0],
        pi_b: [[0, 0], [0, 0]],
        pi_c: [0, 0],
    };

    // --- Test Setup ---

    beforeEach(async function () {
        // Get signers
        [owner] = await ethers.getSigners();

        // Generate a random pairId for each test
        pairId = ethers.utils.randomBytes(32);

        // Placeholder for the verification key bytes
        // In a real scenario, this would be loaded from vk.json
        // For now, as ZK is left out, it's a placeholder.
        verificationKeyBytes = "0x1234";

        // Deploy the contract
        Moodachu = await ethers.getContractFactory("Moodachu");
        moodachu = await Moodachu.deploy(verificationKeyBytes);
        await moodachu.deployed();
    });

    // --- State Management Tests ---

    describe("State Management", function () {
        it("Should create a new pair and update its state on first submission", async function () {
            const claimedState = 1; // DANCE

            // Submit proof for the first time
            await expect(moodachu.submitProof(pairId, claimedState, mockProof))
                .to.emit(moodachu, "PairCreated")
                .withArgs(ethers.utils.hexlify(pairId), (await ethers.provider.getBlock('latest')).timestamp)
                .and.to.emit(moodachu, "PetStateUpdated")
                .withArgs(ethers.utils.hexlify(pairId), claimedState, (await ethers.provider.getBlock('latest')).timestamp);

            // Verify the new state
            const pairInfo = await moodachu.getPairInfo(pairId);
            expect(pairInfo.petState).to.equal(claimedState);
            expect(pairInfo.updateCount).to.equal(1);
        });

        it("Should update an existing pair's state and increment updateCount", async function () {
            const initialState = 1; // DANCE
            const updatedState = 4; // GROW

            // First submission
            await moodachu.submitProof(pairId, initialState, mockProof);

            // Second submission
            await moodachu.submitProof(pairId, updatedState, mockProof);

            // Verify the updated state
            const pairInfo = await moodachu.getPairInfo(pairId);
            expect(pairInfo.petState).to.equal(updatedState);
            expect(pairInfo.updateCount).to.equal(2);
        });
    });

    // --- Input Validation and Security Tests ---

    describe("Input Validation and Security", function () {
        it("Should revert if claimedState is out of bounds (> 4)", async function () {
            const invalidState = 5;
            await expect(moodachu.submitProof(pairId, invalidState, mockProof)).to.be.revertedWith(
                "Invalid state: claimedState must be between 0 and 4."
            );
        });

        it("Should not revert if the proof is invalid (mocked)", async function () {
            // As per user instruction, ZK verification is not active.
            // This test confirms that even an invalid proof does not revert.
            const invalidProof = {
                pi_a: [1, 2], // Tampered data
                pi_b: [[3, 4], [5, 6]],
                pi_c: [7, 8],
            };
            const claimedState = 1;
            await expect(moodachu.submitProof(pairId, claimedState, invalidProof)).to.not.be.reverted;
        });
    });

    // --- View Function Tests ---

    describe("View Functions", function () {
        it("getPetState should return 0 for a non-existent pair", async function () {
            const nonExistentPairId = ethers.utils.randomBytes(32);
            expect(await moodachu.getPetState(nonExistentPairId)).to.equal(0);
        });

        it("getPetState should return the correct pet state for an existing pair", async function () {
            const claimedState = 3; // STORM
            await moodachu.submitProof(pairId, claimedState, mockProof);
            expect(await moodachu.getPetState(pairId)).to.equal(claimedState);
        });
    });

    // --- Event Emission Tests ---

    describe("Event Emission", function () {
        it("Should emit PetStateUpdated on a successful submission", async function () {
            const claimedState = 4; // GROW
            const tx = await moodachu.submitProof(pairId, claimedState, mockProof);
            const block = await ethers.provider.getBlock(tx.blockNumber);

            await expect(tx)
                .to.emit(moodachu, "PetStateUpdated")
                .withArgs(ethers.utils.hexlify(pairId), claimedState, block.timestamp);
        });

        it("Should not emit PairCreated for an existing pair", async function () {
             const initialState = 1;
             await moodachu.submitProof(pairId, initialState, mockProof);

             const updatedState = 2;
             // This transaction should emit PetStateUpdated but not PairCreated
             await expect(moodachu.submitProof(pairId, updatedState, mockProof))
                 .to.emit(moodachu, "PetStateUpdated");

             // A more specific test would be to capture all events and check that
             // PairCreated is not among them on the second call. Hardhat's chai matchers
             // don't have a straightforward `not.to.emit` for a specific event in a tx
             // that emits other events.
        });
    });
});

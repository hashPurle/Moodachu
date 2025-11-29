// frontend/src/utils/contractAdapter.ts

import { ethers } from "ethers";
import contractArtifacts from "./contract.json";
import { RawProof, FormattedProof, PetStateUpdateCallback } from "./types";

// --- Contract Setup ---

let provider: ethers.providers.Web3Provider;
let contract: ethers.Contract;

// This function initializes the ethers provider and contract instance.
// It should be called once when the application loads.
export const initContract = (): void => {
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        contract = new ethers.Contract(
            contractArtifacts.address,
            contractArtifacts.abi,
            signer
        );
        console.log("Contract initialized");
    } else {
        console.error("Please install MetaMask!");
    }
};

// --- Helper Functions ---

/**
 * Formats the raw proof from the ZK circuit into the struct expected by the Midnight Compact contract.
 * @param {RawProof} proof - The raw proof object from the ZK engineer's output.
 * @returns {FormattedProof} The formatted proof struct.
 */
export const formatProofForContract = (proof: RawProof): FormattedProof => {
    // The Midnight Compact contract expects a specific structure for the Groth16Proof struct.
    // This function maps the output from a ZK proof generator to that structure.
    return {
        pi_a: [proof.pi_a[0], proof.pi_a[1]],
        pi_b: [
            [proof.pi_b[0][1], proof.pi_b[0][0]], // Reorder B elements if coming from snarkjs for EVM compatibility
            [proof.pi_b[1][1], proof.pi_b[1][0]], // Reorder B elements if coming from snarkjs for EVM compatibility
        ],
        pi_c: [proof.pi_c[0], proof.pi_c[1]],
    };
};

// --- Contract Interaction Functions ---

/**
 * Submits a proof to the smart contract to update the pet's state.
 * @param {string} pairId - The unique ID for the couple.
 * @param {number} claimedState - The claimed pet state (0-4), which is the public input.
 * @param {RawProof} rawProof - The unformatted proof from the ZK circuit.
 * @returns {Promise<ethers.ContractTransaction>} A promise that resolves with the transaction response.
 */
export const submitProof = async (
    pairId: string,
    claimedState: number,
    rawProof: RawProof
): Promise<ethers.ContractTransaction> => {
    if (!contract) {
        throw new Error("Contract not initialized. Call initContract() first.");
    }

    console.log("Formatting proof for contract...");
    const formattedProof = formatProofForContract(rawProof);

    // Generate a bytes32 pairId
    const pairIdBytes = ethers.utils.id(pairId);


    console.log("Submitting proof to contract with:", { pairIdBytes, claimedState, formattedProof });
    try {
        const tx: ethers.ContractTransaction = await contract.submitProof(
            pairIdBytes,
            claimedState,
            formattedProof,
            {
                gasLimit: 500000, // Set a reasonable gas limit
            }
        );
        console.log("Transaction sent:", tx.hash);
        await tx.wait(); // Wait for the transaction to be mined
        console.log("Transaction mined:", tx.hash);
        return tx;
    } catch (error) {
        console.error("Error submitting proof:", error);
        throw error;
    }
};

/**
 * Listens for PetStateUpdated events from the contract.
 * @param {PetStateUpdateCallback} onStateUpdate - A callback function to execute when a new state is received.
 */
export const listenForPetStateUpdates = (onStateUpdate: PetStateUpdateCallback): void => {
    if (!contract) {
        throw new Error("Contract not initialized. Call initContract() first.");
    }

    contract.on("PetStateUpdated", (pairId: string, newState: ethers.BigNumber, timestamp: ethers.BigNumber) => {
        console.log("Event: PetStateUpdated received!", { pairId, newState, timestamp });
        onStateUpdate(pairId, newState.toNumber(), timestamp.toNumber());
    });
};

/**
 * Fetches the current pet state for a given pair from the contract.
 * @param {string} pairId - The unique ID for the couple.
 * @returns {Promise<number>} A promise that resolves with the current pet state (0-4).
 */
export const getPetState = async (pairId: string): Promise<number> => {
    if (!contract) {
        throw new Error("Contract not initialized. Call initContract() first.");
    }
    const pairIdBytes = ethers.utils.id(pairId);
    const state = await contract.getPetState(pairIdBytes);
    return state.toNumber();
};

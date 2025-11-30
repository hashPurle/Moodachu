// Filename: frontend/src/utils/moodachuContractHelpers.ts

import { Contract, providers, BigNumber, utils } from "ethers";
// Assuming you have the contract ABI generated after compilation.
// This path might vary based on your Hardhat setup.
import MoodachuAbi from "../../contract/artifacts/contracts/Moodachu.sol/Moodachu.json"; // Placeholder path

// --- 1. ABI Export Format (Conceptual) ---
// When your Moodachu Compact contract is compiled (e.g., using Hardhat for a Solidity-like setup),
// an ABI (Application Binary Interface) JSON file will be generated. This file describes
// the contract's functions, events, and their respective input/output types.
//
// Example ABI path (adjust based on your actual project structure):
// `contract/artifacts/contracts/Moodachu.sol/Moodachu.json`
//
// The content of this ABI file will be an array of JSON objects, e.g.:
// ```json
// [
//   {
//     "inputs": [ ... ],
//     "stateMutability": "nonpayable",
//     "type": "constructor"
//     // ... other functions, events ...
//   }
// ]
// ```
// You will import this `MoodachuAbi` into your frontend code as shown above.


// --- 2. Type Definitions (Mirroring Compact Contract) ---

// Assuming FieldElement maps to BigNumber for JS/TS
type FieldElement = BigNumber;

// Structure for Groth16 Proof (as received from ZK engineer)
interface RawGroth16Proof {
  pi_a: string[]; // ["0x...", "0x..."]
  pi_b: string[][]; // [["0x...", "0x..."], ["0x...", "0x..."]]
  pi_c: string[]; // ["0x...", "0x..."]
}

interface RawProofData {
  proof: RawGroth16Proof;
  publicSignals: string[]; // ["1"] // pet_state value
}

// Structure for formatted proof (as expected by contract)
interface FormattedGroth16Proof {
  pi_a: [FieldElement, FieldElement];
  pi_b: [[FieldElement, FieldElement], [FieldElement, FieldElement]];
  pi_c: [FieldElement, FieldElement];
}

// PairState structure as returned by `getPairInfo`
export interface PairState {
    id: string; // bytes32 will be a hex string in JS
    pet_state: number;
    last_update: number;
    update_count: number;
}

// --- 3. TypeScript function to format proofs for contract ---
/**
 * Formats a raw Groth16 proof and public signals into the structure expected by the Moodachu Compact contract.
 * Converts hex strings to Ethers.js BigNumber instances.
 * @param rawProofData The raw proof data received from the ZK circuit output.
 * @returns An object containing the formatted proof and the public signal (claimedState).
 */
export function formatProofForContract(rawProofData: RawProofData): { proof: FormattedGroth16Proof, claimedState: number } {
  const { proof: rawProof, publicSignals } = rawProofData;

  if (publicSignals.length !== 1) {
    throw new Error("Expected exactly one public signal (claimedState) in the proof.");
  }

  const claimedState = parseInt(publicSignals[0], 10);
  if (isNaN(claimedState) || claimedState < 0 || claimedState > 4) {
      throw new Error(`Invalid claimedState in public signals: ${publicSignals[0]}`);
  }

  const formattedProof: FormattedGroth16Proof = {
    pi_a: [BigNumber.from(rawProof.pi_a[0]), BigNumber.from(rawProof.pi_a[1])],
    pi_b: [
      [BigNumber.from(rawProof.pi_b[0][0]), BigNumber.from(rawProof.pi_b[0][1])],
      [BigNumber.from(rawProof.pi_b[1][0]), BigNumber.from(rawProof.pi_b[1][1])],
    ],
    pi_c: [BigNumber.from(rawProof.pi_c[0]), BigNumber.from(rawProof.pi_c[1])],
  };

  return { proof: formattedProof, claimedState };
}

// --- 4. Function to call submitProof from frontend ---
/**
 * Calls the `submitProof` function on the Moodachu contract.
 * @param contractInstance An ethers.js Contract instance connected to a signer.
 * @param pairId The unique identifier for the couple (e.g., a hash of their addresses).
 * @param claimedState The pet state (0-4) asserted by the ZK proof.
 * @param formattedProof The Groth16 proof formatted for the contract.
 * @returns The transaction response.
 */
export async function submitMoodachuProof(
  contractInstance: Contract,
  pairId: string, // bytes32 as hex string
  claimedState: number,
  formattedProof: FormattedGroth16Proof
): Promise<providers.TransactionResponse> {
  // Ensure pairId is a bytes32 string (e.g., 0x...)
  const formattedPairId = utils.formatBytes32String(pairId); // Or ensure it's already 32 bytes hex
  
  // Call the contract function
  const tx = await contractInstance.submitProof(formattedPairId, claimedState, formattedProof);
  return tx;
}

/**
 * Retrieves the current pet state for a given pair.
 * @param contractInstance An ethers.js Contract instance (can be connected to a provider for view calls).
 * @param pairId The unique identifier for the couple.
 * @returns The pet state (0-4).
 */
export async function getPetState(
    contractInstance: Contract,
    pairId: string
): Promise<number> {
    const formattedPairId = utils.formatBytes32String(pairId);
    const petState = await contractInstance.getPetState(formattedPairId);
    return petState.toNumber(); // Assuming it returns a BigNumber
}

/**
 * Retrieves complete pair information for a given pair.
 * @param contractInstance An ethers.js Contract instance.
 * @param pairId The unique identifier for the couple.
 * @returns The PairState object.
 */
export async function getPairInfo(
    contractInstance: Contract,
    pairId: string
): Promise<PairState> {
    const formattedPairId = utils.formatBytes32String(pairId);
    const rawPairInfo = await contractInstance.getPairInfo(formattedPairId);
    
    // Ethers.js often returns structs as arrays with named properties.
    // Convert to a cleaner interface if necessary.
    return {
        id: rawPairInfo.id, // Should already be bytes32 hex string
        pet_state: rawPairInfo.pet_state.toNumber(),
        last_update: rawPairInfo.last_update.toNumber(),
        update_count: rawPairInfo.update_count.toNumber(),
    };
}


// --- 5. Function to listen for PetStateUpdated events ---
/**
 * Listens for `PetStateUpdated` events from the Moodachu contract.
 * @param contractInstance An ethers.js Contract instance.
 * @param callback The function to call when a `PetStateUpdated` event is received.
 *                 It will receive the `pairId`, `newState`, and `timestamp` as arguments.
 */
export function listenForPetStateUpdates(
  contractInstance: Contract,
  callback: (pairId: string, newState: number, timestamp: number) => void
): void {
  contractInstance.on("PetStateUpdated", (pairId: string, newState: BigNumber, timestamp: BigNumber, event: providers.Log) => {
    console.log("PetStateUpdated Event:", { pairId, newState: newState.toNumber(), timestamp: timestamp.toNumber(), event });
    callback(pairId, newState.toNumber(), timestamp.toNumber());
  });
  console.log("Listening for PetStateUpdated events...");
}

/**
 * Function to initialize the Moodachu contract instance.
 * @param provider A Web3 provider (e.g., ethers.js JsonRpcProvider or Web3Provider).
 * @param contractAddress The deployed address of the Moodachu contract.
 * @param signer Optional: An ethers.js Signer if you need to send transactions.
 * @returns An ethers.js Contract instance.
 */
export function getMoodachuContract(
    provider: providers.Provider,
    contractAddress: string,
    signer?: providers.Signer
): Contract {
    // You can connect a Signer if you need to call state-changing functions.
    // Otherwise, connect just the Provider for view-only calls.
    const contract = new Contract(contractAddress, MoodachuAbi.abi, provider);
    return signer ? contract.connect(signer) : contract;
}

// Example usage flow:
/*
import { getMoodachuContract, formatProofForContract, submitMoodachuProof, listenForPetStateUpdates, getPetState } from './moodachuContractHelpers';
import { ethers } from 'ethers';

async function exampleFrontendUsage() {
  // 1. Initialize Provider and Signer (e.g., from MetaMask)
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []); // Request user's permission
  const signer = provider.getSigner();

  // 2. Get deployed contract address (from your `deployed_address.json` or config)
  const MOODACHU_CONTRACT_ADDRESS = "YOUR_DEPLOYED_CONTRACT_ADDRESS"; // Replace with actual address

  // 3. Get contract instance
  const moodachuContract = getMoodachuContract(provider, MOODACHU_CONTRACT_ADDRESS, signer);

  // 4. Listen for events
  listenForPetStateUpdates(moodachuContract, (pairId, newState, timestamp) => {
    console.log(`Frontend: Pet for pair ${pairId} updated to state ${newState} at ${new Date(timestamp * 1000)}`);
    // Update UI based on event
  });

  // 5. Simulate receiving a raw ZK proof
  const dummyRawProof: RawProofData = {
    proof: {
      pi_a: ["0x1", "0x2"],
      pi_b: [["0x3", "0x4"], ["0x5", "0x6"]],
      pi_c: ["0x7", "0x8"]
    },
    publicSignals: ["1"] // claimedState = 1 (DANCE)
  };

  // 6. Format proof
  const { proof: formattedProof, claimedState } = formatProofForContract(dummyRawProof);

  // 7. Submit proof (example pair ID)
  const myPairId = "myAwesomeCouple";
  console.log(`Submitting proof for pair ${myPairId} with claimed state ${claimedState}`);
  try {
    const tx = await submitMoodachuProof(moodachuContract, myPairId, claimedState, formattedProof);
    console.log("Transaction sent:", tx.hash);
    await tx.wait(); // Wait for transaction to be mined
    console.log("Transaction confirmed.");

    // 8. Get current pet state
    const currentPetState = await getPetState(moodachuContract, myPairId);
    console.log(`Current pet state for ${myPairId}: ${currentPetState}`);

  } catch (error) {
    console.error("Error submitting proof or interacting with contract:", error);
  }
}

// Call the example function
// exampleFrontendUsage();

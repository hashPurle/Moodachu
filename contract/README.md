# Moodachu Smart Contract

This document provides technical details for the Moodachu smart contract, including how to compile, deploy, and interact with it.

## 1. How to Compile

The Moodachu smart contract is written in **Midnight Compact**. To compile the contract, you will need to use the official Midnight toolchain.

**Prerequisites:**
- The Midnight SDK installed on your machine.
- Node.js and npm installed (for Hardhat deployment/testing setup).
- Dependencies installed: `npm install` in the `contract` directory.

**Compilation Steps:**
1. Navigate to the `contract` directory.
2. Run the Midnight compiler on the source file:
   ```bash
   midnightc src/moodachu_contract.midnight --output-dir build
   ```
3. This command *should* produce the compiled artifacts in the `build` directory, including a WASM binary and an ABI definition that can be used by Hardhat.

_**Note:** The exact compiler command and flags may vary. Please refer to the official Midnight documentation for the most up-to-date instructions. **I cannot verify this compilation step as I do not have access to the Midnight compiler.**_

## 2. How to Deploy

The contract can be deployed to an EVM-compatible testnet (like Midnight, if it has an EVM layer) using the provided Hardhat script.

**Prerequisites:**
- Node.js and npm installed.
- Dependencies installed: `npm install` in the `contract` directory.
- A configured Hardhat network (e.g., for a local blockchain or Midnight testnet).

**Deployment Steps:**

1. **Configure Hardhat:**
   Ensure your `hardhat.config.cjs` is set up with your desired network. Example for a local network:
   ```javascript
   module.exports = {
     solidity: "0.8.19", // Or the version compatible with Midnight's EVM
     networks: {
       hardhat: {
         // This is a local testing network
       },
       // Add other networks like Midnight testnet here
       // midnight_testnet: {
       //   url: "https://testnet.midnight.network/rpc",
       //   accounts: [`0x<YOUR_PRIVATE_KEY>`]
       // }
     }
   };
   ```
   _**Note:** You might need to configure Hardhat to work with Midnight Compact contract artifacts. This might require a specific Hardhat plugin or custom configuration based on the Midnight SDK._

2. **Run the Deployment Script:**
   Execute the deployment script using Hardhat. If deploying to a specific network, append `--network <network_name>`:
   ```bash
   npx hardhat run scripts/deploy.cjs # For local Hardhat network
   # npx hardhat run scripts/deploy.cjs --network midnight_testnet # For Midnight testnet
   ```

3. **Verify the Output:**
   The script will:
   - Log the address of the deployed `Moodachu` contract to the console.
   - Create a `contract.json` file in `frontend/src/utils` containing the `Moodachu` contract's address and ABI. The frontend uses this file to connect to the contract.

## 3. Frontend API Reference

The `frontend/src/utils/contractAdapter.ts` module provides a set of functions for interacting with the smart contract.

**`initContract(): void`**
- Initializes the connection to the smart contract. Must be called once when the app loads.

**`submitProof(pairId: string, claimedState: number, rawProof: RawProof): Promise<ethers.ContractTransaction>`**
- Submits a ZK proof to the contract.
- `pairId`: A unique string identifier for the couple.
- `claimedState`: The public input (0-4).
- `rawProof`: The raw proof object from `snarkjs`.
- _**Note:** In this Midnight Compact implementation, the `submitProof` function does NOT perform actual ZK verification, as per your instruction to leave out the ZK part._

**`listenForPetStateUpdates(callback: PetStateUpdateCallback): void`**
- Listens for `PetStateUpdated` events from the contract.
- The `callback` function will be executed with `(pairId, newState, timestamp)`.

**`getPetState(pairId: string): Promise<number>`**
- Fetches the current pet state for a given `pairId`.

## 4. Gas Optimization Notes

- **Proof Size:** If ZK verification were implemented, the size of the ZK proof would be a significant contributor to gas costs.
- **State Writes:** The `submitProof` function performs one storage write (`self.pair_states.insert`). This is efficient.
- **Gas Limit:** The frontend is currently sending a gas limit of `500,000`. For production, it's recommended to perform gas estimation to find a more optimal limit.

## 5. ZK Setup (Not Included in this Implementation)

As per your instruction, the Zero-Knowledge Proof part (including circuit compilation, trusted setup, and verifier generation) is **NOT** included in this Midnight Compact implementation. The `submitProof` function in `moodachu_contract.midnight` currently mocks successful ZK verification.

If you later decide to integrate ZK proofs, you would need:
- A working `circom` installation.
- A method to generate `Groth16Proof` objects compatible with Midnight Compact.
- An implementation of the `verify_groth16` internal function within the Midnight environment, likely using native cryptographic primitives provided by the Midnight network.

## 6. Next Steps (To run the full project)

1.  **Install Contract Dependencies:**
    ```bash
    cd contract
    npm install
    cd ..
    ```
2.  **Compile Contracts:**
    Use the Midnight compiler (as described in Section 1). You might need to configure Hardhat to correctly use the artifacts generated by the Midnight compiler.
    ```bash
    midnightc src/moodachu_contract.midnight --output-dir build # Example
    # npx hardhat compile # If Hardhat integration is set up
    ```
3.  **Run Tests:**
    ```bash
    npx hardhat test
    ```
    _**Note:** The tests will mock ZK verification as the feature is not implemented in the contract._
4.  **Deploy Contracts:**
    ```bash
    npx hardhat run scripts/deploy.cjs
    ```
5.  **Develop Frontend Proof Generation:** (If ZK is later re-introduced) Implement the logic in `frontend/src/utils/proofGenAdapter.js` to generate proofs using your ZK circuit and an appropriate tool.
6.  **Integrate Frontend:**
    - Call `initContract()` when your frontend application starts.
    - Use `submitProof()` to send mock ZK proofs to the contract.
    - Use `listenForPetStateUpdates()` to react to pet state changes.
    - Use `getPetState()` to fetch current state.
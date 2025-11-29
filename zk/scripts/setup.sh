#!/bin/bash

# Exit on first error
set -e

# --- CONFIGURATION ---
CIRCUIT_NAME=moodachu
BUILD_DIR=zk/build
CIRCUITS_DIR=zk/circuits
KEYS_DIR=contract/keys # The verification key should be in the contract's keys dir

# --- SCRIPT ---

echo "--- ZK SETUP FOR MOODACHU ---"

# Create directories if they don't exist
mkdir -p ${BUILD_DIR}
mkdir -p ${KEYS_DIR}

# 1. Compile the circuit
echo "[1] Compiling circuit..."
./zk/node_modules/.bin/circom ${CIRCUITS_DIR}/${CIRCUIT_NAME}.circom --r1cs --wasm --sym -o ${BUILD_DIR}
echo "Circuit compiled successfully."

# 2. Perform trusted setup (powers of tau)
# This is a generic setup that can be used for many circuits.
# For a real application, you would use a more secure, multi-party computation.
echo "\n[2] Performing trusted setup (powers of tau)..."
./zk/node_modules/.bin/snarkjs powersoftau new bn128 12 ${BUILD_DIR}/pot12_0000.ptau -v
./zk/node_modules/.bin/snarkjs powersoftau contribute ${BUILD_DIR}/pot12_0000.ptau ${BUILD_DIR}/pot12_0001.ptau --name="First contribution" -v
echo "Trusted setup complete."

# 3. Generate circuit-specific keys
echo "\n[3] Generating circuit-specific keys..."
./zk/node_modules/.bin/snarkjs groth16 setup ${BUILD_DIR}/${CIRCUIT_NAME}.r1cs ${BUILD_DIR}/pot12_0001.ptau ${BUILD_DIR}/${CIRCUIT_NAME}_0000.zkey
echo "Circuit-specific keys generated."

# 4. Export the verification key
echo "\n[4] Exporting verification key..."
./zk/node_modules/.bin/snarkjs zkey contribute ${BUILD_DIR}/${CIRCUIT_NAME}_0000.zkey ${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey --name="Second contribution" -v
./zk/node_modules/.bin/snarkjs zkey export verificationkey ${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey ${KEYS_DIR}/verification_key.json
echo "Verification key exported to ${KEYS_DIR}/verification_key.json"

# 5. Generate Solidity verifier contract
echo "\n[5] Generating Solidity verifier contract..."
./zk/node_modules/.bin/snarkjs zkey export solidityverifier ${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey contract/src/Verifier.sol
echo "Solidity verifier contract generated at contract/src/Verifier.sol"

# 6. Generate a witness for the proof
echo "\n[6] Generating a witness for the proof..."
node ${BUILD_DIR}/${CIRCUIT_NAME}_js/generate_witness.js ${BUILD_DIR}/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm zk/inputs.json ${BUILD_DIR}/witness.wtns

# 7. Generate a test proof
echo "\n[7] Generating a test proof..."
# We'll use a secret of 123, which should result in a valid proof for any claimedState from 0-4.
# Let's use claimedState = 1.
./zk/node_modules/.bin/snarkjs groth16 prove ${BUILD_DIR}/${CIRCUIT_NAME}_final.zkey ${BUILD_DIR}/witness.wtns ${BUILD_DIR}/proof.json ${BUILD_DIR}/public.json
echo "Test proof generated."

echo "\n--- ZK SETUP COMPLETE ---"
echo "You can now deploy the Moodachu.sol contract and use the generated verifier."
echo "A test proof has been generated in ${BUILD_DIR}/proof.json for public input [1]."

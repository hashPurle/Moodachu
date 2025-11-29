// Filename: contract/scripts/deploy_moodachu.js

// This script is designed to deploy the Moodachu smart contract to the Midnight Network
// using a conceptual Hardhat setup. It demonstrates how to interact with the contract
// (assuming it's compiled and its artifacts are available) and pass the Groth16
// Verification Key during deployment.

// IMPORTANT: This is a conceptual script.
// - You will need to install Hardhat and its dependencies (`ethers.js`).
// - The actual connection to the Midnight Network will depend on their specific Hardhat plugin
//   or RPC configuration.
// - The `verification_key.json` structure and how it's passed to the contract constructor
//   must precisely match the deployed contract's `Groth16VerificationKey` struct.

const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting Moodachu contract deployment...");

  // --- 1. Load or Define the Verification Key ---
  // For now, we use a placeholder VK.
  // In a real scenario, you would load this from `keys/verification_key.json`
  // and parse it into the structure expected by the Compact contract's constructor.
  //
  // The Compact contract's `Groth16VerificationKey` is simplified to:
  // struct Groth16VerificationKey {
  //     alpha_g1_x: FieldElement, alpha_g1_y: FieldElement,
  //     beta_g2_x_0: FieldElement, beta_g2_x_1: FieldElement, beta_g2_y_0: FieldElement, beta_g2_y_1: FieldElement,
  //     ic_length: u32,
  // }
  //
  // You will replace these placeholder values with the actual field elements from your
  // generated `verification_key.json`. Ensure they are correctly formatted (e.g., as strings
  // that can be parsed into u256/FieldElement by the contract).

  const placeholderVerificationKey = {
    alpha_g1_x: "0x01", // Example placeholder, replace with actual
    alpha_g1_y: "0x02", // Example placeholder, replace with actual
    beta_g2_x_0: "0x03", // Example placeholder, replace with actual
    beta_g2_x_1: "0x04", // Example placeholder, replace with actual
    beta_g2_y_0: "0x05", // Example placeholder, replace with actual
    beta_g2_y_1: "0x06", // Example placeholder, replace with actual
    ic_length: 1,      // We have one public input: `claimed_state`
  };

  console.log("Using placeholder Verification Key:", placeholderVerificationKey);

  // --- 2. Get Contract Factory and Signer ---
  // Assuming 'Moodachu' is the name of your compiled contract artifact.
  const MoodachuFactory = await hre.ethers.getContractFactory("Moodachu");
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contract with the account:", deployer.address);

  // --- 3. Deploy the Contract ---
  // Pass the `placeholderVerificationKey` to the contract's constructor.
  const moodachuContract = await MoodachuFactory.deploy(placeholderVerificationKey);

  await moodachuContract.deployed();

  console.log("Moodachu contract deployed to:", moodachuContract.address);

  // --- 4. Save Deployed Address to Config File ---
  const configPath = path.join(__dirname, "..", "deployed_address.json"); // Save in contract folder
  const deployedInfo = {
    network: hre.network.name,
    address: moodachuContract.address,
    verificationKeyUsed: placeholderVerificationKey, // Store for reference
    deploymentTimestamp: new Date().toISOString(),
  };

  fs.writeFileSync(configPath, JSON.stringify(deployedInfo, null, 2));
  console.log("Deployed contract address and VK saved to:", configPath);

  // --- 5. Verify Deployment Succeeded (Basic Check) ---
  // You can add more robust checks here, e.g., calling a view function.
  // For now, simply confirming the address is present.
  if (moodachuContract.address) {
    console.log("Deployment successful!");
  } else {
    console.error("Deployment failed: Contract address not found.");
    process.exit(1);
  }
}

// Hardhat standard pattern for running scripts.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

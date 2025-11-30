const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying Moodachu on Midnight...");

  // 1. Load the raw VK file exactly as bytes
  const vkPath = path.join(__dirname, "..", "keys", "verification_key.json");
  const vkJson = fs.readFileSync(vkPath, "utf8");
  const vkParsed = JSON.parse(vkJson);

  // Pass raw bytes to the contract (Midnight expects bytes)
  const vkBytes = hre.ethers.utils.toUtf8Bytes(vkJson);
  const ic_length = vkParsed.IC.length;

  // 2. Deploy contract with raw verification key bytes
  const Moodachu = await hre.ethers.getContractFactory("Moodachu");
  const [deployer] = await hre.ethers.getSigners();
  console.log("👤 Deploying with:", deployer.address);

  const contract = await Moodachu.deploy(vkBytes, ic_length);
  await contract.deployed();

  console.log("🎉 Moodachu deployed at:", contract.address);

  fs.writeFileSync(
    path.join(__dirname, "..", "deployed_address.json"),
    JSON.stringify(
      {
        address: contract.address,
        network: hre.network.name,
        timestamp: new Date().toISOString(),
      },
      null,
      2
    )
  );

  console.log("💾 Deployment info written.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

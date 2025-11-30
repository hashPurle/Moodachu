// Deployment script for the Moodachu contract

const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    // --- 1. GET DEPLOYER ACCOUNT ---
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);
    console.log("Account balance:", (await deployer.getBalance()).toString());

    // --- 2. LOAD VERIFICATION KEY ---
    // The ZK engineer would typically provide a `verification_key.json` file.
    // For this script, we'll use a placeholder as ZK part is left out.
    // IMPORTANT: Replace this placeholder logic with the actual key loading if ZK is reintroduced.
    let verificationKeyBytes;
    try {
        const vkPath = path.join(__dirname, "../keys/verification_key.json");
        const vkJson = JSON.parse(fs.readFileSync(vkPath, "utf8"));

        // Flatten the verification key components into a single byte array.
        // This is a placeholder for whatever processing is needed if ZK is reintroduced.
        verificationKeyBytes = ethers.utils.solidityPack(
            ["uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256"],
            [
                vkJson.vk_alpha_1[0], vkJson.vk_alpha_1[1],
                vkJson.vk_beta_2[0][0], vkJson.vk_beta_2[0][1],
                vkJson.vk_beta_2[1][0], vkJson.vk_beta_2[1][1],
                vkJson.vk_gamma_2[0][0], vkJson.vk_gamma_2[0][1],
                vkJson.vk_delta_2[0][0], vkJson.vk_delta_2[0][1],
                vkJson.vk_ic[0][0], vkJson.vk_ic[0][1]
            ]
        );
        console.log("Loaded and processed verification key from:", vkPath);
    } catch (error) {
        console.error("Error loading or processing verification_key.json.", error);
        console.warn("Using an empty placeholder verification key. The contract will not be able to verify real proofs.");
        verificationKeyBytes = "0x"; // Empty bytes as placeholder
    }


    // --- 3. DEPLOY THE CONTRACT ---
    console.log("\nDeploying Moodachu contract...");
    const Moodachu = await ethers.getContractFactory("Moodachu"); // Use the Hardhat-generated factory for the Midnight contract
    const moodachu = await Moodachu.deploy(verificationKeyBytes);

    await moodachu.deployed();
    console.log("Moodachu contract deployed to:", moodachu.address);

    // --- 4. SAVE ARTIFACTS FOR FRONTEND ---
    // This saves the contract address and ABI to a file that the frontend can use.
    const frontendDir = path.join(__dirname, "../../frontend/src/utils");
    if (!fs.existsSync(frontendDir)) {
        fs.mkdirSync(frontendDir, { recursive: true });
    }

    const contractArtifacts = {
        address: moodachu.address,
        abi: JSON.parse(moodachu.interface.format(ethers.utils.FormatTypes.json)),
    };

    const outputPath = path.join(frontendDir, "contract.json");
    fs.writeFileSync(
        outputPath,
        JSON.stringify(contractArtifacts, null, 2)
    );

    console.log("\nContract address and ABI saved to:", outputPath);
    console.log("Deployment complete!");
}

// --- RUN SCRIPT ---
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
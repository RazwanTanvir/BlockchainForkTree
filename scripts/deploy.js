const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment of BlockchainForkEcosystem...");

  const Factory = await hre.ethers.getContractFactory("BlockchainForkEcosystem");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  console.log("BlockchainForkEcosystem successfully deployed to:", contractAddress);

  // Write configuration for the Web UI
  const frontendDir = path.join(__dirname, "..", "frontend");
  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  const artifactPath = path.join(
    __dirname,
    "..",
    "artifacts",
    "contracts",
    "BlockchainForkEcosystem.sol",
    "BlockchainForkEcosystem.json"
  );

  let abi = [];
  if (fs.existsSync(artifactPath)) {
    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
    abi = artifact.abi;
  }

  const config = {
    contractAddress: contractAddress,
    rpcUrl: "http://127.0.0.1:8545",
    chainId: 31337,
    abi: abi,
  };

  fs.writeFileSync(
    path.join(frontendDir, "config.json"),
    JSON.stringify(config, null, 2),
    "utf8"
  );
  console.log("Saved frontend/config.json for Web UI interaction.");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});

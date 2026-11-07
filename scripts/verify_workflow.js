const hre = require("hardhat");
const config = require("../frontend/config.json");

async function main() {
  const [signer] = await hre.ethers.getSigners();
  const contract = new hre.ethers.Contract(config.contractAddress, config.abi, signer);

  console.log("Verifying BlockchainForkEcosystem at:", config.contractAddress);

  console.log("\n[1] Creating Root Chain 1 (Mainnet Root)...");
  let tx = await contract.createRootChain("Mainnet Root");
  await tx.wait();

  console.log("[2] Mining Block 1 on Chain 1...");
  tx = await contract.mineBlock(1, "TX: Genesis Liquidity Transfer");
  await tx.wait();

  console.log("[3] Spawning Fork 2 from Chain 1 at Block 1...");
  tx = await contract.createFork(1, "Autonomous Fork B");
  await tx.wait();

  console.log("[4] Mining independent Block on Fork 2...");
  tx = await contract.mineBlock(2, "TX: Sub-governance Proposal Vote");
  await tx.wait();

  console.log("[5] Mining independent Block 2 on Chain 1...");
  tx = await contract.mineBlock(1, "TX: Contract Upgrade Proposal");
  await tx.wait();

  const total = await contract.getTotalChains();
  console.log("\n--- Verification Summary ---");
  console.log("Total Chains:", Number(total));

  const chain1 = await contract.getChain(1);
  const blocks1 = await contract.getChainBlocks(1);
  console.log(`Chain 1 (${chain1.label}): Block Height = ${Number(chain1.currentBlockNumber)}, Blocks stored = ${blocks1.length}`);

  const chain2 = await contract.getChain(2);
  const blocks2 = await contract.getChainBlocks(2);
  console.log(`Chain 2 (${chain2.label}): Block Height = ${Number(chain2.currentBlockNumber)}, Forked at Block = ${Number(chain2.parentForkBlockNumber)}, Blocks stored = ${blocks2.length}`);

  const path = await contract.findLineagePath(1, 2);
  console.log("Lineage Path (1 -> 2):", path.map(Number));

  console.log("\nWorkflow verified successfully!");
}

main().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});

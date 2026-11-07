const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlockchainForkEcosystem", function () {
  let ecosystem;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BlockchainForkEcosystem");
    ecosystem = await Factory.deploy();
    await ecosystem.waitForDeployment();
  });

  it("should initialize empty with zero chains", async function () {
    expect(await ecosystem.getTotalChains()).to.equal(0);
    const allIds = await ecosystem.getAllChainIds();
    expect(allIds.length).to.equal(0);
  });

  it("should dynamically create a root blockchain and mint Genesis Block #0", async function () {
    const tx = await ecosystem.createRootChain("Mainnet Root");
    await tx.wait();

    expect(await ecosystem.getTotalChains()).to.equal(1);
    const chain = await ecosystem.getChain(1);
    expect(chain.id).to.equal(1);
    expect(chain.label).to.equal("Mainnet Root");
    expect(chain.isRoot).to.be.true;
    expect(chain.parentChainId).to.equal(0);
    expect(chain.currentBlockNumber).to.equal(0);

    const blocks = await ecosystem.getChainBlocks(1);
    expect(blocks.length).to.equal(1);
    expect(blocks[0].blockNumber).to.equal(0);
    expect(blocks[0].txPayload).to.equal("Genesis Block");
  });

  it("should mine blocks individually on a specific blockchain", async function () {
    await ecosystem.createRootChain("Root");

    // Mine Block 1
    const tx1 = await ecosystem.mineBlock(1, "TX: Transfer 50 ETH");
    await tx1.wait();

    // Mine Block 2
    const tx2 = await ecosystem.mineBlock(1, "TX: Deploy Governance Contract");
    await tx2.wait();

    const chain = await ecosystem.getChain(1);
    expect(chain.currentBlockNumber).to.equal(2);

    const blocks = await ecosystem.getChainBlocks(1);
    expect(blocks.length).to.equal(3); // Genesis #0, #1, #2
    expect(blocks[1].blockNumber).to.equal(1);
    expect(blocks[1].txPayload).to.equal("TX: Transfer 50 ETH");
    expect(blocks[2].blockNumber).to.equal(2);
    expect(blocks[2].txPayload).to.equal("TX: Deploy Governance Contract");
  });

  it("should fork an existing chain and capture exact parent fork block height", async function () {
    await ecosystem.createRootChain("Root A");
    await ecosystem.mineBlock(1, "A: Block 1");
    await ecosystem.mineBlock(1, "A: Block 2"); // Root is at Block 2

    // Create Fork B from Root A (at Block 2)
    const forkTx = await ecosystem.createFork(1, "Fork B");
    await forkTx.wait();

    expect(await ecosystem.getTotalChains()).to.equal(2);

    const forkB = await ecosystem.getChain(2);
    expect(forkB.id).to.equal(2);
    expect(forkB.label).to.equal("Fork B");
    expect(forkB.parentChainId).to.equal(1);
    expect(forkB.parentForkBlockNumber).to.equal(2);
    expect(forkB.isRoot).to.be.false;

    // Check parent's child list
    const rootA = await ecosystem.getChain(1);
    expect(rootA.childChainIds.length).to.equal(1);
    expect(rootA.childChainIds[0]).to.equal(2);
  });

  it("should allow independent diverging block mining on parent and child chains", async function () {
    await ecosystem.createRootChain("Root A");
    await ecosystem.mineBlock(1, "A: Tx 1"); // Root at Block 1

    // Spawn Fork B from Root A at Block 1
    await ecosystem.createFork(1, "Fork B");

    // Mine on Root A -> advances to Block 2
    await ecosystem.mineBlock(1, "A: Tx 2");

    // Mine on Fork B -> advances to Block 2 (on its own branch)
    await ecosystem.mineBlock(2, "B: Independent Tx 1");

    const rootA = await ecosystem.getChain(1);
    const forkB = await ecosystem.getChain(2);

    expect(rootA.currentBlockNumber).to.equal(2);
    expect(forkB.currentBlockNumber).to.equal(2); // Fork B started at 1 and incremented to 2

    const rootBlocks = await ecosystem.getChainBlocks(1);
    const forkBlocks = await ecosystem.getChainBlocks(2);

    expect(rootBlocks.length).to.equal(3); // 0, 1, 2
    expect(forkBlocks.length).to.equal(1); // Mined Block 2
    expect(forkBlocks[0].txPayload).to.equal("B: Independent Tx 1");
  });

  it("should trace lineage path between parent and child forks", async function () {
    await ecosystem.createRootChain("Root A"); // ID 1
    await ecosystem.createFork(1, "Fork B");   // ID 2 (child of 1)
    await ecosystem.createFork(2, "Fork C");   // ID 3 (child of 2)

    const path = await ecosystem.findLineagePath(1, 3);
    // Path: 1 -> 2 -> 3
    expect(path.length).to.equal(3);
    expect(path[0]).to.equal(1);
    expect(path[1]).to.equal(2);
    expect(path[2]).to.equal(3);

    // Reverse path: 3 -> 2 -> 1
    const reversePath = await ecosystem.findLineagePath(3, 1);
    expect(reversePath.length).to.equal(3);
    expect(reversePath[0]).to.equal(3);
    expect(reversePath[1]).to.equal(2);
    expect(reversePath[2]).to.equal(1);
  });
});

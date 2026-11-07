# BlockchainForkTree Studio

A dynamic framework and interactive studio for tracking, branching, and managing blockchain forks in a collaborative ecosystem.

This platform allows users to create root blockchains on demand, fork new chains from any historical block height, issue transactions to mine blocks on specific chains, and explore the evolving fork tree in real time via an interactive Web UI.

---

## Features

- **Zero Prefill (Clean Slate):** The repository initializes completely empty. Every chain and fork is created dynamically.
- **Root Chain & Hard Fork Creation:**
  - Create root blockchains with automatic Genesis Block #0 minting.
  - Spawn forks off existing chains, locking in the parent chain's block height at the moment of forking.
- **Per-Chain Block Mining:**
  - Submit custom transaction payloads to any selected chain.
  - Blocks are added exclusively to that chain's independent branch without altering sibling chains.
- **Real-Time Reactive UI:**
  - Powered by Ethers.js event listeners (`ChainCreated`, `ForkCreated`, `BlockAdded`).
  - The interactive tree, block timeline, and event stream update live without page refreshes.
- **Lineage Pathfinder (DFS):**
  - Traces the exact hop sequence between any two chains in the fork hierarchy.
- **Block Inspector:**
  - Click any block on any chain to view block hash, parent hash, transaction payload, timestamp, and miner.

---

## Project Structure

```
├── contracts/
│   └── BlockchainForkEcosystem.sol   # Core multi-chain registry & block anchoring contract
├── test/
│   └── BlockchainForkEcosystem.test.js # Automated unit tests (100% pass)
├── scripts/
│   ├── deploy.js                     # Deploys contract and exports frontend/config.json
│   ├── start_all.js                  # One-click startup for local node & web UI
│   └── verify_workflow.js            # End-to-end multi-chain verification script
├── frontend/
│   ├── index.html                    # Interactive studio dashboard (Tailwind CSS)
│   ├── app.js                        # Ethers.js controller and dynamic SVG tree renderer
│   └── config.json                   # Deployed contract address, RPC URL, and ABI
├── hardhat.config.js                 # Hardhat configuration (Solidity 0.8.20)
├── start_ecosystem.sh                # Executable startup shell script
└── package.json                      # Project dependencies and npm scripts
```

---

## Quick Start Guide

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm (v9 or higher)

### 2. Install Dependencies

```bash
npm install
```

### 3. Run Automated Unit Tests

```bash
npm test
```

### 4. Launch the Ecosystem Studio

Run the single startup command:

```bash
npm start
```

Or using the shell script:

```bash
./start_ecosystem.sh
```

This command automatically:
1. Starts an in-memory EVM node with instant block sealing on port `8545`.
2. Compiles and deploys the `BlockchainForkEcosystem` smart contract.
3. Exports the contract address and ABI to `frontend/config.json`.
4. Starts the local Web UI server at:
   👉 **http://localhost:3300**

---

## How to Use the Web Interface

1. **Initialize a Root Chain:**
   - In the **"1. Initialize Root Chain"** card, enter a name (e.g. `Ethereum Mainnet`) and click **Create Root Blockchain**.
   - Genesis Block #0 appears on the visual canvas.
2. **Mine Blocks on a Chain:**
   - In the **"3. Mine Transaction on Chain"** card, choose your target chain, type a transaction message (e.g. `Deploy DAO Governance`), and click **Mine Block**.
   - The block is added to that chain's block ribbon and block count increments.
3. **Spawn a Fork:**
   - In the **"2. Fork a Blockchain"** card, select the parent chain, enter a fork label (e.g. `Arbitrum Fork`), and click **Spawn Fork from Parent**.
   - The fork branches off the exact block height of the parent.
4. **Trace Lineage:**
   - In the **"4. Lineage Pathfinder"** card, select a source and target chain, then click **Trace Ancestry Route** to highlight the path through the tree.
5. **Inspect Blocks:**
   - Click on any block card in the horizontal timeline ribbon to inspect its cryptographic hashes, payload, and miner address in the **Block Inspector**.

---

## Citation

If you use this work in your research, please cite:

```bibtex
@inproceedings{tanvir2026tree,
  title={A Tree-Based Repository Blockchain Framework for Shared Governance in Collaborative Fork Ecosystems},
  author={Tanvir, Razwan Ahmed and Speegle, Greg},
  booktitle={ACM Conference},
  year={2026}
}
```

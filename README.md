# BlockchainForkTree

A repository blockchain framework for tracking and managing hard forks in a collaborative blockchain ecosystem.

This project implements a smart contract registry on a root blockchain to store fork events, maintain parent-child relationships, and support tree-based cross-chain traversal.

## Overview

When blockchains fork, separate networks emerge with independent transaction histories. This framework uses a repository smart contract (`MetadataBlockchain`) to:

- Record fork events, network IDs, and RPC connection details.
- Store parent-child relationships in a tree structure.
- Find paths between blockchains using depth-first search.
- Enable cross-chain discovery and state queries.

## Project Structure

- `smart-contract/`: Smart contracts, compiled ABI and binary files, and interaction scripts.
- `port8545/`, `port8546/`, `port8547/`, `port8548/`: Genesis files and local node datadirs.
- `run_experiments.py`: Script to start an isolated test node, run benchmarks, and export metrics.
- `smart-contract/benchmark_runner.js`: Web3 benchmark script that measures gas usage and search latency.
- `EVALUATION_TABLES.md`: Evaluation tables and LaTeX snippets for the research paper.
- `benchmark_*.csv`: Harvested benchmark datasets for gas costs, traversal times, and scaling.
- `visual_paradigm_seq_diagram.svg`: Sequence diagram showing the end-to-end workflow.

## Prerequisites

- Node.js (v16 or higher)
- Go Ethereum (Geth)
- Python 3

## Setup

1. Install contract dependencies:
   ```bash
   cd smart-contract
   npm install
   cd ..
   ```

2. Run the automated benchmarks:
   ```bash
   python3 run_experiments.py
   ```
   This command starts a local Geth node in development mode, deploys the contracts, runs the fork tests, and updates the CSV files.

3. Deploy and interact manually:
   - Deploy: `node smart-contract/deploy_contract.js`
   - Add a fork: `node smart-contract/add_fork_node.js`
   - Query routes: `node smart-contract/interact_with_contract.js`

## Evaluation

Performance measurements are documented in `EVALUATION_TABLES.md` and stored in the following CSV files:
- `benchmark_gas_costs.csv`: Gas costs for deployment and state updates.
- `benchmark_traversal_latency.csv`: Search latency comparing indexed traversal against blind polling.
- `benchmark_fork_scaling.csv`: Registration gas costs across different tree depths.

## Citation

If you use this work, please cite:

Razwan Ahmed Tanvir and Greg Speegle. 2026. A Tree-Based Repository Blockchain Framework for Shared Governance in Collaborative Fork Ecosystems. ACM.

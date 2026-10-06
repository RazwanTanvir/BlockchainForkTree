# Empirical Evaluation: Smart Contract Resource Consumption & Traversal Performance

This document summarizes the empirical evaluation results and performance metrics for the **BlockchainForkTree** repository blockchain framework.

---

## 1. Benchmarking Scripts & Testbed Setup

* **`run_experiments.py`**: Python orchestrator that spins up an isolated Ethereum execution client (`geth --dev`), awaits RPC readiness, executes the automated test suite, logs measurements, and cleans up the node environment.
* **`smart-contract/benchmark_runner.js`**: Node.js/Web3 test runner that deploys the smart contracts (`MetadataBlockchain` and `DataStore`), constructs the multi-chain fork tree topology ($A \rightarrow B, G$; $B \rightarrow C, F$; $C \rightarrow D \rightarrow E$; $G \rightarrow H \rightarrow I$), performs state-mutation writes, and runs indexed DFS queries against simulated blind multi-chain polling.
* **`visual_paradigm_seq_diagram.svg`**: Vector sequence diagram representing the end-to-end orchestrated workflow.

---

## 2. Evaluation Table 1: Smart Contract Gas Consumption & Latency

Raw data available in [`benchmark_gas_costs.csv`](./benchmark_gas_costs.csv).

| Smart Contract Operation | Execution Type | Gas Estimate | Gas Used | Latency (ms) | Notes / Complexity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Deploy MetadataBlockchain** | Contract Creation | 1,521,519 | **1,508,380** | 1,015.59 | 5.0% of standard 30M gas limit |
| **Deploy DataStore** | Contract Creation | 540,507 | **535,093** | 1,009.25 | Cross-chain state checkpoint sink |
| **`addFork` (Node B, Initial)** | State Mutation | 160,076 | **158,863** | 1,008.72 | Initial dynamic storage slot allocation |
| **`addFork` (Node G, NetID 77)** | State Mutation | 142,908 | **141,763** | 1,010.61 | Constant $O(1)$ write cost |
| **`addFork` (Node C, NetID 33)** | State Mutation | 142,908 | **141,763** | 1,007.98 | Constant $O(1)$ write cost |
| **`addFork` (Node F, NetID 66)** | State Mutation | 142,908 | **141,763** | 1,009.38 | Constant $O(1)$ write cost |
| **`addFork` (Node D, NetID 44)** | State Mutation | 142,908 | **141,763** | 1,009.79 | Constant $O(1)$ write cost |
| **`addFork` (Node E, NetID 55)** | State Mutation | 142,908 | **141,763** | 1,009.42 | Constant $O(1)$ write cost |
| **`addFork` (Node H, NetID 88)** | State Mutation | 142,908 | **141,763** | 1,006.34 | Constant $O(1)$ write cost |
| **`addFork` (Node I, NetID 99)** | State Mutation | 142,908 | **141,763** | 1,006.80 | Constant $O(1)$ write cost |
| **`addDataPoint` (Checkpoint)** | State Mutation | 122,317 | **121,253** | 1,008.24 | State checkpoint logging |
| **`getAllDataPoints & Filter`** | View Call (Read) | 0 | **0** | **2.92** | Local EVM read query |

---

## 3. Evaluation Table 2: Traversal Performance Across Tree Depths

Raw data available in [`benchmark_traversal_latency.csv`](./benchmark_traversal_latency.csv).

| Target Node | Network ID | Tree Depth | Hops | Indexed DFS Latency (ms) | Blind Polling Latency (ms) | Speedup Factor |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Node B** | 22 | Depth 1 | 2 | 7.58 | 49.90 | **6.58x** |
| **Node G** | 77 | Depth 1 | 2 | 5.45 | 47.49 | **8.72x** |
| **Node C** | 33 | Depth 2 | 3 | 2.10 | 69.88 | **33.30x** |
| **Node F** | 66 | Depth 2 | 3 | 1.39 | 67.66 | **48.82x** |
| **Node D** | 44 | Depth 3 | 4 | 1.20 | 92.04 | **76.59x** |
| **Node H** | 88 | Depth 2 | 3 | 0.99 | 67.53 | **67.92x** |
| **Node E** | 55 | Depth 4 | 5 | 1.21 | 116.14 | **96.35x** |
| **Node I** | 99 | Depth 3 | 4 | 1.01 | 91.21 | **90.64x** |

---

## 4. LaTeX Tables for ACM Conference Format

```latex
\begin{table}[t]
\centering
\caption{Smart Contract Resource Consumption and Execution Latency}
\label{tab:gas_evaluation}
\begin{tabular}{llrr}
\hline
\textbf{Smart Contract Operation} & \textbf{Execution Type} & \textbf{Gas Used} & \textbf{Latency (ms)} \\
\hline
Deploy MetadataBlockchain & Contract Creation & 1,508,380 & 1,015.59 \\
Deploy DataStore          & Contract Creation & 535,093   & 1,009.25 \\
addFork (Initial)         & State Mutation    & 158,863   & 1,008.72 \\
addFork (Steady-State)    & State Mutation    & 141,763   & 1,008.30 \\
addDataPoint              & State Mutation    & 121,253   & 1,008.24 \\
getAllDataPoints (Read)   & View Call (EVM)   & 0         & 2.92 \\
\hline
\end{tabular}
\end{table}

\begin{table}[t]
\centering
\caption{Lineage Traversal Performance Across Tree Depths}
\label{tab:traversal_latency}
\begin{tabular}{ccccc}
\hline
\textbf{Target Node} & \textbf{Tree Depth} & \textbf{Indexed DFS (ms)} & \textbf{Blind Polling (ms)} & \textbf{Speedup} \\
\hline
Node B (Net 22) & Depth 1 & 7.58 & 49.90  & 6.58$\times$ \\
Node C (Net 33) & Depth 2 & 2.10 & 69.88  & 33.30$\times$ \\
Node D (Net 44) & Depth 3 & 1.20 & 92.04  & 76.59$\times$ \\
Node E (Net 55) & Depth 4 & 1.21 & 116.14 & \textbf{96.35}$\times$ \\
\hline
\end{tabular}
\end{table}
```

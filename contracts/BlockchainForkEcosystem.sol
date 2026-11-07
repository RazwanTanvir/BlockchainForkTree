// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title BlockchainForkEcosystem
 * @notice Dynamic registry and state anchoring engine for tracking blockchain trees and forks.
 * Allows on-demand creation of root chains, spawning forks with parent block height anchoring,
 * and per-chain block mining.
 */
contract BlockchainForkEcosystem {
    struct BlockData {
        uint256 blockNumber;
        bytes32 blockHash;
        bytes32 parentHash;
        uint256 timestamp;
        string txPayload;
        address miner;
    }

    struct ChainNode {
        uint256 chainId;
        string label;
        uint256 parentChainId;
        uint256 parentForkBlockNumber;
        bool isRoot;
        uint256 currentBlockNumber;
        uint256[] childChainIds;
        bool exists;
    }

    uint256 public nextChainId = 1;
    uint256[] public rootChainIds;
    uint256[] public allChainIds;

    mapping(uint256 => ChainNode) public chains;
    mapping(uint256 => BlockData[]) private chainBlocks;

    // Events for live reactive UI updates
    event ChainCreated(uint256 indexed chainId, string label, bool isRoot);
    event ForkCreated(
        uint256 indexed chainId,
        uint256 indexed parentChainId,
        uint256 parentForkBlockNumber,
        string label
    );
    event BlockAdded(
        uint256 indexed chainId,
        uint256 indexed blockNumber,
        bytes32 blockHash,
        uint256 timestamp,
        string txPayload,
        address miner
    );

    // ==========================================
    // CHAIN & FORK CREATION
    // ==========================================

    /**
     * @notice Create a brand new root blockchain
     * @param label Name or identifier for the chain
     * @return chainId The assigned unique chain ID
     */
    function createRootChain(string memory label) external returns (uint256 chainId) {
        chainId = nextChainId++;

        ChainNode storage node = chains[chainId];
        node.chainId = chainId;
        node.label = label;
        node.parentChainId = 0;
        node.parentForkBlockNumber = 0;
        node.isRoot = true;
        node.currentBlockNumber = 0;
        node.exists = true;

        rootChainIds.push(chainId);
        allChainIds.push(chainId);

        // Mint Genesis Block #0 for the root chain
        bytes32 genesisHash = keccak256(abi.encodePacked(chainId, uint256(0), block.timestamp, "Genesis Block", msg.sender));
        chainBlocks[chainId].push(BlockData({
            blockNumber: 0,
            blockHash: genesisHash,
            parentHash: bytes32(0),
            timestamp: block.timestamp,
            txPayload: "Genesis Block",
            miner: msg.sender
        }));

        emit ChainCreated(chainId, label, true);
        emit BlockAdded(chainId, 0, genesisHash, block.timestamp, "Genesis Block", msg.sender);
    }

    /**
     * @notice Fork an existing blockchain at its current block height
     * @param parentChainId The ID of the chain being forked
     * @param label Name for the new forked chain
     * @return newChainId The assigned unique chain ID for the fork
     */
    function createFork(uint256 parentChainId, string memory label) external returns (uint256 newChainId) {
        require(chains[parentChainId].exists, "Parent chain does not exist");

        newChainId = nextChainId++;
        uint256 forkBlockNum = chains[parentChainId].currentBlockNumber;

        ChainNode storage node = chains[newChainId];
        node.chainId = newChainId;
        node.label = label;
        node.parentChainId = parentChainId;
        node.parentForkBlockNumber = forkBlockNum;
        node.isRoot = false;
        node.currentBlockNumber = forkBlockNum;
        node.exists = true;

        chains[parentChainId].childChainIds.push(newChainId);
        allChainIds.push(newChainId);

        emit ForkCreated(newChainId, parentChainId, forkBlockNum, label);
    }

    /**
     * @notice Mine a new block on a specific chain by appending a transaction payload
     * @param chainId The chain ID where the block should be added
     * @param txPayload Transaction description or state mutation message
     */
    function mineBlock(uint256 chainId, string memory txPayload) external returns (uint256 newBlockNumber, bytes32 newBlockHash) {
        require(chains[chainId].exists, "Chain does not exist");

        ChainNode storage node = chains[chainId];
        node.currentBlockNumber++;
        newBlockNumber = node.currentBlockNumber;

        bytes32 lastHash = bytes32(0);
        if (chainBlocks[chainId].length > 0) {
            lastHash = chainBlocks[chainId][chainBlocks[chainId].length - 1].blockHash;
        } else if (!node.isRoot && chains[node.parentChainId].exists) {
            uint256 parentBlocksCount = chainBlocks[node.parentChainId].length;
            if (parentBlocksCount > 0) {
                lastHash = chainBlocks[node.parentChainId][parentBlocksCount - 1].blockHash;
            }
        }

        newBlockHash = keccak256(abi.encodePacked(chainId, newBlockNumber, lastHash, block.timestamp, txPayload, msg.sender));

        chainBlocks[chainId].push(BlockData({
            blockNumber: newBlockNumber,
            blockHash: newBlockHash,
            parentHash: lastHash,
            timestamp: block.timestamp,
            txPayload: txPayload,
            miner: msg.sender
        }));

        emit BlockAdded(chainId, newBlockNumber, newBlockHash, block.timestamp, txPayload, msg.sender);
    }

    // ==========================================
    // VIEW FUNCTIONS & TRAVERSAL
    // ==========================================

    function getTotalChains() external view returns (uint256) {
        return allChainIds.length;
    }

    function getAllChainIds() external view returns (uint256[] memory) {
        return allChainIds;
    }

    function getChain(uint256 chainId) external view returns (
        uint256 id,
        string memory label,
        uint256 parentChainId,
        uint256 parentForkBlockNumber,
        bool isRoot,
        uint256 currentBlockNumber,
        uint256[] memory childChainIds
    ) {
        require(chains[chainId].exists, "Chain does not exist");
        ChainNode storage n = chains[chainId];
        return (
            n.chainId,
            n.label,
            n.parentChainId,
            n.parentForkBlockNumber,
            n.isRoot,
            n.currentBlockNumber,
            n.childChainIds
        );
    }

    function getChainBlocks(uint256 chainId) external view returns (BlockData[] memory) {
        require(chains[chainId].exists, "Chain does not exist");
        return chainBlocks[chainId];
    }

    /**
     * @notice Find ancestry lineage path from source to target
     * @param sourceId Starting chain ID
     * @param targetId Destination chain ID
     * @return path Array of chain IDs in order of traversal
     */
    function findLineagePath(uint256 sourceId, uint256 targetId) external view returns (uint256[] memory path) {
        require(chains[sourceId].exists && chains[targetId].exists, "Chains must exist");

        uint256[] memory sourceAncestors = new uint256[](allChainIds.length + 1);
        uint256 sourceCount = 0;
        uint256 curr = sourceId;
        while (curr != 0 && chains[curr].exists) {
            sourceAncestors[sourceCount++] = curr;
            curr = chains[curr].parentChainId;
        }

        uint256[] memory targetAncestors = new uint256[](allChainIds.length + 1);
        uint256 targetCount = 0;
        curr = targetId;
        while (curr != 0 && chains[curr].exists) {
            targetAncestors[targetCount++] = curr;
            curr = chains[curr].parentChainId;
        }

        int256 lcaIndexSource = -1;
        int256 lcaIndexTarget = -1;
        for (uint256 i = 0; i < sourceCount; i++) {
            for (uint256 j = 0; j < targetCount; j++) {
                if (sourceAncestors[i] == targetAncestors[j]) {
                    lcaIndexSource = int256(i);
                    lcaIndexTarget = int256(j);
                    break;
                }
            }
            if (lcaIndexSource != -1) break;
        }

        if (lcaIndexSource == -1) {
            return new uint256[](0);
        }

        uint256 totalHops = uint256(lcaIndexSource) + uint256(lcaIndexTarget) + 1;
        path = new uint256[](totalHops);
        uint256 idx = 0;

        for (uint256 i = 0; i <= uint256(lcaIndexSource); i++) {
            path[idx++] = sourceAncestors[i];
        }

        if (uint256(lcaIndexTarget) > 0) {
            for (int256 j = lcaIndexTarget - 1; j >= 0; j--) {
                path[idx++] = targetAncestors[uint256(j)];
            }
        }

        return path;
    }
}

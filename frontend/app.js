// Frontend controller for BlockchainForkTree Studio (Light / Offwhite Theme)
let provider = null;
let signer = null;
let contract = null;
let config = null;

let allChains = [];
let selectedChainId = null;
let selectedBlockNumber = null;
let activeLineagePath = [];

// Initialize application
window.addEventListener("DOMContentLoaded", async () => {
  logEvent("Application loaded. Connecting to local EVM node...");
  await initEthers();
});

function logEvent(msg, type = "info") {
  const log = document.getElementById("eventLog");
  if (!log) return;
  const time = new Date().toLocaleTimeString();
  const line = document.createElement("div");
  line.className = "flex items-start gap-2 text-[11px] leading-relaxed";
  let color = "text-slate-600";
  if (type === "success") color = "text-emerald-700 font-medium";
  if (type === "warn") color = "text-orange-700 font-medium";
  if (type === "error") color = "text-red-600 font-medium";

  line.innerHTML = `<span class="text-slate-400 font-mono">[${time}]</span> <span class="${color}">${msg}</span>`;
  log.prepend(line);
}

async function initEthers() {
  try {
    const res = await fetch("config.json");
    if (!res.ok) {
      throw new Error("Could not find config.json. Has the contract been deployed?");
    }
    config = await res.json();

    provider = new ethers.JsonRpcProvider(config.rpcUrl);
    signer = await provider.getSigner(0);

    const net = await provider.getNetwork();
    const dot = document.getElementById("connectionDot");
    dot.className = "w-2 h-2 rounded-full bg-emerald-600";
    document.getElementById("connectionText").innerText = `Connected (Chain ID: ${net.chainId})`;
    logEvent(`Connected to EVM node at ${config.rpcUrl}`, "success");

    contract = new ethers.Contract(config.contractAddress, config.abi, signer);
    logEvent(`Loaded BlockchainForkEcosystem at ${config.contractAddress}`, "success");

    setupEventListeners();
    await refreshData();

  } catch (err) {
    console.error("Initialization error:", err);
    const dot = document.getElementById("connectionDot");
    if (dot) dot.className = "w-2 h-2 rounded-full bg-red-600";
    const text = document.getElementById("connectionText");
    if (text) text.innerText = "Connection Failed";
    logEvent(`Connection Error: ${err.message}`, "error");
  }
}

function setupEventListeners() {
  if (!contract) return;

  contract.on("ChainCreated", (chainId, label, isRoot) => {
    logEvent(`EVENT: Root Chain Created -> #${chainId} (${label})`, "success");
    refreshData();
  });

  contract.on("ForkCreated", (chainId, parentChainId, parentForkBlock, label) => {
    logEvent(`EVENT: Fork Created -> #${chainId} (${label}) branched from Chain #${parentChainId} @ Block #${parentForkBlock}`, "success");
    refreshData();
  });

  contract.on("BlockAdded", (chainId, blockNumber, blockHash, timestamp, txPayload, miner) => {
    logEvent(`EVENT: Block Mined -> Chain #${chainId} mined Block #${blockNumber} ("${txPayload}")`, "success");
    refreshData();
  });
}

// Fetch all ecosystem data and redraw UI
async function refreshData() {
  if (!contract) return;

  try {
    const totalChainsBn = await contract.getTotalChains();
    const totalCount = Number(totalChainsBn);
    document.getElementById("totalChainsBadge").innerText = totalCount;

    if (totalCount === 0) {
      allChains = [];
      document.getElementById("treeEmptyState").classList.remove("hidden");
      document.getElementById("treeContainer").classList.add("hidden");
      updateSelectOptions();
      return;
    }

    document.getElementById("treeEmptyState").classList.add("hidden");
    document.getElementById("treeContainer").classList.remove("hidden");

    const chainIds = await contract.getAllChainIds();
    const fetchedChains = [];
    let cumulativeBlocks = 0;

    for (let id of chainIds) {
      const data = await contract.getChain(id);
      const blocks = await contract.getChainBlocks(id);
      cumulativeBlocks += blocks.length;

      fetchedChains.push({
        id: Number(data.id),
        label: data.label,
        parentChainId: Number(data.parentChainId),
        parentForkBlockNumber: Number(data.parentForkBlockNumber),
        isRoot: data.isRoot,
        currentBlockNumber: Number(data.currentBlockNumber),
        childChainIds: data.childChainIds.map(c => Number(c)),
        blocks: blocks.map(b => ({
          blockNumber: Number(b.blockNumber),
          blockHash: b.blockHash,
          parentHash: b.parentHash,
          timestamp: Number(b.timestamp),
          txPayload: b.txPayload,
          miner: b.miner
        }))
      });
    }

    allChains = fetchedChains;
    document.getElementById("totalBlocksBadge").innerText = cumulativeBlocks;

    updateSelectOptions();
    renderTree();

    if (selectedChainId && allChains.some(c => c.id === selectedChainId)) {
      selectChain(selectedChainId);
    } else if (allChains.length > 0) {
      selectChain(allChains[0].id);
    }

  } catch (err) {
    console.error("Refresh error:", err);
    logEvent(`Error fetching data: ${err.message}`, "error");
  }
}

function updateSelectOptions() {
  const forkParentSelect = document.getElementById("forkParentSelect");
  const mineTargetSelect = document.getElementById("mineTargetSelect");
  const pathSourceSelect = document.getElementById("pathSourceSelect");
  const pathTargetSelect = document.getElementById("pathTargetSelect");

  if (allChains.length === 0) {
    forkParentSelect.innerHTML = '<option value="" disabled selected>No chains available</option>';
    mineTargetSelect.innerHTML = '<option value="" disabled selected>No chains available</option>';
    pathSourceSelect.innerHTML = '<option value="" disabled selected>No chains</option>';
    pathTargetSelect.innerHTML = '<option value="" disabled selected>No chains</option>';
    return;
  }

  let optionsHtml = "";
  for (let c of allChains) {
    optionsHtml += `<option value="${c.id}">Chain #${c.id}: ${c.label} (Block #${c.currentBlockNumber})</option>`;
  }

  forkParentSelect.innerHTML = optionsHtml;
  mineTargetSelect.innerHTML = optionsHtml;
  pathSourceSelect.innerHTML = optionsHtml;
  pathTargetSelect.innerHTML = optionsHtml;

  if (selectedChainId) {
    mineTargetSelect.value = selectedChainId;
    forkParentSelect.value = selectedChainId;
  }
}

// ==========================================
// USER ACTION HANDLERS
// ==========================================

async function handleCreateRoot(event) {
  event.preventDefault();
  const label = document.getElementById("rootLabel").value.trim();
  if (!label || !contract) return;

  const btn = document.getElementById("btnCreateRoot");
  btn.disabled = true;
  btn.innerText = "Creating...";

  try {
    logEvent(`Submitting createRootChain("${label}")...`);
    const tx = await contract.createRootChain(label);
    await tx.wait();
    document.getElementById("rootLabel").value = "";
    logEvent(`Root chain "${label}" created successfully!`, "success");
    await refreshData();
  } catch (err) {
    console.error("Error creating root chain:", err);
    logEvent(`Failed to create root chain: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
    btn.innerText = "Create Root Blockchain";
  }
}

async function handleCreateFork(event) {
  event.preventDefault();
  const parentId = document.getElementById("forkParentSelect").value;
  const label = document.getElementById("forkLabel").value.trim();
  if (!parentId || !label || !contract) return;

  const btn = document.getElementById("btnCreateFork");
  btn.disabled = true;
  btn.innerText = "Spawning Fork...";

  try {
    logEvent(`Submitting createFork(parent=${parentId}, "${label}")...`);
    const tx = await contract.createFork(Number(parentId), label);
    await tx.wait();
    document.getElementById("forkLabel").value = "";
    logEvent(`Fork "${label}" branched successfully!`, "success");
    await refreshData();
  } catch (err) {
    console.error("Error creating fork:", err);
    logEvent(`Failed to create fork: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
    btn.innerText = "Spawn Fork from Parent";
  }
}

async function handleMineBlock(event) {
  event.preventDefault();
  const targetId = document.getElementById("mineTargetSelect").value;
  const payload = document.getElementById("txPayload").value.trim();
  if (!targetId || !payload || !contract) return;

  const btn = document.getElementById("btnMineBlock");
  btn.disabled = true;
  btn.innerText = "Mining Block...";

  try {
    logEvent(`Submitting mineBlock(chain=${targetId}, "${payload}")...`);
    const tx = await contract.mineBlock(Number(targetId), payload);
    await tx.wait();
    document.getElementById("txPayload").value = "";
    logEvent(`Block mined on Chain #${targetId}!`, "success");
    await refreshData();
  } catch (err) {
    console.error("Error mining block:", err);
    logEvent(`Failed to mine block: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
    btn.innerText = "Mine Block on Selected Chain";
  }
}

async function handleFindPath() {
  const sourceId = document.getElementById("pathSourceSelect").value;
  const targetId = document.getElementById("pathTargetSelect").value;
  const resultBox = document.getElementById("pathResultBox");
  const resultText = document.getElementById("pathResultText");

  if (!sourceId || !targetId || !contract) return;

  try {
    logEvent(`Tracing lineage from Chain #${sourceId} to #${targetId}...`);
    const path = await contract.findLineagePath(Number(sourceId), Number(targetId));
    activeLineagePath = path.map(p => Number(p));

    if (activeLineagePath.length === 0) {
      resultBox.classList.remove("hidden");
      resultText.innerText = "No lineage path exists (Disjoint trees)";
      logEvent("No lineage path found.", "warn");
    } else {
      const labels = activeLineagePath.map(id => {
        const c = allChains.find(ch => ch.id === id);
        return c ? `${c.label} (#${id})` : `#${id}`;
      });
      resultBox.classList.remove("hidden");
      resultText.innerText = labels.join(" ➔ ");
      logEvent(`Lineage Path (${activeLineagePath.length - 1} hops): ${labels.join(" -> ")}`, "success");
    }

    renderTree();

  } catch (err) {
    console.error("Path error:", err);
    logEvent(`Pathfinding error: ${err.message}`, "error");
  }
}

// ==========================================
// VISUAL RENDERING (LIGHT THEME)
// ==========================================

function selectChain(chainId) {
  selectedChainId = chainId;
  const chain = allChains.find(c => c.id === chainId);
  if (!chain) return;

  document.getElementById("selectedChainTitle").innerText = chain.label;
  const badge = document.getElementById("selectedChainBadge");
  badge.classList.remove("hidden");
  badge.innerText = `Chain #${chain.id} (${chain.isRoot ? "Root Chain" : "Fork Chain"})`;
  badge.className = chain.isRoot
    ? "text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300"
    : "text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold bg-orange-100 text-orange-800 border border-orange-300";

  const metaBox = document.getElementById("selectedChainMeta");
  if (!chain.isRoot) {
    metaBox.classList.remove("hidden");
    document.getElementById("selectedForkBlock").innerText = chain.parentForkBlockNumber;
  } else {
    metaBox.classList.add("hidden");
  }

  renderBlockRibbon(chain);
  renderTree();
}

function renderBlockRibbon(chain) {
  const container = document.getElementById("blocksContainer");
  container.innerHTML = "";

  if (!chain.blocks || chain.blocks.length === 0) {
    container.innerHTML = '<div class="text-xs text-slate-400 italic">No blocks mined on this chain yet.</div>';
    return;
  }

  if (!chain.isRoot) {
    const inhDiv = document.createElement("div");
    inhDiv.className = "flex-shrink-0 px-3 py-2 rounded-xl bg-orange-50 border border-dashed border-orange-300 text-orange-800 text-xs text-center flex flex-col justify-center";
    inhDiv.innerHTML = `<span class="font-bold text-[11px] text-orange-900">Fork Origin</span><span class="text-[10px] text-orange-700">Inherited 0..#${chain.parentForkBlockNumber}</span>`;
    container.appendChild(inhDiv);

    const arrow = document.createElement("div");
    arrow.className = "text-slate-400 font-bold";
    arrow.innerText = "➔";
    container.appendChild(arrow);
  }

  chain.blocks.forEach((b, index) => {
    const card = document.createElement("div");
    const isSelected = selectedBlockNumber === b.blockNumber;
    card.className = `flex-shrink-0 p-3 rounded-xl border cursor-pointer transition select-none min-w-[130px] ${
      isSelected
        ? "bg-orange-50 border-orange-500 text-orange-950 shadow-sm"
        : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800"
    }`;
    card.onclick = () => inspectBlock(chain, b);

    card.innerHTML = `
      <div class="flex items-center justify-between gap-1 mb-1">
        <span class="font-mono font-bold text-xs ${b.blockNumber === 0 ? "text-emerald-700" : "text-orange-700"}">
          Block #${b.blockNumber}
        </span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${b.blockNumber === 0 ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"}">
          ${b.blockNumber === 0 ? "Genesis" : "Mined"}
        </span>
      </div>
      <div class="text-[11px] font-sans truncate text-slate-600 max-w-[120px]" title="${b.txPayload}">
        ${b.txPayload}
      </div>
      <div class="text-[10px] font-mono text-slate-400 mt-1 truncate">
        ${b.blockHash.substring(0, 10)}...
      </div>
    `;

    container.appendChild(card);

    if (index < chain.blocks.length - 1) {
      const conn = document.createElement("div");
      conn.className = "text-slate-300 text-xs";
      conn.innerText = "─";
      container.appendChild(conn);
    }
  });

  if (chain.blocks.length > 0 && selectedBlockNumber === null) {
    inspectBlock(chain, chain.blocks[chain.blocks.length - 1]);
  }
}

function inspectBlock(chain, block) {
  selectedBlockNumber = block.blockNumber;
  const insp = document.getElementById("blockInspectorSection");
  insp.classList.remove("hidden");

  document.getElementById("inspBlockNum").innerText = `Block #${block.blockNumber}`;
  document.getElementById("inspChainLabel").innerText = `Chain: ${chain.label} (#${chain.id})`;
  document.getElementById("inspBlockHash").innerText = block.blockHash;
  document.getElementById("inspParentHash").innerText = block.parentHash;
  document.getElementById("inspTxPayload").innerText = block.txPayload;
  document.getElementById("inspMiner").innerText = block.miner;

  renderBlockRibbon(chain);
}

// Render visual SVG Tree for offwhite canvas
function renderTree() {
  const svg = document.getElementById("treeSvg");
  if (!svg || allChains.length === 0) return;

  svg.innerHTML = "";

  const nodeMap = new Map();
  allChains.forEach(c => {
    nodeMap.set(c.id, {
      chain: c,
      depth: 0,
      x: 0,
      y: 0,
      children: []
    });
  });

  const rootNodes = [];
  allChains.forEach(c => {
    const node = nodeMap.get(c.id);
    if (c.isRoot || !nodeMap.has(c.parentChainId)) {
      rootNodes.push(node);
    } else {
      const parentNode = nodeMap.get(c.parentChainId);
      parentNode.children.push(node);
    }
  });

  function layoutNode(node, depth, yStart) {
    node.depth = depth;
    node.x = 40 + depth * 190;
    node.y = yStart;

    let childY = yStart;
    node.children.forEach((child) => {
      layoutNode(child, depth + 1, childY);
      childY += 75;
    });

    return Math.max(yStart + 75, childY);
  }

  let curY = 40;
  rootNodes.forEach(r => {
    curY = layoutNode(r, 0, curY);
  });

  svg.setAttribute("height", Math.max(260, curY + 20));

  // 1. Draw Links between Nodes
  allChains.forEach(c => {
    if (!c.isRoot && nodeMap.has(c.parentChainId)) {
      const parent = nodeMap.get(c.parentChainId);
      const child = nodeMap.get(c.id);

      const isPathActive = activeLineagePath.includes(parent.chain.id) && activeLineagePath.includes(child.chain.id);

      const pathEl = document.createElementNS("http://www.w3.org/2000/svg", "path");
      const d = `M ${parent.x + 140} ${parent.y + 23} C ${parent.x + 175} ${parent.y + 23}, ${child.x - 35} ${child.y + 23}, ${child.x} ${child.y + 23}`;
      pathEl.setAttribute("d", d);
      pathEl.setAttribute("fill", "none");
      pathEl.setAttribute("stroke", isPathActive ? "#ea580c" : "#cbd5e1");
      pathEl.setAttribute("stroke-width", isPathActive ? "3.5" : "1.8");
      if (isPathActive) {
        pathEl.classList.add("lineage-active");
      }
      svg.appendChild(pathEl);
    }
  });

  // 2. Draw Nodes (Green for Root, Orange for Fork)
  nodeMap.forEach(n => {
    const isSelected = selectedChainId === n.chain.id;
    const isPathNode = activeLineagePath.includes(n.chain.id);

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.style.cursor = "pointer";
    g.onclick = () => selectChain(n.chain.id);

    // Node Box
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", n.x);
    rect.setAttribute("y", n.y);
    rect.setAttribute("width", 140);
    rect.setAttribute("height", 46);
    rect.setAttribute("rx", 10);

    // Green for Root, Orange for Fork
    const fillColor = n.chain.isRoot ? "#047857" : "#ea580c";
    rect.setAttribute("fill", fillColor);
    rect.setAttribute("stroke", isSelected ? "#000000" : (isPathNode ? "#000000" : (n.chain.isRoot ? "#065f46" : "#c2410c")));
    rect.setAttribute("stroke-width", isSelected ? "3" : "1.5");
    if (isSelected) {
      rect.classList.add("node-pulse");
    }

    // Label Text
    const textLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textLabel.setAttribute("x", n.x + 12);
    textLabel.setAttribute("y", n.y + 19);
    textLabel.setAttribute("fill", "#ffffff");
    textLabel.setAttribute("font-size", "11px");
    textLabel.setAttribute("font-weight", "bold");
    textLabel.textContent = n.chain.label.length > 15 ? n.chain.label.substring(0, 14) + "..." : n.chain.label;

    // Subtitle Text (Chain ID & Block Height)
    const textSub = document.createElementNS("http://www.w3.org/2000/svg", "text");
    textSub.setAttribute("x", n.x + 12);
    textSub.setAttribute("y", n.y + 35);
    textSub.setAttribute("fill", n.chain.isRoot ? "#d1fae5" : "#ffedd5");
    textSub.setAttribute("font-size", "10px");
    textSub.setAttribute("font-family", "monospace");
    textSub.textContent = `ID #${n.chain.id} | B#${n.chain.currentBlockNumber}`;

    g.appendChild(rect);
    g.appendChild(textLabel);
    g.appendChild(textSub);
    svg.appendChild(g);
  });
}

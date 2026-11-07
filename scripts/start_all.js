const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const RPC_PORT = 8545;
const WEB_PORT = process.env.PORT || 3300;
const FRONTEND_DIR = path.join(__dirname, "..", "frontend");

async function checkRpc() {
  return new Promise((resolve) => {
    const req = http.request(
      `http://127.0.0.1:${RPC_PORT}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        timeout: 1000,
      },
      (res) => {
        resolve(res.statusCode === 200 || res.statusCode === 400 || res.statusCode === 405);
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.write(JSON.stringify({ jsonrpc: "2.0", method: "net_version", params: [], id: 1 }));
    req.end();
  });
}

function startWebServer() {
  const mimeTypes = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
  };

  const server = http.createServer((req, res) => {
    let filePath = path.join(FRONTEND_DIR, req.url === "/" ? "index.html" : req.url);
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || "application/octet-stream";

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === "ENOENT") {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("404 Not Found");
        } else {
          res.writeHead(500);
          res.end("Server Error: " + err.code);
        }
      } else {
        res.writeHead(200, {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
        });
        res.end(content, "utf-8");
      }
    });
  });

  server.listen(WEB_PORT, "0.0.0.0", () => {
    console.log("\n=======================================================");
    console.log(` BlockchainForkTree Studio Web UI is running!`);
    console.log(` Open URL: http://localhost:${WEB_PORT}`);
    console.log("=======================================================\n");
  });
}

async function main() {
  console.log("[1/3] Checking for active EVM RPC node on port 8545...");
  let rpcReady = await checkRpc();

  if (!rpcReady) {
    console.log("Starting in-memory Hardhat node (instant automining)...");
    const nodeProcess = spawn("npx", ["hardhat", "node", "--port", `${RPC_PORT}`], {
      cwd: path.join(__dirname, ".."),
      stdio: "ignore",
      detached: true,
    });
    nodeProcess.unref();

    // Poll until node is ready
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 800));
      rpcReady = await checkRpc();
      if (rpcReady) break;
    }
  }

  if (!rpcReady) {
    console.error("Failed to connect to local EVM node.");
    process.exit(1);
  }
  console.log("EVM node is ready on port 8545.");

  console.log("[2/3] Deploying BlockchainForkEcosystem smart contract...");
  const deploy = spawn("npx", ["hardhat", "run", "scripts/deploy.js", "--network", "localhost"], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
  });

  deploy.on("close", (code) => {
    if (code !== 0) {
      console.error("Deployment failed with exit code:", code);
      process.exit(code);
    }

    console.log("[3/3] Starting Frontend Web Server...");
    startWebServer();
  });
}

main();

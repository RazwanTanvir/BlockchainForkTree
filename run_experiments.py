#!/usr/bin/env python3
import subprocess
import time
import urllib.request
import json
import os
import shutil
import signal
import sys

GETH_DATADIR = "/tmp/geth_bench_run"
GETH_PORT = 8545
GETH_URL = f"http://127.0.0.1:{GETH_PORT}"

def cleanup():
    if os.path.exists(GETH_DATADIR):
        try:
            shutil.rmtree(GETH_DATADIR)
        except Exception:
            pass

def check_rpc():
    try:
        req = urllib.request.Request(
            GETH_URL,
            data=json.dumps({"jsonrpc":"2.0","method":"net_version","params":[],"id":1}).encode('utf-8'),
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=1) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            return 'result' in data
    except Exception:
        return False

def main():
    print("[*] Preparing testbed environment...")
    cleanup()
    os.makedirs(GETH_DATADIR, exist_ok=True)

    geth_cmd = [
        "geth",
        "--dev",
        "--datadir", GETH_DATADIR,
        "--http",
        "--http.addr", "127.0.0.1",
        "--http.port", str(GETH_PORT),
        "--http.api", "eth,net,web3,admin,debug,txpool",
        "--ipcdisable"
    ]

    print("[*] Starting Geth background node in --dev mode...")
    geth_log_file = open("/tmp/geth_bench.log", "w")
    geth_proc = subprocess.Popen(
        geth_cmd,
        stdout=geth_log_file,
        stderr=subprocess.STDOUT
    )

    try:
        # Wait for RPC to become available
        ready = False
        for _ in range(30):
            time.sleep(0.3)
            if check_rpc():
                ready = True
                break

        if not ready:
            print("[-] Geth RPC did not become ready in time.")
            if os.path.exists("/tmp/geth_bench.log"):
                with open("/tmp/geth_bench.log") as f:
                    print("--- Geth Log ---")
                    print(f.read())
                    print("----------------")
            sys.exit(1)

        print("[+] Geth RPC is active and accepting connections at", GETH_URL)
        print("[*] Running benchmark suite (node benchmark_runner.js)...")

        script_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "smart-contract")
        bench_proc = subprocess.run(
            ["node", "benchmark_runner.js"],
            cwd=script_dir,
            capture_output=True,
            text=True
        )

        print(bench_proc.stdout)
        if bench_proc.stderr:
            print("[STDERR]", bench_proc.stderr)

        if bench_proc.returncode != 0:
            print("[-] Benchmark script exited with error code", bench_proc.returncode)
            sys.exit(bench_proc.returncode)

    finally:
        print("[*] Terminating Geth node...")
        geth_proc.terminate()
        try:
            geth_proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            geth_proc.kill()
        cleanup()
        print("[+] Environment cleaned up.")

if __name__ == "__main__":
    main()

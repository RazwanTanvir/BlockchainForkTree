//To run this, in terminal: "node ./deploy_contract.js"
// deploy_contract.js
const Web3 = require('web3');
const fs = require('fs');

const web3 = new Web3('http://localhost:8545'); // Replace with the address of your local Ethereum node

const bytecode = fs.readFileSync('./build/Contracts/BlockData.bin').toString();
const abi = JSON.parse(fs.readFileSync('./build/Contracts/BlockData.abi'));
const accounts = await web3.eth.getAccounts();
web3.eth.personal.unlockAccount(accounts[0], "1234567890", 6000);

// const deployedAt;

async function deployContract() {
    try {
        const accounts = await web3.eth.getAccounts();
        const contract = new web3.eth.Contract(abi);

        const deployment = contract.deploy({ data: bytecode });
        const gas = await deployment.estimateGas();
        const instance = await deployment.send({ from: accounts[0], gas: gas });

        // deployedAt = instance.options.address;
        console.log("Contract deployed at address:", deployedAt);
    } catch (error) {
        console.error("Error deploying the contract:", error);
    }
}

deployContract();

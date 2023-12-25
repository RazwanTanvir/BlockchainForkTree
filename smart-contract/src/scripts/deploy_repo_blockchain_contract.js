
// deploy_contract.js
const Web3 = require('web3');
const fs = require('fs');

const contractAddressList= {};

async function deployContract(web3Provider, accountPassword) {
    try {
        const web3 = new Web3(web3Provider);

        const bytecode = fs.readFileSync('./build/Contracts/BlockData.bin').toString();
        const abi = JSON.parse(fs.readFileSync('./build/Contracts/BlockData.abi'));

        // Unlock the account for deployment
        const accounts = await web3.eth.getAccounts();
        await web3.eth.personal.unlockAccount(accounts[0], accountPassword, 6000);

        const contract = new web3.eth.Contract(abi);

        const deployment = contract.deploy({ data: bytecode });
        const gas = await deployment.estimateGas();
        const instance = await deployment.send({ from: accounts[0], gas: gas });

        // contractAddressList[web3Provider] = instance.options.address;
        console.log("Contract deployed at address for (" + web3Provider + "): ", instance.options.address);
        return instance.options.address;
    } catch (error) {
        console.error("Error deploying the contract:", error);
    }
}

/* Function call */
// Example usage for deploying to a different blockchain
const web3Provider = 'http://localhost:8545'; // Replace with the address of your different Ethereum node
const accountPassword = '1234567890'; // Replace with the password for the account

const addr1 = deployContract(web3Provider, accountPassword);


const web3Provider1 = 'http://localhost:8546'; // Replace with the address of your different Ethereum node
const accountPassword1 = '1234567890'; // Replace with the password for the account
deployContract(web3Provider1, accountPassword1);

const web3Provider2 = 'http://localhost:8547'; // Replace with the address of your different Ethereum node
const accountPassword2 = '1234567890'; // Replace with the password for the account
deployContract(web3Provider2, accountPassword2);


module.exports = addr1;
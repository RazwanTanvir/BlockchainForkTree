
// deploy_contract.js
const Web3 = require('web3');
const fs = require('fs');

var contractAddressList = [];

async function deployContract(web3Provider, accountPassword) {
    try {
        const web3 = new Web3(web3Provider);

        const bytecode = fs.readFileSync('./smart-contract/build/contracts_abi_bin/addchaindata.bin').toString();
        const abi = JSON.parse(fs.readFileSync('./smart-contract/build/contracts_abi_bin/addchaindata.abi'));

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
async function main() {
    const web3Provider1 = 'http://localhost:8546'; // Replace with the address of your different Ethereum node
    const accountPassword1 = '1234567890'; // Replace with the password for the account

    try {
        const contractAddress1 = await deployContract(web3Provider1, accountPassword1);
        console.log(contractAddress1); // Output: Async function completed!
        const contractInfo1 = {
            web3Provider: web3Provider1,
            contractAddress: contractAddress1
        };
    
        contractAddressList.push(contractInfo1);
    
    } catch (error) {
        console.error("Error:", error);
    }
    

    const web3Provider2 = 'http://localhost:8547'; // Replace with the address of your different Ethereum node
    const accountPassword2 = '1234567890'; // Replace with the password for the account
    try {
        const contractAddress2 = await deployContract(web3Provider2, accountPassword2);
        console.log(contractAddress2); // Output: Async function completed!
        const contractInfo2 = {
            web3Provider: web3Provider2,
            contractAddress: contractAddress2
        };
        contractAddressList.push(contractInfo2);
    } catch (error) {
        console.error("Error:", error);
    }

    



    const web3Provider3 = 'http://localhost:8548'; // Replace with the address of your different Ethereum node
    const accountPassword3 = '1234567890'; // Replace with the password for the account

    try {
        const contractAddress3 = await deployContract(web3Provider3, accountPassword3);
        console.log(contractAddress3); // Output: Async function completed!
        const contractInfo3 = {
            web3Provider: web3Provider3,
            contractAddress: contractAddress3
        };
        contractAddressList.push(contractInfo3);
    } catch (error) {
        console.error("Error:", error);
    }

    

    // Write the contract info to a JSON file
    const jsonString = JSON.stringify(contractAddressList, null, 2);
    fs.writeFileSync('./smart-contract/src/scripts/contractInfo.json', jsonString, 'utf-8');
}

main();

//TODO: can create a file to store generated contract address as json.
//Then read the json in another file to add data to that blockchain using that address
// module.exports = addr1;
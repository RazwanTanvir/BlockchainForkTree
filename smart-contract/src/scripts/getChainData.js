const Web3 = require('web3');
const fs = require('fs');


async function getChainData(blockchainAddress, contractAddress) {
    try {
        const web3 = new Web3(blockchainAddress);
        
        const contractAbi = JSON.parse(fs.readFileSync('./build/Contracts/BlockData.abi'));

        const contract = new web3.eth.Contract(contractAbi, contractAddress);
        
        // const accounts = await web3.eth.getAccounts();
        // web3.eth.personal.unlockAccount(accounts[0], "1234567890", 6000);
        const dataAt = 2;
        contract.methods.getAllDataPoints().call(function(err, res){
            // console.log("Data Point At BlockNumber- " + dataAt + ":");
            console.log(res);
        });

    } catch (error) {
        console.error("Error fetching data", error);
    }
}

const blockchainAddress1 = 'http://localhost:8545';
const contractAddress1 = '0x76428ba0Fb2e0977567795ACCeE0c23bf339d024'; // Contract Address for Blockchain 1

getChainData(blockchainAddress1, contractAddress1);

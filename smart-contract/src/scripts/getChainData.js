const Web3 = require('web3');
const fs = require('fs');


async function getChainData(blockchainAddress, contractAddress) {
    try {
        const web3 = new Web3(blockchainAddress);
        
        const contractAbi = JSON.parse(fs.readFileSync('./smart-contract/build/contracts_abi_bin/BlockData.abi'));
        

        const contract = new web3.eth.Contract(contractAbi, contractAddress);
        
        // const accounts = await web3.eth.getAccounts();
        // web3.eth.personal.unlockAccount(accounts[0], "1234567890", 6000);
        // const dataAt = 2;
        contract.methods.getAllDataPoints().call(function(err, res){
            // console.log("Data Point At BlockNumber- " + dataAt + ":");
            console.log('All data: ');
            console.log(res);
        });

    } catch (error) {
        console.error("Error fetching data", error);
    }
}

// const blockchainAddress1 = 'http://localhost:8545';
// const contractAddress1 = '0x76428ba0Fb2e0977567795ACCeE0c23bf339d024'; // Contract Address for Blockchain 1

const deployedContractsFile = './smart-contract/src/scripts/contractInfo.json';
const jsonData = fs.readFileSync(deployedContractsFile);
const contractsInfo = JSON.parse(jsonData);

for (const contractInfo of contractsInfo) {
    const { web3Provider, contractAddress } = contractInfo;
    const blockchainAddress1 = web3Provider;
    const contractAddress1 = contractAddress;
    // console.log(blockchainAddress1 + '-' + contractAddress);
    getChainData(blockchainAddress1, contractAddress1);

}



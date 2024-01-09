const Web3 = require('web3');
const fs = require('fs');

async function addForkEvent(blockchainAddress, portNumber, contractAddress, dataFilePath) {
    try {
        const web3 = new Web3(blockchainAddress);
        
        const contractAbi = JSON.parse(fs.readFileSync('./smart-contract/build/contracts_abi_bin/storeforkevent.abi'));

        const contract = new web3.eth.Contract(contractAbi, contractAddress);
        
        const accounts = await web3.eth.getAccounts();
        web3.eth.personal.unlockAccount(accounts[0], "1234567890", 6000);
        // console.log(accounts);

        console.log("Fetching Experimental Data JSON:");

        // Read the JSON file synchronously (you may want to use the asynchronous version in a real application)
        const rawData = fs.readFileSync(dataFilePath);
        const dataPointsList = JSON.parse(rawData);

        for (const dataPoint of dataPointsList) {
            // Destructure values from the data point object
            const { networkId, parentNetworkId, forkBlockNumber } = dataPoint;

            // Make the function call for each data point
            await contract.methods.addForkDetail(networkId, portNumber, parentNetworkId, forkBlockNumber).send({ from: accounts[0] });
            console.log("Fork event added from forkdata.json");

            // console.log(`Fork point added: ${_networkId}, ${_portNumber}`);
        }

    } catch (error) {
        console.error("Error interacting with the contract:", error);
    }
}

const blockchainAddress = 'http://localhost:8545';
const contractAddress = '0x359d49F7090E6e3E6e119e1CbAcFDdc21209766f'; // Contract Address for Blockchain 1

// const jsonData = fs.readFileSync(deployedContractsFile);
// const contractsInfo = JSON.parse(jsonData);

addForkEvent(blockchainAddress, 8545, contractAddress, './smart-contract/src/scripts/forkdata.json');




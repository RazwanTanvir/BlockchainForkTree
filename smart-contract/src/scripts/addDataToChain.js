// interact_with_contract.js
const Web3 = require('web3');
const fs = require('fs');

// blockchain_address = 'http://localhost:8545';
// const web3 = new Web3(blockchain_address); // Replace with the address of your local Ethereum node


// const abi = JSON.parse(fs.readFileSync('./build/Contracts/BlockData.abi'));
// const contractAddress = "0x76428ba0Fb2e0977567795ACCeE0c23bf339d024"; //Contract Address
// //unlocking account
// web3.eth.personal.unlockAccount("0x15A1c9F7aE8F8f3176805316C2bACC99Af3d6f5b", "1234567890", 6000);

// console.log("Connected to chain...");



// // const abi = JSON.parse(fs.readFileSync('./build/AddRetrieveForks.abi'));

// const datafile = './src/scripts/dataPoints.json';


// console.log("Ready to Accept Transaction: ");
// async function interactWithContract() {
//     try {
//         const contract = new web3.eth.Contract(abi, contractAddress);
        
//         const accounts = await web3.eth.getAccounts();
//         console.log(accounts);


//         console.log("Fetching Experimental Data JSON:");
//         const fs = require('fs');

//         // Read the JSON file synchronously (you may want to use the asynchronous version in a real application)
//         const rawData = fs.readFileSync(datafile);
//         const dataPointsList = JSON.parse(rawData);

//         for (const dataPoint of dataPointsList) {
//             // Destructure values from the data point object
//             const { _networkId, _portNumber, _data } = dataPoint;

//             // Make the function call for each data point
//             await contract.methods.addDataPoint(_networkId, _portNumber, _data).send({ from: accounts[0] });

//             console.log(`Data point added: ${_networkId}, ${_portNumber}, ${_data}`);
//         }

//         const dataAt = 2;
//         contract.methods.getDataPointByIndex(dataAt).call(function(err, res){
//             console.log("Data Point At BlockNumber- " + dataAt + ":");
//             console.log(res);
//         });

//     } catch (error) {
//         console.error("Error interacting with the contract:", error);
//     }
// }

async function addDataToBlockchain(blockchainAddress, contractAddress, dataFilePath) {
    try {
        const web3 = new Web3(blockchainAddress);
        
        const contractAbi = JSON.parse(fs.readFileSync('./smart-contract/build/contracts_abi_bin/BlockData.abi'));

        const contract = new web3.eth.Contract(contractAbi, contractAddress);
        
        const accounts = await web3.eth.getAccounts();
        web3.eth.personal.unlockAccount(accounts[0], "1234567890", 6000);
        console.log(accounts);

        console.log("Fetching Experimental Data JSON:");

        // Read the JSON file synchronously (you may want to use the asynchronous version in a real application)
        const rawData = fs.readFileSync(dataFilePath);
        const dataPointsList = JSON.parse(rawData);

        for (const dataPoint of dataPointsList) {
            // Destructure values from the data point object
            const { _networkId, _portNumber, _data } = dataPoint;

            // Make the function call for each data point
            await contract.methods.addDataPoint(_networkId, _portNumber, _data).send({ from: accounts[0] });

            console.log(`Data point added: ${_networkId}, ${_portNumber}, ${_data}`);
        }

        // const dataAt = 2;
        // await contract.methods.getDataPointByIndex(dataAt).call(function(err, res){
        //     console.log("Data Point At BlockNumber- " + dataAt + ":");
        //     console.log(res);
        // });

    } catch (error) {
        console.error("Error interacting with the contract:", error);
    }
}

// const contractAddress = require('./deploy_repo_blockchain_contract');
// console.log("Exported Contract address: " + contractAddress);
const dataFilePath = './smart-contract/src/scripts/dataPoints.json';
const deployedContractsFile = './smart-contract/src/scripts/contractInfo.json';

const jsonData = fs.readFileSync(deployedContractsFile);
const contractsInfo = JSON.parse(jsonData);
for (const contractInfo of contractsInfo) {
    // Destructure values from the data point object
    const { web3Provider, contractAddress } = contractInfo;
    const blockchainAddress1 = web3Provider;
    const contractAddress1 = contractAddress; // Contract Address for Blockchain 1
    const dataFilePath1 = dataFilePath;

    addDataToBlockchain(blockchainAddress1, contractAddress1, dataFilePath1).then(
        console.log(contractAddress1)
    );
    console.log(`Json data: : ${web3Provider}, ${contractAddress}`);
}


// const blockchainAddress1 = 'http://localhost:8546';
// const contractAddress1 = '0x0FA333A3bdd5f16eC8e856C3049b358B23E322Ac'; // Contract Address for Blockchain 1
// const dataFilePath1 = dataFilePath;

// const blockchainAddress2 = 'http://localhost:8547'; // Replace with the address of your different Ethereum node
// const contractAddress2 = '0x7b731b8e619aaee8752921cbC5780a9D2B725a7A'; // Replace with the contract address on the different blockchain
// const dataFilePath2 = dataFilePath;

// const blockchainAddress3 = 'http://localhost:8548'; // Replace with the address of your different Ethereum node
// const contractAddress3 = '0xd2DC49da36557035D22e3FDd08CF06F3bF37Db76'; // Replace with the contract address on the different blockchain
// const dataFilePath3 = dataFilePath;

// // Interact with the first blockchain
// addDataToBlockchain(blockchainAddress1, contractAddress1, dataFilePath1).then(
//     console.log(contractAddress1)
// );

// // Interact with the second blockchain
// addDataToBlockchain(blockchainAddress2, contractAddress2, dataFilePath2);



// addDataToBlockchain(blockchainAddress3, contractAddress3, dataFilePath3);
/*Function calls*/
//   interactWithContract();

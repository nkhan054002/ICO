const {ethers} = require("hardhat")
require("dotenv").config({path:"./../.env"})
const {NFT_CONTRACT_ADDRESS} = require("../constants")

async function main(){
    const cryptoDevsToken = await ethers.getContractFactory("CryptoDevToken");
    const deployedcryptoDevsToken = await cryptoDevsToken.deploy(NFT_CONTRACT_ADDRESS);
    await deployedcryptoDevsToken.deployed()
    console.log("Contract deployed at", deployedcryptoDevsToken.address)
}

main().then(()=>process.exit(0))
.catch((err)=>{
    console.error(err)
    process.exit(1)
})
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import {useStyles, useEffect, useRef, useState} from "react"
import Web3Modal from "web3modal";
//import {BigNumber, Contract, utils} from "ethers";
import { BigNumber, Contract, providers, utils } from "ethers";
//import {TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS} from "./constants/index.js"
import { NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS } from '../constants';

export default function Home() {
  const zero = BigNumber.from(0);
  const [walletConnected, setWalletConnected] = useState(false);
  const [tokensMinted, setTokensMinted] = useState(zero)
  const [balanceOfCryptoDevTokens, setBalanceOfCryptoDevTokens] = useState(zero)
  // amount of the tokens that the user wants to mint
  const [tokenAmount, setTokenAmount] = useState(zero);
  const [loading, setLoading] = useState(false);
  const [tokensToBeClaimed, setTokensToBeClaimed] = useState(zero)

  const web3ModalRef = useRef();

  const getTotalTokensMinted = async ()=>{
    try{
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
      const _tokensMinted = await tokenContract.totalSupply();
      setTokensMinted(_tokensMinted)
    } catch (err){
      console.error(err)
    }
  }

  const getTokensToBeClaimed = async()=>{
    try{
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider)
      const signer = await getProviderOrSigner(true);
      const addressSigner = await signer.getAddress();
      const balance = await nftContract.balanceOf(addressSigner);
      //balanceOf function works for nft contracts as well 
      if (balance===zero){
        setTokensToBeClaimed(zero)
      } else{
        var amount=0;
        for (const i = 0; i < balance; i++){
          const tokenId = await nftContract.tokenOwnerByIndex(addressSigner, i);
          const claimed = await nftContract.tokenIdsClaimed[tokenId];
          if (!claimed){
            amount ++;
          }
          //writing this for loop prevents running the for loop in solidity, saving gas
        }
        setTokensToBeClaimed(BigNumber.from(amount));
      }
    }
    catch (err){
      console.error(err)
      setTokensToBeClaimed(zero)
    }
  }

  const getBalanceOfCryptoDevTokens = async()=>{
    try{
      const provider = await getProviderOrSigner();
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, provider);
      const signer = await getProviderOrSigner(true);
      const addressSigner = await signer.getAddress();
      const balance = await tokenContract.balanceOf(addressSigner);
      setBalanceOfCryptoDevTokens(balance);
    } catch (err) {
      console.error(err)
      setBalanceOfCryptoDevTokens(zero);
    }
  }

  const mintCryptoDevToken = async(amount)=>{
    try{
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);
      const value = 0.001*amount;
      const tx = await tokenContract.mint(amount, {
        value:utils.parseEther(value.toString())
      })
      setLoading(true)
      await tx.wait();
      window.alert("Successfully minted CryptoDev tokens")
      getBalanceOfCryptoDevTokens();
      getTotalTokensMinted();
      getTokensToBeClaimed();
    }
    catch (err){
      console.error(err)
    }
  }

  const claimCryptoDevTokens = async () =>{
    try{
      const signer = await getProviderOrSigner(true);
      const tokenContract = new Contract(TOKEN_CONTRACT_ADDRESS, TOKEN_CONTRACT_ABI, signer);
      const tx = await tokenContract.claim();
      setLoading(true);
      window.alert("Successfully claimed Crypto Dev tokens");
      //since we are changing the state of the blockchain we need our local values of the same thign to change as well
      await getBalanceOfCryptoDevTokens();
      await getTotalTokensMinted();
      await getTokensToBeClaimed();
    } catch (err){
      console.error(err)
    }
  }

  const RenderButton = ()=>{
    if (loading){
      return (
        <div>
          <button className={styles.button}> Loading... </button>
        </div>
      )
    }
    //will add withdraw coins functionality later
    if (tokensToBeClaimed>0){
      return (
        <div>
          <div className={styles.description}>
            {tokensToBeClaimed*10} Tokens can be claimed!
          </div>
          <button className = {styles.button} onClick = {claimCryptoDevTokens}>Claim Tokens!</button>
        </div>
      )
    }
    return (
      <div style={{display:"flex-col"}}>
        <div>
          <input
            type="number"
            placeholder="Amt of tokens"
            onChange={(e)=>setTokenAmount(BigNumber.from(e.target.value))}
          />
          <button className={styles.button} disabled={!(tokenAmount>0)} onClick={
            ()=>{
              mintCryptoDevToken(tokenAmount)
            }
          }>dfgdfg
          </button>
        </div>
      </div>
    )
  }

  const getProviderOrSigner= async (needSigner=false)=> {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const {chainId} = await web3Provider.getNetwork();
    if (chainId !== 4){
      window.alert("You are connected to a different network!")
      throw new Error("Change network to rinkeby!")
    }
    if (needSigner){
      const signer =  web3Provider.getSigner();
      return signer
    }
    return web3Provider
  }

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err){
      console.error(err)
      //process.exit(1)
    }
  }

  useEffect(()=>{
    if (!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network:"rinkeby",
        providerOptions:{},
        disableInjectedProvider:false,
      })
      connectWallet();
      getBalanceOfCryptoDevTokens();
      getTotalTokensMinted();
      getTokensToBeClaimed();
    }
    
  }, [walletConnected])

  const TextBasedOnWallet = async() => {
    if (walletConnected){
      return (<div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                You have minted {utils.formatEther(balanceOfCryptoDevTokens)}/10000 Crypto
                Dev Tokens
              </div>
              <div className={styles.description}>
                {/* Format Ether helps us in converting a BigNumber to string */}
                Overall {utils.formatEther(tokensMinted)}/10000 have been minted!!!
              </div>
              <RenderButton/>
              </div>)
    } else{
      return (<button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>)
    }
  }

  return (
    <div>
    <Head>
      <title>Crypto Devs ICO</title>
      <meta name="description" content="ICO-dApp"></meta>
      <link rel="icon" href="./favicon.ico"></link>
    </Head>
    <div className={styles.main}>
      <div>
        <h1 className={styles.title}> Welcome to the Crypto Devs ICO</h1>
        <div className={styles.description}>
          You can claim or mint your CryptoDev tokens here!
        {console.lo}
        </div>
        {TextBasedOnWallet()}
          <div>
          <img className={styles.image} src="./0.svg" />
          </div>
      </div>
      
    </div>
    <footer className={styles.footer}>
        Made with &#10084; by Nabeel Khan
      </footer>
    </div>
  )
  }

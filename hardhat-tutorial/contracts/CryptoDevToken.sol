pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./ICryptoDevs.sol";

contract CryptoDevToken is ERC20, Ownable{
    mapping (uint256=>bool) public tokenIdsClaimed;
    ICryptoDevs cryptoDevsNFT;
    constructor(address _cryptoDevsContract) ERC20("Crypto Dev Token", "CD"){
        cryptoDevsNFT = ICryptoDevs(_cryptoDevsContract);    
    }

    uint256 public constant tokenPrice = 0.001 ether;
    uint256 public constant tokensPerNFT = 10*(10**18);
    uint256 public constant maxTokenSupply = 1000*(10**18);

    function mint (uint256 amount) public payable {
        uint256 _requiredAmount = tokenPrice*amount;
        require(msg.value >= _requiredAmount, "Ether sent is insufficient");
        uint256 amountWithDecimals = amount *(10**18);
        uint256 currentSupply = totalSupply();
        require(currentSupply + amountWithDecimals <= maxTokenSupply, "Exceeds the maximum total supply that can be minted");
        _mint(msg.sender, amountWithDecimals);
    }

    function claim () public {
        address sender = msg.sender;
        uint256 amount=0;
        uint256 balance = cryptoDevsNFT.balanceOf(sender);
        //checks for the ERC721 Enumerable function
        require(balance > 0 , "You dont own any Crypto Dev NFT");
        for (uint256 i; i < balance; i++){
            uint256 tokenId = cryptoDevsNFT.tokenOfOwnerByIndex(sender, i);
            if (!tokenIdsClaimed[tokenId]){
                amount++;
                tokenIdsClaimed[tokenId]=true;
            }
        }
        require(amount > 0, "You have used up all of your Crypto Devs NFTs");
        //since the msg.sender would prefer to mint all her tokens at once
        _mint(msg.sender, amount * tokensPerNFT);

    }
//what is the point of public and onlyOwner
    function withdraw() public onlyOwner{
        address owner = owner();
        uint256 amount = address(this).balance;
        (bool sent, ) = owner.call{
            value:amount
        }("");
        require(sent, "Failed to send Ether");
    }

     // Function to receive Ether. msg.data must be empty
      receive() external payable {}

      // Fallback function is called when msg.data is not empty
      fallback() external payable {}

    //fallback() external payable  {}
    //recieve external payable()   {}
    //recieve is used if msg.data is null
}
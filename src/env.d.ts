import Web3 from "web3";

declare global {
  interface Window {
    ethereum?: any
    web3: Web3
  }
}

import {Injectable, signal, WritableSignal} from '@angular/core';

import Contract from '../assets/Contract.json'
import DeployedAddress from 'ignition/deployments/chain-31337/deployed_addresses.json'
import {BrowserProvider, ethers, formatUnits} from "ethers";

declare let window: any;

@Injectable({
  providedIn: 'root',
})
export class BlockchainService {
  account: WritableSignal<string> = signal('');
  netId: any;

  address: any;
  contract: ethers.Contract | null = null;
  abi: any;

  admin: any;
  web3Provider: BrowserProvider | null = null;

  constructor() {
    this.abi = Contract.abi;
    if (DeployedAddress["Contract#Contract"]) {
      this.address = DeployedAddress["Contract#Contract"];
    }

    this.getWeb3Provider().then((provider) => {
      this.web3Provider = provider;
      let _ = this.getAccount()

      window.ethereum.on('accountsChanged', (acc: any) => {
        console.log(acc);
        this.account.set(acc[0])
      });
    });
  }

  checkIsAdmin(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.getContract().then(contract => {
        // console.log(contract.target);
        this.getCurrentAccount().then(async a => {
          contract["isAdmin"].call({from: a}).then((r: any) => {
            if (r) {
              resolve(true)
            }
            reject(false)
          })
        }).catch((er: any) => {
          console.log(er);
        })
      })
    })
  }

  //gets
  async getWeb3Provider(): Promise<BrowserProvider> {
    if (this.web3Provider) return this.web3Provider;
    if (window.ethereum) {
      console.log("Connecting to MetaMask")
      this.web3Provider = new BrowserProvider(window.ethereum);
      this.account.set((await this.web3Provider.getSigner()).address)
      return this.web3Provider;
    } else {
      throw new Error("No web3 provider: Install MetaMask");
    }
  }

  async getAccount(): Promise<string> {
    let account = this.account();
    if (!account) {
      account = await this.getCurrentAccount();
      if (!account) {
        throw new Error("No account found for MetaMask");
      }
    }
    return account;
  }

  async getBalanceByAccount(account?: string): Promise<string> {
    if (!account) {
      account = await this.getAccount();
    }
    if (!this.web3Provider) {
      this.web3Provider = await this.getWeb3Provider()
    }
    let balance = await this.web3Provider.getBalance(account);
    return Number(formatUnits(balance, "ether")).toFixed(4);
  }

  async getContract(): Promise<ethers.Contract> {
    if (!this.contract) {
      let counter = 0
      while ((!this.address || !this.abi || !this.web3Provider) && counter < 10) {
        counter++
        await new Promise(resolve => setTimeout(resolve, counter * 100));
      }
      if (!this.address || !this.abi || !this.web3Provider) {
        throw new Error("The contract address/provider doesn't exist");
      }
      this.contract = new ethers.Contract(this.address, this.abi, this.web3Provider);

      const code = await this.web3Provider?.getCode(this.contract.target);
      if (code == "0x") {
        throw new Error("Contract is empty / not found in the network");
      }
    }
    return this.contract;
  }

  private getCurrentAccount(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.getWeb3Provider().then(async (web3) => {
        let accounts = await web3.listAccounts()
        resolve(accounts[0].address)
      })
    });
  }
}

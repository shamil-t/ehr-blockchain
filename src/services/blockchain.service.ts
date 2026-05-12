import {inject, Injectable, signal, WritableSignal} from '@angular/core';

import EHR_Contract from '../assets/Contract.json'
import DeployedAddress from 'ignition/deployments/chain-31337/deployed_addresses.json'
import {BrowserProvider, Contract, formatUnits, JsonRpcSigner} from "ethers";
import {Router} from "@angular/router";

declare let window: any;

@Injectable({
  providedIn: 'root',
})
export class BlockchainService {
  account: WritableSignal<string> = signal('');
  router = inject(Router)

  deployedAddress: any;
  contract: Contract | null = null;
  abi: any;

  web3Provider: BrowserProvider | null = null;

  constructor() {
    this.abi = EHR_Contract.abi;
    if (DeployedAddress["Contract#Contract"]) {
      this.deployedAddress = DeployedAddress["Contract#Contract"];
    }

    this.getWeb3Provider().then((provider) => {
      this.web3Provider = provider;

      window.ethereum.on('accountsChanged', (acc: any) => {
        this.account.set(acc[0])
        this.getContract().then(r => {
          // console.log()
        })
        let currentUrl = (this.router.url.substring(0, this.router.url.lastIndexOf('/')));
        this.router.navigateByUrl(currentUrl, {skipLocationChange: false}).then(() => {
          console.log(`Account changed successfully - reloading:${currentUrl}`);
        });
      });
    });
  }

  async checkIsAdmin(): Promise<boolean> {
    if (!this.contract) {
      this.contract = await this.getContract()
    }
    if (!this.account()) {
      this.account.set(await this.getAccount())
    }
    return await this.contract["isAdmin"]();
  }

  //gets
  async getWeb3Provider(): Promise<BrowserProvider> {
    if (this.web3Provider) return this.web3Provider;
    if (window.ethereum) {
      // console.log("Connecting to MetaMask")
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

  async getContract(): Promise<Contract> {
    if (this.contract) {
      const signer = this.contract.runner
      if (this.account() != (signer as JsonRpcSigner).address) this.contract = null
    }
    if (!this.contract) {
      let counter = 0
      while ((!this.deployedAddress || !this.abi || !this.web3Provider) && counter < 10) {
        counter++
        await new Promise(resolve => setTimeout(resolve, counter * 100));
      }
      if (!this.deployedAddress || !this.abi || !this.web3Provider) {
        throw new Error("The contract address/provider doesn't exist");
      }
      const signer = await this.web3Provider.getSigner();
      this.contract = new Contract(this.deployedAddress, this.abi, signer);
      const code = await this.web3Provider?.getCode(this.contract.target);
      if (code == "0x") {
        throw new Error("Contract is empty / not found in the network");
      }
    }
    return this.contract;
  }

  private async getCurrentAccount(): Promise<string> {
    if (!this.web3Provider) {
      this.web3Provider = await this.getWeb3Provider();
    }
    let accounts = await this.web3Provider.listAccounts()
    return accounts[0].address;
  }
}

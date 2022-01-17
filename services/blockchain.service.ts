import { Injectable } from '@angular/core';
import Web3 from 'web3';

declare let window: any;

@Injectable({
  providedIn: 'root',
})
export class BlockchainService {
  accounts: any = [];
  netId: any;
  web3: any;
  constructor() {}


  async loadBlockChain() {
    this.web3 = this.getWeb3Provider()

    this.accounts = await this.web3.eth.getAccounts();
    this.netId = await this.web3.eth.net.getId();
  }

  private getWeb3Provider(): Web3 {
    if (typeof window.web3 !== 'undefined') {
      return new Web3(window.web3.currentProvider);
    } else {
      this.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'));
      return this.web3;
    }}
}

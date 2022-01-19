import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import Web3 from 'web3';

declare let window: any;

@Injectable({
  providedIn: 'root',
})
export class BlockchainService {
  account: any = [];
  netId: any;
  web3: any;
  constructor() {}

  async getWeb3Provider() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      window.ethereum.enable();

      this.web3 = window.web3
      this.account = this.web3.eth.getAccounts()[0]
      return window.web3;
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
      return window.web3;
    } else {
      return window.web3;
    }
  }

  getWeb3(): Web3 {
    return this.web3;
  }
}

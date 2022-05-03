import { Injectable } from '@angular/core';
import { rejects } from 'assert';
import { resolve } from 'dns';
import Web3 from 'web3';

const Contract = require('../../build/contracts/Contract.json');

declare let window: any;

@Injectable({
  providedIn: 'root',
})
export class BlockchainService {
  account: any = [];
  netId: any;
  web3: any;

  address: any;
  contract: any;
  netWorkData: any;
  abi: any;

  admin: any;

  balance: any;

  blockNumber: any;

  LOG: any;

  Report: any = [];

  constructor() {
    this.getWeb3Provider().then(() => {
      this.web3.eth.getAccounts((err: any, accs: any) => {
        this.account = accs[0];
        this.web3.eth.getBalance(this.account).then((r: any) => {
          this.balance = r;
        });
        this.web3.eth.getBlockNumber().then((block: any) => {
          this.blockNumber = block;
          console.log(this.blockNumber);
        });
      });

      this.web3.eth.net.getId().then((r: number) => {
        console.log(r);

        this.netId = r;
        this.abi = Contract.abi;
        this.netWorkData = Contract.networks[this.netId];

        if (this.netWorkData) {
          this.address = this.netWorkData.address;
          this.contract = this.web3.eth.Contract(this.abi, this.address);

          this.contract.methods
            .getAdmin()
            .call()
            .then((r: any) => {
              this.admin = r;
            });
          console.log(this.admin);
        }
      });
      window.ethereum.on('accountsChanged', (acc:any) => {
        console.log(acc);
        window.location.reload();
      });
    });

  }

  //generate Report of Transactions
  generateReport(block: number) {
    for (var i = 1; i <= block; i++) {
      this.web3.eth.getBlock(i).then((Block: any) => {
        this.Report.push(Block);
      });
    }
  }

  //gets

  async getWeb3Provider() {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      window.ethereum.enable();
      console.log(window.web3);

      this.web3 = window.web3;
      this.account = this.web3.eth.getAccounts()[0];
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

  getBalance(): any {
    return this.balance;
  }

  getTransactionBlockNumber() {
    return this.blockNumber;
  }

  getAccount() {
    return this.account;
  }

  getContract():Promise<any> {
    return new Promise((resolve,rejects)=>{
      if(this.contract != null)
        resolve(this.contract)
    })
  }
}

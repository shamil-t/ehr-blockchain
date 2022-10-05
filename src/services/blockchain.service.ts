import { Injectable } from '@angular/core';
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
      });

      this.web3.eth.net.getId().then((r: number) => {
        this.netId = r;
        this.abi = Contract.abi;
        this.netWorkData = Contract.networks[this.netId];
        if (this.netWorkData) {
          this.address = this.netWorkData.address;
          this.contract = new this.web3.eth.Contract(this.abi, this.address);
          // this.contract.methods
          //   .getAdmin()
          //   .call()
          //   .then((r: any) => {
          //     console.log(r);

          //     this.admin = r;
          //   });
        }
      });
      window.ethereum.on('accountsChanged', (acc: any) => {
        console.log(acc);
        window.location.reload();
      });
    });

  }

  checkIsAdmin(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.getContract().then(c => {
        console.log(c.methods.getAdmin().call());
        this.getCurrentAcount().then(a => {
          console.log(a);
          c.methods.isAdmin().call({ from: a }).then((r: any) => {
            console.log(r);

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

  async getWeb3Provider(): Promise<Web3> {
    if (window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      window.ethereum.enable();
      // console.log(window.web3);

      this.web3 = window.web3;
      this.account = await this.web3.eth.getAccounts().then((acc: string[]) => {
        // console.log(acc);
        return acc[0];
      });
      return window.web3;
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
      return window.web3;
    } else {
      return window.web3;
    }
  }

  getCurrentAcount(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.web3) {
        this.web3.eth.getAccounts().then((acc: string[]) => {
          // console.log(acc[0]);
          resolve(acc[0]);
        });
      } else {
        reject(null);
      }
    });
  }

  getWeb3(): Web3 {
    return this.web3;
  }

  getBalance(): any {
    return this.balance;
  }

  getAccount() {
    return this.account;
  }

  async getContract(): Promise<any> {
    return new Promise((resolve, reject) => {
      let check = setInterval(() => {
        if (this.contract != null) {
          resolve(this.contract);
          clearInterval(check);
        }
      }, 1000);
    });
  }
}

import { Injectable, signal, WritableSignal } from '@angular/core';
import Web3 from 'web3';

const Contract = require('../../build/contracts/Contract.json');

declare let window: any;

@Injectable({
  providedIn: 'root',
})
export class BlockchainService {
  account: WritableSignal<string> = signal('');
  netId: any;
  web3: any;

  address: any;
  contract: any;
  netWorkData: any;
  abi: any;

  admin: any;

  balance: WritableSignal<number> = signal(0);


  constructor() {
    this.getWeb3Provider().then((web3: Web3) => {
      web3.eth.getAccounts().then((acts: any) => {
        this.account.set(acts[0])
        console.log(acts[0]);
        web3.eth.getBalance(acts[0]).then((r: any) => {
          this.balance.set(Math.floor(Number(web3.utils.fromWei(r, "ether")) * 1000) / 1000);
        });
      }).catch(err => console.log(err))

      this.web3.eth.net.getId().then((r: any) => {
        this.netId = r;
        this.abi = Contract.abi;
        this.netWorkData = Contract.networks[this.netId];
        if (this.netWorkData) {
          this.address = this.netWorkData.address;
          this.contract = new this.web3.eth.Contract(this.abi, this.address);
        }
      });
      window.ethereum.on('accountsChanged', (acc: any) => {
        console.log(acc);
        this.account.set(acc[0])
        // window.location.reload();
      });
    });

  }

  checkIsAdmin(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.getContract().then(c => {
        this.getCurrentAccount().then(a => {
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

      this.web3 = window.web3;
      await this.web3.eth.getAccounts().then((acc: string[]) => {
        this.account.set(acc[0])
      });
      return window.web3;
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
      return window.web3;
    } else {
      return window.web3;
    }
  }

  getCurrentAccount(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (this.web3) {
        this.web3.eth.getAccounts().then((acc: string[]) => {
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
    return this.account();
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

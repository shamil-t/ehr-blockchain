import {Injectable, signal, WritableSignal} from '@angular/core';

import Contract from '.../../../ignition/deployments/chain-31337/artifacts/Contract#Contract.json';
import DeployedAddress from 'ignition/deployments/chain-31337/deployed_addresses.json'
import {BrowserProvider, ethers, formatUnits} from "ethers";

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
  web3Provider: BrowserProvider | null = null;

  balance: WritableSignal<number> = signal(0);

  constructor() {
    this.getWeb3Provider().then((provider) => {
      this.web3Provider = provider;
      provider.listAccounts().then((acts: any) => {
        this.account.set(acts[0])
        console.log(acts[0]);
      }).catch(err => console.log(err))

      this.web3.eth.net.getId().then((r: any) => {
        this.netId = r;
        this.abi = Contract.abi;
        this.netWorkData = DeployedAddress["Contract#Contract"];
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
          c.methods.isAdmin().call({from: a}).then((r: any) => {
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
  async getWeb3Provider(): Promise<BrowserProvider> {
    if (this.web3Provider) return this.web3Provider;
    if (window.ethereum) {
      return new BrowserProvider(window.ethereum);
    } else {
      throw new Error("No web3 provider: Install MetaMask");
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

  getAccount() {
    return this.account();
  }

  getBalanceByAccount(account?: string): Promise<string> {
    if (!account) {
      account = this.getAccount();
    }
    return new Promise((resolve, reject) => {
      if (this.web3Provider) {
        this.web3Provider.getBalance(account).then((balance) => {
          resolve(formatUnits(balance, "ether"));
        }).catch((er: any) => {
          console.log(er);
          reject(er)
        })
      }
    })
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

import {inject, Injectable, signal, WritableSignal} from '@angular/core';
import {BrowserProvider, formatUnits, JsonRpcSigner} from "ethers";
import {Router} from "@angular/router";

declare let window: any;

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  connectedAccount: WritableSignal<string> = signal('')
  router = inject(Router)
  private provider: BrowserProvider | null = null;
  private account: string = ''
  private signer: JsonRpcSigner | null = null;

  constructor() {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        this.account = accounts[0]
        // update signer
        this.signer = null
        this.provider = null
        if (this.connectedAccount() != this.account) {
          this.connectedAccount.set(this.account);
          let currentUrl = (this.router.url.substring(0, this.router.url.lastIndexOf('/')));

          if (currentUrl != '') {
            this.router.navigateByUrl(currentUrl, {skipLocationChange: false}).then(() => {
              console.log(`Account changed successfully - reloading:${currentUrl}`);
            });
          }
        }
      })
    }
  }

  getWalletProvider(): BrowserProvider {
    if (this.provider != null) {
      return this.provider;
    }
    if (window.ethereum) {
      this.provider = new BrowserProvider(window.ethereum);
      return this.provider
    } else {
      throw new Error("Wallet not found: Please install MetaMask");
    }
  }

  async getConnectedAccount() {
    if (this.account == '') {
      if (!this.provider) {
        this.provider = this.getWalletProvider()
      }
      this.account = (await this.provider.listAccounts())[0].address;
      this.connectedAccount.set(this.account);
    }
    return this.account;
  }

  async getSigner() {
    if (this.signer == null) {
      if (!this.provider) this.provider = this.getWalletProvider()
      this.signer = await this.provider.getSigner()
    }
    return this.signer;
  }

  async getAccountBalance() {
    if (this.account == '') {
      this.account = await this.getConnectedAccount()
    }
    if (!this.provider) this.provider = this.getWalletProvider()
    let balance = await this.provider.getBalance(this.account);
    return Number(formatUnits(balance, "ether")).toFixed(4)
  }
}

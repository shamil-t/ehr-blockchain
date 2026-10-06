import {Injectable} from '@angular/core';
import {KeyManager} from "../wallet/key-manager.type";
import {ethers} from "ethers";

@Injectable({providedIn: 'root'})
export class KeyManagerService implements KeyManager {
  private readonly activeWalletKey = 'ehr-wallet:active-address';

  async storeEncryptedJson(id: string, encryptedJson: string): Promise<void> {
    localStorage.setItem(id, encryptedJson);
    localStorage.setItem(this.activeWalletKey, id);
  }

  async readEncryptedJson(id: string): Promise<string | null> {
    return localStorage.getItem(id);
  }

  async clearStoredWallets(): Promise<void> {
    const walletAddresses = Object.keys(localStorage).filter((key) => /^0x[a-fA-F0-9]{40}$/.test(key));
    walletAddresses.forEach((address) => localStorage.removeItem(address));
    localStorage.removeItem(this.activeWalletKey);
  }

  async getStoredWalletAddress(): Promise<string | null> {
    const activeAddress = localStorage.getItem(this.activeWalletKey);
    if (activeAddress && localStorage.getItem(activeAddress)) return activeAddress;

    const addresses = Object.keys(localStorage).filter((key) => /^0x[a-fA-F0-9]{40}$/.test(key));
    const address = addresses.at(-1) ?? null;
    if (address) localStorage.setItem(this.activeWalletKey, address);
    return address;
  }

  async decryptToPrivateKey(encryptedJson: string, password: string): Promise<string> {
    const decryptedJson = await ethers.Wallet.fromEncryptedJson(encryptedJson, password);
    return decryptedJson.privateKey;
  }

}

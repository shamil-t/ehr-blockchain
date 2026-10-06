import {inject, Injectable, signal} from '@angular/core';
import {ContractRunner, ethers, TransactionRequest, Wallet} from 'ethers';
import {KeyManagerService} from '../services/key-manager.service';
import {ProviderService} from './provider.service';
import {WalletState} from './wallet-state.enum';
import {EHRWallet} from './ehrwallet.type';

@Injectable({providedIn: 'root'})
export class EhrWalletService implements EHRWallet {
  readonly state = signal<WalletState>(WalletState.NO_WALLET);
  readonly address = signal<string | null>(null);

  private wallet: Wallet | null = null;
  private readonly provider = inject(ProviderService);
  private readonly keyManager = inject(KeyManagerService);

  async initialize(): Promise<void> {
    if (this.wallet) {
      this.address.set(this.wallet.address);
      this.state.set(WalletState.UNLOCKED);
      return;
    }

    this.state.set(WalletState.INITIALIZING);
    try {
      const address = await this.keyManager.getStoredWalletAddress();
      this.address.set(address);
      this.state.set(address ? WalletState.LOCKED : WalletState.NO_WALLET);
    } catch {
      this.state.set(WalletState.ERROR);
      throw new Error('The stored wallet data could not be read.');
    }
  }

  async createWallet(password: string): Promise<string> {
    this.state.set(WalletState.INITIALIZING);
    try {
      const wallet = ethers.Wallet.createRandom();
      const encryptedWallet = await wallet.encrypt(password);
      await this.keyManager.storeEncryptedJson(wallet.address, encryptedWallet);
      this.address.set(wallet.address);
      this.state.set(WalletState.LOCKED);
      return wallet.address;
    } catch (error) {
      this.state.set(WalletState.ERROR);
      throw error;
    }
  }

  validatePrivateKey(privateKey: string): string {
    return new ethers.Wallet(privateKey).address;
  }

  validateAddress(address: string): string {
    return ethers.getAddress(address);
  }

  async importWalletFromPrivateKey(privateKey: string, password: string): Promise<string> {
    this.state.set(WalletState.INITIALIZING);
    try {
      const wallet = new ethers.Wallet(privateKey);
      const encryptedWallet = await wallet.encrypt(password);
      await this.keyManager.storeEncryptedJson(wallet.address, encryptedWallet);
      this.address.set(wallet.address);
      this.state.set(WalletState.LOCKED);
      return wallet.address;
    } catch (error) {
      this.state.set(WalletState.ERROR);
      throw error;
    }
  }

  async unlock(password: string): Promise<void> {
    const address = this.address();
    if (!address) {
      throw new Error('No wallet is configured.');
    }

    this.state.set(WalletState.INITIALIZING);
    try {
      const encryptedJson = await this.keyManager.readEncryptedJson(address);
      if (!encryptedJson) {
        throw new Error('Stored wallet data is unavailable.');
      }
      const wallet = await ethers.Wallet.fromEncryptedJson(encryptedJson, password);
      this.wallet = wallet.connect(this.provider.getProvider()) as Wallet;
      this.state.set(WalletState.UNLOCKED);
    } catch (error) {
      this.wallet = null;
      this.state.set(WalletState.LOCKED);
      throw error;
    }
  }

  lock(): void {
    this.wallet = null;
    this.state.set(this.address() ? WalletState.LOCKED : WalletState.NO_WALLET);
  }

  async signOut(): Promise<void> {
    this.wallet = null;
    this.state.set(WalletState.INITIALIZING);
    try {
      await this.keyManager.clearStoredWallets();
      this.address.set(null);
      this.state.set(WalletState.NO_WALLET);
    } catch (error) {
      this.state.set(WalletState.ERROR);
      throw error;
    }
  }

  isUnlocked(): boolean {
    return this.wallet !== null;
  }

  getAddress(): string | null {
    return this.address();
  }

  async getBalance(): Promise<string> {
    const address = this.address();
    if (!address) return '0.0000';
    return ethers.formatEther(await this.provider.getProvider().getBalance(address));
  }

  async signMessage(message: string): Promise<string> {
    if (!this.wallet) throw new Error('Wallet is locked.');
    return this.wallet.signMessage(message);
  }

  async estimateTransaction(to: string, valueEth: string): Promise<string> {
    const estimate = await this.estimateTransactionDetails(to, valueEth);
    return ethers.formatEther(estimate.estimatedFee);
  }

  async estimateTransactionDetails(to: string, valueEth: string): Promise<{
    value: bigint;
    gasLimit: bigint;
    estimatedFee: bigint;
  }> {
    const address = this.address();
    if (!address) throw new Error('No wallet is configured.');
    const value = ethers.parseEther(valueEth);
    const gasLimit = await this.provider.getProvider().estimateGas({from: address, to, value});
    const feeData = await this.provider.getProvider().getFeeData();
    const feePerGas = feeData.maxFeePerGas ?? feeData.gasPrice;
    if (feePerGas === null) throw new Error('Transaction fee data is unavailable.');

    return {value, gasLimit, estimatedFee: gasLimit * feePerGas};
  }

  async sendTransaction(to: string, valueEth: string): Promise<string> {
    if (!this.wallet) throw new Error('Wallet is locked.');
    const transaction: TransactionRequest = {to, value: ethers.parseEther(valueEth)};
    return (await this.wallet.sendTransaction(transaction)).hash;
  }

  async getSigner(): Promise<ContractRunner> {
    if (!this.address()) throw new Error('No wallet is configured.');
    if (!this.wallet) throw new Error('Wallet is locked.');
    return this.wallet;
  }
}

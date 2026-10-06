export interface EHRWallet {
  initialize(): Promise<void>;

  createWallet(password: string): Promise<string>;

  validatePrivateKey(privateKey: string): string;

  validateAddress(address: string): string;

  importWalletFromPrivateKey(privateKey: string, password: string): Promise<string>;

  unlock(password: string): Promise<void>;

  lock(): void;

  signOut(): Promise<void>;

  isUnlocked(): boolean;

  getAddress(): string | null;

  getBalance(): Promise<string>;

  signMessage(message: string): Promise<string>;

  estimateTransaction(to: string, valueEth: string): Promise<string>;

  estimateTransactionDetails(to: string, valueEth: string): Promise<{
    value: bigint;
    gasLimit: bigint;
    estimatedFee: bigint;
  }>;

  sendTransaction(to: string, valueEth: string): Promise<string>;
}

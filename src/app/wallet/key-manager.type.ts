export interface KeyManager {
  storeEncryptedJson(id: string, encryptedJson: string): Promise<void>;

  readEncryptedJson(id: string): Promise<string | null>;

  getStoredWalletAddress(): Promise<string | null>;

  clearStoredWallets(): Promise<void>;

  decryptToPrivateKey(encryptedJson: string, password: string): Promise<string>;
}

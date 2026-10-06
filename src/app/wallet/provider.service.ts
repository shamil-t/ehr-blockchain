import {Injectable, signal} from '@angular/core';
import {JsonRpcProvider} from 'ethers';
import {environment} from '../../environments/environment';

export type ProviderStatus = 'CONNECTED' | 'DISCONNECTED' | 'WRONG_NETWORK' | 'CHECKING';

@Injectable({providedIn: 'root'})
export class ProviderService {
  readonly status = signal<ProviderStatus>('CHECKING');
  readonly chainId = signal<number | null>(null);
  readonly networkName = environment.blockchain.networkName;
  readonly expectedChainId = environment.blockchain.chainId;

  private readonly provider = new JsonRpcProvider(environment.blockchain.rpc_url);

  getProvider(): JsonRpcProvider {
    return this.provider;
  }

  async checkStatus(): Promise<void> {
    this.status.set('CHECKING');
    try {
      const network = await this.provider.getNetwork();
      const actualChainId = Number(network.chainId);
      this.chainId.set(actualChainId);
      this.status.set(actualChainId === this.expectedChainId ? 'CONNECTED' : 'WRONG_NETWORK');
    } catch {
      this.chainId.set(null);
      this.status.set('DISCONNECTED');
    }
  }

  async getNetwork() {
    return this.provider.getNetwork();
  }

  async getChainId() {
    return (await this.getNetwork()).chainId;
  }

  async isProviderAvailable(): Promise<boolean> {
    try {
      await this.provider.getBlockNumber();
      return true;
    } catch {
      return false;
    }
  }
}

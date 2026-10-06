import {Injectable} from '@angular/core';
import {create, KuboRPCClient} from 'kubo-rpc-client';
import {IPFS} from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class IpfsService {
  private readonly ipfs: KuboRPCClient;

  constructor() {
    this.ipfs = create({url: IPFS.localIPFS});
  }

  getIPFS() {
    return this.ipfs;
  }

  async getJsonData<T>(ipfsHash: string): Promise<T> {
    return JSON.parse(await this.getIpfsData(ipfsHash)) as T;
  }

  getImageUrl(ipfsHash: string): string {
    if (!ipfsHash) return '';
    return IPFS.localIPFSGet + ipfsHash
  }

  async addFile(file: File) {
    return this.ipfs.add(file);
  }

  async addRecord(data: any) {
    const jsonData = JSON.stringify(data);
    const result = await this.ipfs.add(jsonData);
    return result.path;
    // return (await (this.ipfs.add(Buffer.from(JSON.stringify(data))))).path;
  }

  private async getIpfsData(ipfsHash: string): Promise<string> {
    const decoder = new TextDecoder();
    let result = '';

    for await(const chunk of this.ipfs.cat(ipfsHash)) {
      result += decoder.decode(chunk, {stream: true});
    }

    result += decoder.decode()
    return result;
  }
}

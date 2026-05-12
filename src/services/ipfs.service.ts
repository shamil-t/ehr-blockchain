import {inject, Injectable} from '@angular/core';
import {create, KuboRPCClient} from 'kubo-rpc-client';
import {IPFS} from 'src/environments/environment';
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root',
})
export class IpfsService {
  http: HttpClient = inject(HttpClient);
  ipfs: KuboRPCClient;

  constructor() {
    this.ipfs = create({url: IPFS.localIPFS});
  }

  getIPFS() {
    return this.ipfs;
  }

  getIpfsData(ipfsHash: string) {
    return this.http.get(IPFS.localIPFSGet + ipfsHash)
  }

  async addRecord(data: any) {
    return (await (this.ipfs.add(Buffer.from(JSON.stringify(data))))).path;
  }
}

import { Injectable } from '@angular/core';
import { create, IPFSHTTPClient } from 'ipfs-http-client';
import { IPFS } from 'src/environments/environment';



@Injectable({
  providedIn: 'root',
})
export class IpfsService {
  ipfs!: IPFSHTTPClient;
  constructor() {
    this.ipfs = create({ url: IPFS.localIPFS });
  }

  getIPFS() {
    return this.ipfs;
  }
}

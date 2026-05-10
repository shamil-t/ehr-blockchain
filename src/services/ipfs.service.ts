import {Injectable} from '@angular/core';
import {create, KuboRPCClient} from 'kubo-rpc-client';
import {IPFS} from 'src/environments/environment';


@Injectable({
  providedIn: 'root',
})
export class IpfsService {
  ipfs: KuboRPCClient;

  constructor() {
    this.ipfs = create({url: IPFS.localIPFS});
  }

  getIPFS() {
    return this.ipfs;
  }
}

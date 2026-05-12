import {inject, Injectable} from '@angular/core';
import {BlockchainService} from 'src/services/blockchain.service';
import {IpfsService} from 'src/services/ipfs.service';
import {KuboRPCClient} from "kubo-rpc-client";
import {ethers} from "ethers";

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  bs = inject(BlockchainService);
  ipfsService = inject(IpfsService);

  contract: ethers.Contract | null = null;
  account: string = '';

  ipfs: KuboRPCClient;

  constructor() {
    this.ipfs = this.ipfsService.getIPFS();
  }

  async getDrs(): Promise<any> {
    if (!this.contract) {
      this.contract = await this.bs.getContract();
    }
    let doctors = await this.contract["getAllDrs"]()
    return [...doctors];
  }

  async getDoctorDetails(docID: any) {
    if (!this.contract) {
      this.contract = await this.bs.getContract();
    }
    if (!this.account) {
      this.account = await this.bs.getAccount();
    }
    let docIpfsHash = await this.contract["getDr"](docID)
    return this.ipfsService.getIpfsData(docIpfsHash);
  }

  async addDoctor(data: any): Promise<any> {
    const docId = data.docId;
    if (!this.contract) {
      this.contract = await this.bs.getContract();
    }
    if (!this.account) {
      this.account = await this.bs.getAccount();
    }
    const ipfsHash = await this.ipfsService.addRecord(data)
    return await this.contract["addDrInfo"](docId, ipfsHash)
  }


}

import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {IPFS} from 'src/environments/environment';
import {BlockchainService} from 'src/services/blockchain.service';
import {IpfsService} from 'src/services/ipfs.service';
import {Buffer} from "buffer";
import {KuboRPCClient} from "kubo-rpc-client";

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  bs = inject(BlockchainService);
  ipfsService = inject(IpfsService);
  http = inject(HttpClient);

  address: any;
  contract: any;
  account: any;

  ipfs: KuboRPCClient;
  msg_text: string = '';
  result: any;
  Doctors: any;
  DoctorDetails: string[] = [];

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

  getDoctorDetails(docID: any): Promise<any> {
    console.log(docID);

    return new Promise((resolve) => {
      this.bs.getContract().then((contract: any) => {
        contract.methods
          .getDr(docID)
          .call()
          .then((ipfsHash: string) => {
            console.log(ipfsHash);
            this.http.get(IPFS.localIPFSGet + ipfsHash)
              .subscribe((data: any) => {
                console.log(data);
                resolve(data);
              });
          });
      })
    })
  }

  addDoctor(docId: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.bs.getContract().then(c => {
        this.bs.getAccount().then(a => {
          this.addRecord(data).then(ipfsHash => {
            c["addDrInfo"](docId, ipfsHash).then((result: any) => {
              if (result) {
                resolve(result);
              }
              reject(false)
            }).catch((err: any) => {
              reject(false)
            });
          })
        })
      })
    })
  }

  async addRecord(data: any) {
    return (await (this.ipfs.add(Buffer.from(JSON.stringify(data))))).path;
  }
}

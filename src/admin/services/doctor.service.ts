import { JsonPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { rejects } from 'assert';
import { resolve } from 'dns';
import { exit } from 'process';
import { from, Observable } from 'rxjs';
import { BlockchainService } from 'src/services/blockchain.service';
import { IpfsService } from 'src/services/ipfs.service';
import Web3 from 'web3';

const Contract = require('../../../build/contracts/Contract.json');

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  web3: any;
  abi: any = {};
  netWorkData: any = {};
  netId: any;
  address: any;
  contract: any;
  account: any;

  ipfs: any;

  msg_text: string = '';

  result: any;

  Doctors: any;

  DoctorDetails: string[] = [];

  drInfoload: boolean = false;

  constructor(
    private blockChainService: BlockchainService,
    private ipfsService: IpfsService,
    private http: HttpClient
  ) {
    //GET BlockChain Service
    this.web3 = blockChainService.getWeb3();

    this.web3.eth.getAccounts((err: any, accs: any) => {
      this.account = accs[0];
    });

    this.web3.eth.net.getId().then((r: number) => {
      this.netId = r;
      this.abi = Contract.abi;
      this.netWorkData = Contract.networks[this.netId];

      console.log(this.netWorkData);

      if (this.netWorkData) {
        this.address = this.netWorkData.address;
        this.contract = this.web3.eth.Contract(this.abi, this.address);

        console.log(this.contract.methods.getAdmin.call());
        this.Doctors = this.contract.methods.getAllDrs
          .call()
          .then((docs: string[]) => {
            this.Doctors = docs;
            console.log(this.Doctors);
          });
        console.log('Doctors', this.Doctors);
      } else {
        console.log('Contract not Deployed');
      }
    });

    //IPFS
    this.ipfs = ipfsService.getIPFS();
  }

  getDrs(): Promise<any> {
    return new Promise((resolve, rejects) => {
      this.blockChainService.getContract().then((contract: any) => {
        this.Doctors = contract.methods.getAllDrs()
          .call()
          .then((docs: any) => {
            this.Doctors = docs;
            console.log(this.Doctors);
            resolve(this.Doctors)
          });
      })

    })
  }

  getDoctorDetails(docID: any): Promise<any> {
    console.log('DocID', docID);
    return new Promise((resolve, reject) => {
      this.blockChainService.getContract().then((contract: any) => {
        contract.methods
          .getDr(docID)
          .call()
          .then((ipfsHash: string) => {
            console.log(ipfsHash);
            this.http.get('https://ipfs.infura.io/ipfs/' + ipfsHash)
              .subscribe((data: any) => {
                console.log(data);
                resolve(data);
              });
          });
      })

    })

  }
}

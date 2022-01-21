import { Injectable } from '@angular/core';
import { exit } from 'process';
import { from, Observable } from 'rxjs';
import { BlockchainService } from 'src/services/blockchain.service';
import Web3 from 'web3';

const Contract = require('../../../build/contracts/Contract.json');
const IPFS = require('ipfs-mini');

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

  constructor(private blockChainService: BlockchainService) {
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
        console.log(this.contract.methods.getAllDrs.call());
      } else {
        console.log('Contract not Deployed');
      }
    });

    //IPFS
    this.ipfs = new IPFS({
      host: 'ipfs.infura.io',
      port: 5001,
      protocol: 'https',
    });
  }

  async addDoctor(data: {}, docId: any): Promise<any> {
    //Add Data to IPFS
    return this.ipfs.addJSON(data).then(async (IPFShash: string) => {
      console.log(IPFShash);
      this.msg_text = 'Data added to IPFS...';
      //add data to blockchain
      return this.contract.methods
        .addDrInfo(docId, IPFShash)
        .send({ from: this.account })
      
      // console.log();
      
        
      // console.log(' doc servc returning',this.result);
      // return this.result;
    });

  }

}

// .on("confirmation",(result: any) => {
        //   console.log(result);
        //   this.msg_text += '<br>User Added to the Blockchain';
        //   this.result = result
        //   return result
        // })
        // // .then((result: any) => {
        // //   console.log('User Added to Block', result);
        // //   this.msg_text += '<br>User Added to the Blockchain';
        // //   return result;
        // // })
        // .catch((err: any) => {
        //   console.log(err);
        //   this.msg_text =
        //     '<br>Failed Adding to BlockChain <br>1. Invalid Doctor ID <br>2. Doctor Already exists';
        //   return err;
        // });
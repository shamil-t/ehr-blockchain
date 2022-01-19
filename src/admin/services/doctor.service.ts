import { Injectable } from '@angular/core';
import { BlockchainService } from 'src/services/blockchain.service';
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

  constructor(private blockChainService: BlockchainService) {
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
  }

  addDoctorRole(docID: any) {
    console.log(this.web3);
    console.log(this.account, this.contract);

    console.log(this.contract.methods.getAdmin.call());
    console.log(this.contract.methods.getAllDrs.call());

    this.contract.methods
      .addDoctor(0xf72d788dbc409b6c45fcd64dcea4764b05f4cd77)
      .send({ from: 0x99cae066681252f5213cf4a076cdf95b34c64c69 })
      .on('confirmation', (r: any) => {
        console.log(r);
      })
      .on('error', (er: any) => {
        console.log(er);
      });
  }
}

import { Injectable } from '@angular/core';
import { BlockchainService } from 'src/services/blockchain.service';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  web3: any;
  contract: any;
  account: any;

  isDoctor: boolean = false;
  Doctors: any = [];
  checkComplete:boolean = false

  constructor(private blockchainService: BlockchainService) {
    this.web3 = blockchainService.getWeb3();
    this.contract = blockchainService.getContract();
    this.account = blockchainService.getAccount();
  }

  checkisDr() {
    this.contract = this.blockchainService.contract;
    console.log(this.contract);

    this.account = this.blockchainService.account;
    console.log(this.account);

    this.contract.methods
      .getAllDrs()
      .call()
      .then((result: any) => {
        console.log(result);
        this.Doctors = result;
        if (this.Doctors.length >= 0) {
          for (var i = 0; i <= this.Doctors.length; i++) {
            if (this.Doctors[i] == this.account) {
              this.isDoctor = true;
            }
          }
        }
        this.checkComplete = true
      })
      .catch((err: any) => {
        console.log(err);
      });
  }
}

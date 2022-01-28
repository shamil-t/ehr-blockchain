import { Injectable } from '@angular/core';
import { rejects } from 'assert';
import { resolve } from 'dns';
import { Observable } from 'rxjs';
import { BlockchainService } from 'src/services/blockchain.service';
import { IpfsService } from 'src/services/ipfs.service';

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  web3: any;
  contract: any;
  account: any;

  isDoctor: boolean = false;
  Doctors: any = [];
  checkComplete: boolean = false;

  DoctorDetails: any = {};

  PatientDetails: any = {};

  ipfs: any;

  constructor(
    private blockchainService: BlockchainService,
    private ipfsService: IpfsService
  ) {
    this.web3 = blockchainService.getWeb3();
    this.contract = blockchainService.getContract();
    this.account = blockchainService.getAccount();

    this.ipfs = ipfsService.getIPFS();
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
        this.checkComplete = true;
      })
      .catch((err: any) => {
        console.log(err);
      });
  }

  async getDoctor(): Promise<any> {
    this.contract = this.blockchainService.contract;
    return new Promise((resolve, reject) => {
      this.contract.methods
        .getDr(this.account)
        .call()
        .then(async (result: any) => {
          console.log(result);
          await this.ipfs.cat(result).then((data: any) => {
            this.DoctorDetails = data;
            resolve(this.DoctorDetails);
            JSON.parse(this.DoctorDetails);
            return this.DoctorDetails;
          });
        });
    });
  }

  async checkIsPatient(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.contract.methods
        .isPat(id)
        .call()
        .then((result: any) => {
          console.log(result);
          resolve(result);
        })
        .catch((err: any) => {
          console.log(err);
          reject(err);
        });
    });
  }

  async getPatientDetails(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.contract.methods
        .getPatInfo(id)
        .call()
        .then((result: any) => {
          console.log(result);
          this.ipfs.cat(result).then((data: any) => {
            console.log(data);
            resolve(data);
          });
        })
        .catch((err: any) => {
          console.log(err);
          reject(err);
        });
    });
  }
}

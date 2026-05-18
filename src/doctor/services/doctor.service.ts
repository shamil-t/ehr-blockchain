import {inject, Injectable} from '@angular/core';
import {IpfsService} from 'src/services/ipfs.service';
import {DoctorType} from "../../shared/types/doctor.type";
import {Contract} from "ethers";
import {EhrContractService} from "../../services/ehr-contract.service";

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  contract!: Contract;
  account!: string;

  ipfs = inject(IpfsService);
  ehrContractService = inject(EhrContractService);

  constructor() {
  }

  async getDoctor(): Promise<DoctorType> {
    return (await this.ipfs.getJsonData(await this.ehrContractService.getDoctorDetailsHash()))
  }

  async checkIsPatient(id: string): Promise<boolean> {
    throw new Error("Functionality not implemented.");
  }

  async getPatientDetails(id: string): Promise<any> {
    throw new Error("Functionality not implemented.");
  }

  async savePatientMedRecord(data: any): Promise<any> {
    // console.log(this.patientId, data);
    // let PatientData = {
    //   doctor: this.account,
    //   data: data,
    //   date: Date.now()
    // }
    // return new Promise((resolve, reject) => {
    //   this.getPatientRecords(this.patientId)
    //     .then((record: any) => {
    //       console.log(record);
    //
    //       let PatientRecord;
    //
    //       if (record != null) {
    //         record['MedRecord'].push(PatientData)
    //         PatientRecord = record
    //       } else {
    //         PatientRecord = {"MedRecord": [PatientData]};
    //       }
    //
    //       console.log(PatientRecord);
    //       this.ipfs
    //         .addRecord(PatientRecord)
    //         .then((IPFSHash: any) => {
    //           console.log(IPFSHash);
    //           this.contract["addMedRecord"](IPFSHash, this.patientId)
    //             .then((result: any) => {
    //               console.log(result);
    //               resolve(result);
    //             })
    //             .catch((err: any) => {
    //               console.log(err);
    //               reject(err);
    //             });
    //         })
    //         .catch((err: any) => {
    //           console.log(err);
    //           reject(err);
    //         });
    //     })
    //     .catch((err: any) => {
    //       console.log(err);
    //       reject(err);
    //     });
    // });
    throw new Error("Functionality not implemented.");
  }

  async getPatientRecords(id: any): Promise<any> {
    // return new Promise((resolve, reject) => {
    //   this.contract["viewMedRec"](id)
    //     .then((result: any) => {
    //       console.log(result);
    //       if (result.length >= 1) {
    //         this.ipfs
    //           .getJsonData(result)
    //           .then((record: any) => {
    //             console.log(JSON.parse(record));
    //             resolve(JSON.parse(record));
    //           })
    //           .catch((err: any) => {
    //             console.log(err);
    //             reject(err);
    //           });
    //       } else {
    //         resolve(null)
    //       }
    //     })
    //     .catch((err: any) => {
    //       console.log(err);
    //       reject(err);
    //     });
    // });
    throw new Error("Functionality not implemented.");
  }
}

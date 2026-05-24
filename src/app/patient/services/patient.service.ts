import {inject, Injectable} from '@angular/core';
import {EhrContractService} from "../../services/ehr-contract.service";
import {PatientType} from "../../../types/patient.type";
import {IpfsService} from "../../services/ipfs.service";

@Injectable({
  providedIn: 'root',
})
export class PatientService {

  ehrContractService = inject(EhrContractService);
  ipfsService = inject(IpfsService)

  async registerPatient(patient: PatientType) {
    const ipfsHash = await this.ipfsService.addRecord(patient);
    await this.ehrContractService.addPatient(patient.walletAddress, ipfsHash);
  }
}

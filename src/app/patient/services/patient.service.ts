import {inject, Injectable} from '@angular/core';
import {EhrContractService} from "../../services/ehr-contract.service";
import {PatientType} from "../../../types/patient.type";
import {IpfsService} from "../../services/ipfs.service";
import {WalletService} from "../../services/wallet.service";

@Injectable({
  providedIn: 'root',
})
export class PatientService {

  walletService = inject(WalletService);
  ehrContractService = inject(EhrContractService);
  ipfsService = inject(IpfsService)

  async registerPatient(patient: PatientType) {
    const ipfsHash = await this.ipfsService.addRecord(patient);
    await this.ehrContractService.addPatient(patient.walletAddress, ipfsHash);
  }

  async getPatientProfile(): Promise<PatientType> {
    const ipfsHash = await this.ehrContractService.getPatientProfileHash(this.walletService.connectedAccount())
    return this.ipfsService.getJsonData<PatientType>(ipfsHash);

  }
}

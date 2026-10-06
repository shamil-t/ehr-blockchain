import {inject, Injectable} from '@angular/core';
import {IpfsService} from '../../services/ipfs.service';
import {DoctorType} from "../../../types/doctor.type";
import {EhrContractService} from "../../services/ehr-contract.service";
import {UiFeedbackService} from "../../services/ui-feedback.service";

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  ehrContractService = inject(EhrContractService);
  ipfsService = inject(IpfsService);
  uiFeedbackService = inject(UiFeedbackService);

  async getAllDoctors(): Promise<DoctorType[]> {
    let doctors = await this.ehrContractService.getAllDoctors();
    let data: DoctorType[] = []
    for (let doctor of doctors) {
      data.push(await this.getDoctorDetails(doctor.profileCID));
    }
    return data
  }

  async prepareDoctor(data: Record<string, unknown>): Promise<string> {
    const ipfsHash = await this.ipfsService.addRecord(data)
    this.uiFeedbackService.showProgress(70, "Data added to IPFS...")
    return ipfsHash;
  }

  estimateAddDoctorTransaction(docId: string, ipfsHash: string) {
    return this.ehrContractService.estimateAddDoctorTransaction(docId, ipfsHash);
  }

  async addDoctor(docId: string, ipfsHash: string): Promise<void> {
    this.uiFeedbackService.showLoader("Please confirm MetaMask Transaction")
    return await this.ehrContractService.addDoctor(docId, ipfsHash)
  }

  addDocImage(selectedDocImage: File) {
    return this.ipfsService.addFile(selectedDocImage);
  }

  private async getDoctorDetails(doctorCID: any) {
    return this.ipfsService.getJsonData<DoctorType>(doctorCID);
  }
}

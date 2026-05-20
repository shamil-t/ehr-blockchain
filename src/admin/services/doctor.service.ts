import {inject, Injectable} from '@angular/core';
import {IpfsService} from 'src/services/ipfs.service';
import {KuboRPCClient} from "kubo-rpc-client";
import {DoctorType} from "../../types/doctor.type";
import {EhrContractService} from "../../services/ehr-contract.service";
import {UiFeedbackService} from "../../services/ui-feedback.service";

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  ehrContractService = inject(EhrContractService);
  ipfsService = inject(IpfsService);
  uiFeedbackService = inject(UiFeedbackService);
  ipfs: KuboRPCClient;

  constructor() {
    this.ipfs = this.ipfsService.getIPFS();
  }

  async getAllDoctors(): Promise<DoctorType[]> {
    let doctors = await this.ehrContractService.getAllDoctors();
    let data: DoctorType[] = []
    for (let doctor of doctors) {
      data.push(await this.getDoctorDetails(doctor.profileCID));
    }
    return data
  }

  async addDoctor(data: any): Promise<any> {
    const docId = data.docId;

    const ipfsHash = await this.ipfsService.addRecord(data)
    this.uiFeedbackService.showProgress(70, "Data added to IPFS...")
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

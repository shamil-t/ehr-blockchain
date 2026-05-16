import {inject, Injectable} from '@angular/core';
import {IpfsService} from 'src/services/ipfs.service';
import {KuboRPCClient} from "kubo-rpc-client";
import {DoctorType} from "../../types/doctor.type";
import {EhrContractService} from "../../services/ehr-contract.service";

@Injectable({
  providedIn: 'root',
})
export class DoctorService {
  ehrContractService = inject(EhrContractService);
  ipfsService = inject(IpfsService);

  ipfs: KuboRPCClient;

  constructor() {
    this.ipfs = this.ipfsService.getIPFS();
  }

  async getDrs(): Promise<any> {
    return await this.ehrContractService.getAllDoctorsIds()
  }

  async getDoctorDetails(docID: any) {
    let docIpfsHash = await this.ehrContractService.getDoctorDetailsHash(docID)
    return this.ipfsService.getJsonData<DoctorType>(docIpfsHash);
  }

  async addDoctor(data: any): Promise<any> {
    const docId = data.docId;
    const ipfsHash = await this.ipfsService.addRecord(data)
    return await this.ehrContractService.addDoctor(docId, ipfsHash)
  }

  addDocImage(selectedDocImage: File) {
    return this.ipfsService.addFile(selectedDocImage);
  }
}

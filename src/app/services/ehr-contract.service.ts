import {effect, inject, Injectable} from '@angular/core';
import EHR_Contract from '../../assets/contract/EHR.json'
import DeployedAddress from '../../assets/contract/deployed_addresses.json'
import {Contract} from "ethers";
import {WalletService} from "./wallet.service";
import {User} from "../../enums/user.enum";
import {UserType} from "../../types/user.type";

@Injectable({
  providedIn: 'root',
})
export class EhrContractService {
  account = ''
  private walletService = inject(WalletService)
  private readonly CONTRACT_ADDRESS = DeployedAddress["EHR#EHR"]
  private readonly ABI = EHR_Contract.abi
  private ehrContract: Contract | null = null
  private signerAddress: string = ''

  constructor() {
    effect(() => {
      this.account = this.walletService.connectedAccount()
      this.ehrContract = null
    });
  }

  async isAdmin(): Promise<boolean> {
    return (await this.isUser()) == User.ADMIN;
  }

  async isDoctor(): Promise<boolean> {
    return (await this.isUser()) == User.DOCTOR;
  }

  async isPatient(): Promise<boolean> {
    return (await this.isUser()) == User.PATIENT;
  }

  async addDoctor(drId: string, ipfsHash: string): Promise<void> {
    return await this.addUser(drId, ipfsHash, User.DOCTOR)
  }

  async getAllDoctors(): Promise<UserType[]> {
    if (!this.ehrContract) {
      this.ehrContract = await this.getContract()
    }
    return await this.ehrContract["getAllDoctors"]()
  }

  async getDoctorDetailsHash(): Promise<string> {
    if (!this.ehrContract) {
      this.ehrContract = await this.getContract()
    }
    return await this.ehrContract["getDoctorProfile"]()
  }

  async validateContract() {
    if (!this.ehrContract) {
      this.ehrContract = await this.getContract()
    }
    let code = await this.walletService.getWalletProvider().getCode(this.ehrContract.target);
    if (code == "0x") {
      throw new Error(`Contract is not deployed or not present in the connected network`)
    }
    return true
  }

  /**
   *
   * Private contract functions
   * */

  private async isUser(): Promise<number> {
    if (!this.ehrContract) {
      this.ehrContract = await this.getContract()
    }
    return Number(await this.ehrContract["isUser"](this.account))
  }

  private async addUser(id: string, ipfsHash: string, user: User): Promise<void> {
    if (!this.ehrContract) {
      this.ehrContract = await this.getContract()
    }
    return await this.ehrContract["addUser"](id, ipfsHash, user)
  }

  private async getContract() {
    let signer = await this.walletService.getSigner()
    if (!this.ehrContract || signer.address != this.signerAddress) {
      // if(this.ehrContract == null) console.log("Empty contract -> creating new contract")
      // if(this.signerAddress != signer.address) console.log("Signer address changed")
      this.signerAddress = signer.address
      this.ehrContract = new Contract(this.CONTRACT_ADDRESS, this.ABI, signer)
    }
    return this.ehrContract;
  }

}

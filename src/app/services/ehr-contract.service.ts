import {effect, inject, Injectable} from '@angular/core';
import EHR_Contract from '../../assets/contract/EHR.json'
import DeployedAddress from '../../assets/contract/deployed_addresses.json'
import {Contract} from "ethers";
import {User} from "../../enums/user.enum";
import {UserType} from "../../types/user.type";
import {EhrWalletService} from "../wallet/ehr-wallet.service";
import {ProviderService} from "../wallet/provider.service";

@Injectable({
  providedIn: 'root',
})
export class EhrContractService {
  account = ''
  private walletService = inject(EhrWalletService)
  private readonly providerService = inject(ProviderService);
  private readonly CONTRACT_ADDRESS = DeployedAddress["EHR#EHR"]
  private readonly ABI = EHR_Contract.abi
  private ehrContract: Contract | null = null
  private signerAddress: string = ''

  constructor() {
    effect(() => {
      this.account = this.walletService.address() || ""
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

  async getUserType(): Promise<User> {
    return +(await this.isUser())
  }

  async addDoctor(drId: string, ipfsHash: string): Promise<void> {
    return await this.addUser(drId, ipfsHash, User.DOCTOR)
  }

  async estimateAddDoctorTransaction(drId: string, ipfsHash: string): Promise<{
    from: string;
    to: string;
    gasLimit: bigint;
    estimatedFee: bigint;
  }> {
    if (!this.ehrContract) {
      this.ehrContract = await this.getContract()
    }

    const from = this.walletService.address();
    if (!from) throw new Error("No wallet is configured.");

    const gasLimit = await this.ehrContract["addUser"].estimateGas(drId, ipfsHash, User.DOCTOR);
    const feeData = await this.providerService.getProvider().getFeeData();
    const feePerGas = feeData.maxFeePerGas ?? feeData.gasPrice;
    if (feePerGas === null) throw new Error("Transaction fee data is unavailable.");

    return {
      from,
      to: this.CONTRACT_ADDRESS,
      gasLimit,
      estimatedFee: gasLimit * feePerGas,
    };
  }

  async getAllDoctors(): Promise<UserType[]> {
    if (!this.ehrContract) {
      this.ehrContract = await this.getContract()
    }
    return await this.ehrContract["getAllDoctors"]()
    // throw new Error("Method not implemented.");
  }

  async addPatient(patId: string, ipfsHash: string): Promise<void> {
    return await this.addUser(patId, ipfsHash, User.PATIENT)
  }

  async getDoctorDetailsHash(): Promise<string> {
    if (!this.ehrContract) {
      this.ehrContract = await this.getContract()
    }
    return await this.ehrContract["getDoctorProfile"]()
    // throw new Error("Method not implemented.");
  }

  async getPatientProfileHash(id: string): Promise<string> {
    // if (!this.ehrContract) {
    //   this.ehrContract = await this.getContract()
    // }
    // return await this.ehrContract["getPatientProfile"](id)
    throw new Error("Method not implemented.");
  }

  async validateContract() {
    // if (!this.ehrContract) {
    //   this.ehrContract = await this.getContract()
    // }
    // let code = await this.walletService.getWalletProvider().getCode(this.ehrContract.target);
    // if (code == "0x") {
    //   throw new Error(`Contract is not deployed or not present in the connected network`)
    // }
    // return true
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
    // return 1 //FIXME
  }

  private async addUser(id: string, ipfsHash: string, user: User): Promise<void> {
    if (!this.ehrContract) {
      this.ehrContract = await this.getContract()
    }
    return await this.ehrContract["addUser"](id, ipfsHash, user)
  }

  private async getContract() {
    let signer = await this.walletService.getSigner()
    if (!signer) throw new Error("Signer not found.");
    if (!this.ehrContract) {
      // if (this.ehrContract == null) console.log("Empty contract -> creating new contract")
      this.ehrContract = new Contract(this.CONTRACT_ADDRESS, this.ABI, signer)
    }
    return this.ehrContract;
  }

}

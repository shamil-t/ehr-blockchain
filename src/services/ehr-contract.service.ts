import {effect, inject, Injectable} from '@angular/core';
import EHR_Contract from '../assets/contract/Contract.json'
import DeployedAddress from '../assets/contract/deployed_addresses.json'
import {Contract} from "ethers";
import {WalletService} from "./wallet.service";

@Injectable({
  providedIn: 'root',
})
export class EhrContractService {
  private walletService = inject(WalletService)
  private readonly CONTRACT_ADDRESS = DeployedAddress["Contract#Contract"]
  private readonly ABI = EHR_Contract.abi
  private ehrContract: Contract | null = null
  private signerAddress: string = ''

  constructor() {
    effect(() => {
      let _ = this.walletService.connectedAccount()
      this.ehrContract = null
    });
  }

  async isAdmin(): Promise<boolean> {
    if (!this.ehrContract) {
      this.ehrContract = await this.getContract()
    }
    return await this.ehrContract["isAdmin"]();
  }

  async isDoctor(): Promise<boolean> {
    if (!this.ehrContract) {
      this.ehrContract = await this.getContract()
    }
    return await this.ehrContract["isDr"](await this.walletService.getConnectedAccount());
  }

  async addDoctor(drId: string, ipfsHash: string): Promise<void> {
    if (!this.ehrContract) {
      this.ehrContract = await this.getContract()
    }
    return await this.ehrContract["addDrInfo"](drId, ipfsHash)
  }

  async getAllDoctorsIds(): Promise<string[]> {
    if (!this.ehrContract) {
      this.ehrContract = await this.getContract()
    }
    return await this.ehrContract["getAllDrs"]()
  }

  async getDoctorDetailsHash(drId: string): Promise<string> {
    if (!this.ehrContract) {
      this.ehrContract = await this.getContract()
    }
    if (!drId) drId = this.signerAddress
    return await this.ehrContract["getDr"](drId)
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

// const EHR_Contract = require('./src/assets/contract/EHR.sol.json')
// const DeployedAddress = require('./src/assets/contract/deployed_addresses.json')

import EHR_Contract from '../src/assets/contract/EHR.json' with {type: 'json'}
import DeployedAddress from '../src/assets/contract/deployed_addresses.json' with {type: 'json'}

import {create} from "kubo-rpc-client";
import {Contract, JsonRpcProvider, Wallet} from "ethers";

const IPFS = {
  localIPFS: 'http://127.0.0.1:5001/api/v0',
  localIPFSGet: 'http://localhost:8080/ipfs/'
}

const ABI = EHR_Contract.abi
const contractAddress = DeployedAddress["EHR#EHR"]

class IpfsService {
  ipfs;

  constructor() {
    this.ipfs = create({url: IPFS.localIPFS});
  }

  async addFile(file) {
    return this.ipfs.add(file);
  }

  async addRecord(data) {
    const jsonData = JSON.stringify(data);
    const result = await this.ipfs.add(jsonData);
    return result.path;
    // return (await (this.ipfs.add(Buffer.from(JSON.stringify(data))))).path;
  }
}


async function main() {

  const ipfs = new IpfsService()

  const web3Provider = new JsonRpcProvider("http://localhost:8545")
  const adminKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

  const wallet = new Wallet(adminKey, web3Provider)

  const contract = new Contract(contractAddress, ABI, wallet)

  const doctor = {
    city: "Canary Wharf",
    docId: "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
    doj: "10-02-2025",
    emailId: "test@mail.com",
    fName: "Dr Test",
    image: "QmXfyY7MtHGZMXFAKypLcefXiaHDwJBeyaAszqUriRAWjk",
    lName: "1",
    phone: "11212121212",
    speciality: "General Medicine",
    state: "London"
  }

  console.log("Adding test doctor...")

  const ipfsHash = await ipfs.addRecord(doctor)

  // addUser(address id, string  memory dataHash, UserType userType)
  contract["addUser"](doctor.docId, ipfsHash, 2).then(result => {
    console.log("Successfully added doctor...")
  })
}

main().catch(console.error)


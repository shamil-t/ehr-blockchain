import {buildModule} from "@nomicfoundation/hardhat-ignition/modules"

export default buildModule("Contract", (m)=>{
  const contract = m.contract("Contract")

  return {contract};
})

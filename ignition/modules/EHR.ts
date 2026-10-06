import {buildModule} from "@nomicfoundation/hardhat-ignition/modules"

export default buildModule("EHR", (m)=>{
  const contract = m.contract("EHR")

  return {contract};
})

import { defineConfig } from "hardhat/config";
import hardhatIgnitionViemPlugin from "@nomicfoundation/hardhat-ignition-viem";

export default defineConfig({
  plugins: [hardhatIgnitionViemPlugin],
  solidity: {
    version: "0.8.28",
  },
});

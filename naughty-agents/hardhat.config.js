// ESM Hardhat config for the frontend package
import { configVariable } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-keystore";

/** @type {import('hardhat/config').HardhatUserConfig} */
const config = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },
    "base-sepolia": {
      type: "http",
      chainType: "l1",
      url: configVariable("BASE_SEPOLIA_RPC_URL"),
      accounts: [configVariable("DEPLOYER_PRIVATE_KEY")],
      chainId: 84532,
    },
    zircuit: {
      type: "http",
      chainType: "l1",
      url: configVariable("ZIRCUIT_RPC_URL"),
      accounts: [configVariable("ZIRCUIT_PRIVATE_KEY")],
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./src/artifacts",
    tests: "./test",
  },
};

export default config;



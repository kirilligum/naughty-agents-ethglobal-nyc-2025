import { HardhatUserConfig, configVariable } from "hardhat/config";
import hardhatToolboxViemPlugin from "@nomicfoundation/hardhat-toolbox-viem";
import hardhatKeystore from "@nomicfoundation/hardhat-keystore";

// --- Resolve your secret variables here, before the config object ---

// For base-sepolia
const BASE_SEPOLIA_RPC_URL = configVariable("BASE_SEPOLIA_RPC_URL");
const DEPLOYER_PRIVATE_KEY = configVariable("DEPLOYER_PRIVATE_KEY");

// For sepolia (this also fixes the other network)
const SEPOLIA_RPC_URL = configVariable("SEPOLIA_RPC_URL");
const SEPOLIA_PRIVATE_KEY = configVariable("SEPOLIA_PRIVATE_KEY");

// --- Main Configuration ---

const config: HardhatUserConfig = {
  plugins: [hardhatToolboxViemPlugin, hardhatKeystore],
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    "base-sepolia": {
      type: "http",
      chainType: "l1",
      // Use the resolved variable. Hardhat's validator will now see a plain string.
      url: BASE_SEPOLIA_RPC_URL,
      // Use the resolved variable.
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 84532,
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: SEPOLIA_RPC_URL,
      accounts: [SEPOLIA_PRIVATE_KEY],
    },
  },
  paths: {
    artifacts: "./src/artifacts",
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
  },
};

export default config;

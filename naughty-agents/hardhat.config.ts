import { HardhatUserConfig, configVariable } from "hardhat/config";
// The toolbox includes Viem, Ignition, Keystore, and the Node.js test runner.
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  plugins: [hardhatToolboxViem],
  networks: {
    // Local development network (Hardhat 3 style)
    hardhat: {
      type: "edr-simulated",
      chainType: "l1",
    },
    // Target network (Base Sepolia)
    "base-sepolia": {
      type: "http",
      chainType: "l1",
      // Use configVariable; it will be resolved from the keystore or .env file
      url: configVariable("BASE_SEPOLIA_RPC_URL"),
      // DEPLOYER_PRIVATE_KEY must be set in the keystore
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
    // CRITICAL: Output artifacts directly into the src folder for Vite access
    artifacts: './src/artifacts',
    sources: "./contracts",
    tests: "./test",
  },
};
export default config;

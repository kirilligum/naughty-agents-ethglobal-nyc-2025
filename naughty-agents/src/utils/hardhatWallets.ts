import { createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { selectedChain } from "../viem";

// Hardhat's default mnemonic: test test test test test test test test test test test junk
// These private keys correspond to the accounts derived from this mnemonic.
// This is for local development and demo purposes only. DO NOT use in production.
const deployerPrivateKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"; // Account #0
const alicePrivateKey = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"; // Account #1
const bobPrivateKey = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a";   // Account #2

export const deployerWallet = createWalletClient({
  account: privateKeyToAccount(deployerPrivateKey),
  chain: selectedChain,
  transport: http(),
});

export const aliceWallet = createWalletClient({
  account: privateKeyToAccount(alicePrivateKey),
  chain: selectedChain,
  transport: http(),
});

export const bobWallet = createWalletClient({
  account: privateKeyToAccount(bobPrivateKey),
  chain: selectedChain,
  transport: http(),
});

import { createPublicClient, http } from "viem";

type Network = "base-sepolia" | "zircuit";
const TARGET = ((import.meta as any).env?.VITE_TARGET_NETWORK as Network) || "base-sepolia";

const CHAINS: Record<Network, any> = {
  "base-sepolia": {
    id: 84532,
    name: "Base Sepolia",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [((import.meta as any).env?.VITE_BASE_SEPOLIA_RPC_URL as string) || "https://sepolia.base.org"] } },
  },
  zircuit: {
    id: 48898,
    name: "Zircuit",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [((import.meta as any).env?.VITE_ZIRCUIT_RPC_URL as string) || "https://zircuit1-mainnet.p2pify.com/"] } },
  },
};

export const selectedChain = CHAINS[TARGET];
export const publicClient = createPublicClient({ chain: selectedChain, transport: http() });


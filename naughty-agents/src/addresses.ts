type Network = "base-sepolia" | "zircuit";

const TARGET = ((import.meta as any).env?.VITE_TARGET_NETWORK as Network) || "base-sepolia";

const ADDRS: Record<Network, {
  network: string;
  actionRegistry: `0x${string}`;
  webOfTrust: `0x${string}`;
  reviewOracle: `0x${string}`;
  securityModule: `0x${string}` | "";
}> = {
  "base-sepolia": {
    network: "base-sepolia",
    actionRegistry: "0x014Affd16c265e43821d7f55111bddb6D010745f",
    webOfTrust: "0x35cb4A71EF67974A4fB8f0e8be040C1D834F7e00",
    reviewOracle: "0xcCc069809ad77cc4f94269c449067fcf3870dF88",
    securityModule: "",
  },
  zircuit: {
    network: "zircuit",
    actionRegistry: "0xb1fEC5fe2d82A189eE793aE9a675eA4a7caC6e99",
    webOfTrust: "0xC6b24b940eFdC5679Fe8331cBd74cD4bAB653A96",
    reviewOracle: "0x9D3fc0C3F2686Acd604Fc399F3672ebbB4B5E410",
    securityModule: "",
  },
};

export const CONTRACT_ADDRESSES = ADDRS[TARGET];


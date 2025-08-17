import { keccak256, toBytes } from "viem";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

declare const hre: HardhatRuntimeEnvironment; // Declare hre for TypeScript

// Addresses from the latest localhost deployment (na-local-1)
const ADDRESSES = {
  actionRegistry: "0x5FC8d32690cc91D4c39d9d3abcBD16989F875707",
  webOfTrust: "0x0165878A594ca255338adfa4d48449f69242Eb8F",
  reviewOracle: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
};

function canonicalizeAction(action: string, params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = (params as any)[k];
      return acc;
    }, {});
  return JSON.stringify({ action, params: sorted });
}

async function main() {
  // Check if hre.ethers is defined
  if (typeof hre.ethers === 'undefined') {
    console.error("Error: hre.ethers is undefined. Ensure @nomicfoundation/hardhat-ethers is installed and included in hardhat.config.ts plugins.");
    process.exit(1);
  }

  const [deployer, alice, bob] = await hre.ethers.getSigners();

  const WebOfTrust = await hre.ethers.getContractFactory("WebOfTrust");
  const webOfTrust = WebOfTrust.attach(ADDRESSES.webOfTrust).connect(deployer);

  const ActionRegistry = await hre.ethers.getContractFactory("ActionRegistry");
  const actionRegistry = ActionRegistry.attach(ADDRESSES.actionRegistry);

  const ReviewOracle = await hre.ethers.getContractFactory("ReviewOracle");
  const reviewOracle = ReviewOracle.attach(ADDRESSES.reviewOracle).connect(deployer);

  const requiredStake = hre.ethers.parseEther("0.01");

  // Create two invite codes from the genesis member (deployer)
  const tx1 = await webOfTrust.createInviteCode();
  const receipt1 = await tx1.wait();
  const code1Event = receipt1.logs.find(log => (webOfTrust.interface.parseLog(log)?.name === 'InviteCodeCreated'))?.args[0];

  const tx2 = await webOfTrust.createInviteCode();
  const receipt2 = await tx2.wait();
  const code2Event = receipt2.logs.find(log => (webOfTrust.interface.parseLog(log)?.name === 'InviteCodeCreated'))?.args[0];

  if (!code1Event || !code2Event) {
      console.error("Failed to retrieve invite codes from events.");
      process.exit(1);
  }
  console.log("Invite codes created");

  // Register Alice
  const wotAlice = WebOfTrust.attach(ADDRESSES.webOfTrust).connect(alice);
  await wotAlice.register(code1Event, { value: requiredStake });
  console.log("Alice registered");

  // Register Bob
  const wotBob = WebOfTrust.attach(ADDRESSES.webOfTrust).connect(bob);
  await wotBob.register(code2Event, { value: requiredStake });
  console.log("Bob registered");

  // Build a malicious action hash (same as UI example)
  const canonical = canonicalizeAction("native_transfer", {
    to: "0x0000000000000000000000000000000000000001",
    amount: 100,
  });
  const actionHash = keccak256(toBytes(canonical));
  console.log("Action hash:", actionHash);

  // Flag action for review (simulate SecurityModule)
  const oracleAlice = ReviewOracle.attach(ADDRESSES.reviewOracle).connect(alice);
  await oracleAlice.flagActionForReview(actionHash);
  console.log("Action flagged for review");

  // Cast 3 votes to reach quorum
  await reviewOracle.castBlacklistVote(0, true); // deployer
  const oracleBob = ReviewOracle.attach(ADDRESSES.reviewOracle).connect(bob);
  await oracleAlice.castBlacklistVote(0, true);
  await oracleBob.castBlacklistVote(0, true);
  console.log("Votes cast (3)");

  // Resolve
  await oracleAlice.resolveBlacklistVote(0);
  console.log("Task resolved");

  const status = await actionRegistry.getActionStatus(actionHash);
  console.log("ActionRegistry status:", status.toString()); // 2 expected
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

import { expect } from "chai";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { getAddress, parseEther, keccak256, toHex } from "viem";

describe("Naughty Agents Protocol", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  async function deployFullProtocolFixture() {
    const [owner, reviewer1, reviewer2, reviewer3, user] = await viem.getWalletClients();

    // 1. Deploy contracts
    const requiredStake = parseEther("0.01");
    const webOfTrust = await viem.deployContract("WebOfTrust", [requiredStake], { client: { wallet: owner } });
    const actionRegistry = await viem.deployContract("ActionRegistry", [], { client: { wallet: owner } });
    const reviewOracle = await viem.deployContract("ReviewOracle", [webOfTrust.address, actionRegistry.address], { client: { wallet: owner } });

    // 2. Link contracts
    await actionRegistry.write.setReviewOracleAddress([reviewOracle.address], { account: owner.account });

    // 3. Setup reviewers
    const reviewers = [reviewer1, reviewer2, reviewer3];
    for (const reviewer of reviewers) {
        const inviteCodeTx = await webOfTrust.write.createInviteCode([], { account: owner.account });
        const receipt = await publicClient.waitForTransactionReceipt({ hash: inviteCodeTx });
        const events = await webOfTrust.getEvents.InviteCodeCreated({}, { fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber });
        const inviteCode = events[0].args.code;

        await owner.sendTransaction({ to: reviewer.account.address, value: parseEther("1.0") });
        await webOfTrust.write.register([inviteCode], { value: requiredStake, account: reviewer.account });
    }

    return { webOfTrust, actionRegistry, reviewOracle, owner, reviewers, user, publicClient };
  }

  describe("Full Demo Flow", function () {
    it("Should flag, vote, and blacklist an action", async function () {
      const { actionRegistry, reviewOracle, reviewers } = await deployFullProtocolFixture();

      // Define a malicious action
      const actionHash = keccak256(toHex("drain_wallet()"));

      // Scene 2: The Attack (simulated)
      // The security module would call this. We simulate it directly.
      // First, check status is Unknown (0)
      let status = await actionRegistry.read.getActionStatus([actionHash]);
      expect(status).to.equal(0);

      // Flag for review
      await reviewOracle.write.flagActionForReview([actionHash]);

      // The task ID will be 0 for the first task
      const taskId = 0n;

      // Scene 3: The Community Defense
      // Reviewers vote to blacklist
      for (const reviewer of reviewers) {
        await reviewOracle.write.castBlacklistVote([taskId, true], { account: reviewer.account });
      }

      // Resolve the vote
      await reviewOracle.write.resolveBlacklistVote([taskId]);

      // Check that the action is now blacklisted (status 2)
      status = await actionRegistry.read.getActionStatus([actionHash]);
      expect(status).to.equal(2);
    });
  });
});

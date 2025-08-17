import { expect } from "chai";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { getAddress, parseEther } from "viem";

describe("WebOfTrust", async function () {
  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();

  // We define a fixture to reuse the same setup in every test.
  async function deployWebOfTrustFixture() {
    const [owner, otherAccount] = await viem.getWalletClients();

    const requiredStake = parseEther("0.01");
    // we use the owner wallet to deploy the contract
    const webOfTrust = await viem.deployContract("WebOfTrust", [requiredStake], { client: { wallet: owner } });

    return { webOfTrust, requiredStake, owner, otherAccount, publicClient };
  }

  describe("Deployment", function () {
    it("Should set the right owner and required stake", async function () {
      const { webOfTrust, requiredStake, owner } = await deployWebOfTrustFixture();

      expect(await webOfTrust.read.GENESIS_MEMBER()).to.equal(getAddress(owner.account.address));
      expect(await webOfTrust.read.requiredStake()).to.equal(requiredStake);
    });
  });

  describe("Registration", function () {
    it("Should allow a user to register with a valid invite code and sufficient stake", async function () {
      const { webOfTrust, requiredStake, owner, otherAccount, publicClient } = await deployWebOfTrustFixture();

      // Call createInviteCode as a write transaction
      const txHash = await webOfTrust.write.createInviteCode([], { account: owner.account });

      // Wait for the transaction to be mined and get the receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

      // Find the event in the transaction logs
      // Note: A simpler way might exist with viem's test helpers, but this is robust.
      const events = await webOfTrust.getEvents.InviteCodeCreated(
        {},
        { fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber }
      );
      expect(events).to.have.lengthOf(1);
      const inviteCode = events[0].args.code;

      // Now use the retrieved invite code to register
      await webOfTrust.write.register([inviteCode], { value: requiredStake, account: otherAccount.account });

      const member = await webOfTrust.read.members([getAddress(otherAccount.account.address)]);
      expect(member[2]).to.be.true; // isActive
      expect(member[1]).to.equal(getAddress(owner.account.address)); // invitedBy
    });

    it("Should fail if the stake is insufficient", async function () {
      const { webOfTrust, owner, otherAccount, publicClient } = await deployWebOfTrustFixture();
      const txHash = await webOfTrust.write.createInviteCode([], { account: owner.account });
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });
      const events = await webOfTrust.getEvents.InviteCodeCreated({}, { fromBlock: receipt.blockNumber, toBlock: receipt.blockNumber });
      const inviteCode = events[0].args.code;

      const insufficientStake = parseEther("0.005");

      // Using a try-catch block for async rejection testing in node:test
      try {
        await webOfTrust.write.register([inviteCode], { value: insufficientStake, account: otherAccount.account });
        // If it doesn't throw, the test should fail
        expect.fail("The transaction should have reverted with 'Insufficient stake'");
      } catch (error: any) {
        expect(error.message).to.contain("reverted with reason string 'Insufficient stake'");
      }
    });

    it("Should fail with an invalid invite code", async function () {
        const { webOfTrust, requiredStake, otherAccount } = await deployWebOfTrustFixture();
        const invalidCode = "0x0000000000000000000000000000000000000000000000000000000000000000";

        try {
            await webOfTrust.write.register([invalidCode], { value: requiredStake, account: otherAccount.account });
            expect.fail("The transaction should have reverted with 'Invalid or used code'");
        } catch (error: any) {
            expect(error.message).to.contain("reverted with reason string 'Invalid or used code'");
        }
    });
  });
});

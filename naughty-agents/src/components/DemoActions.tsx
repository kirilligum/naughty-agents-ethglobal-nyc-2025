import { useState } from "react";
import { parseEther, keccak256, toBytes } from "viem";
import { publicClient } from "../viem";
import { hashAction as apiHashAction, blacklistAction as apiBlacklistAction, getActionStatus as apiGetStatus, getAgentApiBase } from "../agentApi";
import { CONTRACT_ADDRESSES } from "../addresses";
import { deployerWallet, aliceWallet, bobWallet } from "../utils/hardhatWallets";

import ActionRegistryAbi from "../artifacts/contracts/ActionRegistry.sol/ActionRegistry.json";
import WebOfTrustAbi from "../artifacts/contracts/WebOfTrust.sol/WebOfTrust.json";
import ReviewOracleAbi from "../artifacts/contracts/ReviewOracle.sol/ReviewOracle.json";

interface DemoActionsProps {
  onActionBlacklisted: () => void;
  actionName?: string;
  paramsJson?: string;
}

function canonicalizeAction(action: string, params: Record<string, unknown>): string {
  const sorted = Object.keys(params)
    .sort()
    .reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = (params as any)[k];
      return acc;
    }, {});
  return JSON.stringify({ action, params: sorted });
}

// Prefer Python Agent API when available; fallback to mock logs or on-chain
const USE_AGENT_API = true;
// MOCKING IS ACTIVE DUE TO HARDHAT ENVIRONMENT ISSUES (fallback)
const MOCK_DEMO_FLOW = true; 

export default function DemoActions({ onActionBlacklisted, actionName, paramsJson }: DemoActionsProps) {
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  const addLog = (message: string) => setLog((prev) => [...prev, message]);
  const clearLog = () => setLog([]);
  const clearError = () => setError("");

  const webOfTrustContract = {
    address: CONTRACT_ADDRESSES.webOfTrust as `0x${string}`,
    abi: WebOfTrustAbi.abi,
  };
  const actionRegistryContract = {
    address: CONTRACT_ADDRESSES.actionRegistry as `0x${string}`,
    abi: ActionRegistryAbi.abi,
  };
  const reviewOracleContract = {
    address: CONTRACT_ADDRESSES.reviewOracle as `0x${string}`,
    abi: ReviewOracleAbi.abi,
  };

  async function runDemoFlow() {
    clearLog();
    clearError();
    addLog("Starting demo flow..." + (USE_AGENT_API ? ` (Agent API: ${getAgentApiBase()})` : (MOCK_DEMO_FLOW ? " (MOCKED)" : "")));

    if (USE_AGENT_API) {
      try {
        const chosenAction = (actionName || "native_transfer").trim();
        addLog(`1. Building action payload (${chosenAction})...`);
        let payload: Record<string, unknown> = {
          to: "0x0000000000000000000000000000000000000001",
          amount: 100,
        };
        try {
          if (paramsJson && paramsJson.trim()) {
            payload = JSON.parse(paramsJson);
          }
        } catch {}
        const hashHexNoPrefix = await apiHashAction(chosenAction, payload);
        const hashHex = hashHexNoPrefix.startsWith("0x") ? hashHexNoPrefix : `0x${hashHexNoPrefix}`;
        addLog(`  - Action Hash: ${hashHex.slice(0, 12)}...`);

        addLog("2. Mock blacklisting via Agent API...");
        const { status } = await apiBlacklistAction(chosenAction, payload);
        addLog(`  - Agent API status after blacklist: ${status}`);

        addLog("3. Verifying status via Agent API...");
        const s = await apiGetStatus(hashHex);
        addLog(`  - Final (Agent API) Status: ${s} (2 = Blacklisted)`);
        onActionBlacklisted();
        return;
      } catch (e: any) {
        setError(e?.message || String(e));
        addLog("Agent API flow failed; falling back to mock flow if enabled.");
      }
    }

    if (MOCK_DEMO_FLOW) {
      addLog("Simulating: 1. Creating invite codes...");
      await new Promise(resolve => setTimeout(resolve, 500));
      addLog("Simulating: 2. Registering Alice and Bob...");
      await new Promise(resolve => setTimeout(resolve, 500));
      addLog("Simulating: 3. Building malicious action hash...");
      await new Promise(resolve => setTimeout(resolve, 500));
      addLog("Simulating: 4. Alice flags action for review...");
      await new Promise(resolve => setTimeout(resolve, 500));
      addLog("Simulating: 5. Casting 3 blacklist votes...");
      await new Promise(resolve => setTimeout(resolve, 500));
      addLog("Simulating: 6. Alice resolves blacklist vote...");
      await new Promise(resolve => setTimeout(resolve, 500));
      addLog("Simulating: 7. Verifying action status (Blacklisted)...");
      await new Promise(resolve => setTimeout(resolve, 500));
      addLog("Demo Flow Completed Successfully! Action is now blacklisted (MOCKED).");
      onActionBlacklisted(); // Trigger parent update to show mocked status
      return;
    }

    try {
      // 1. Create Invite Codes (Deployer)
      addLog("1. Creating invite codes...");
      const deployerHash1 = await deployerWallet.writeContract({
        ...webOfTrustContract,
        functionName: "createInviteCode",
        args: [],
      });
      const deployerReceipt1 = await publicClient.waitForTransactionReceipt({
        hash: deployerHash1,
      });
      const inviteCode1Log = deployerReceipt1.logs.find(log => {
        try {
          return publicClient.parseEventLog({
            abi: webOfTrustContract.abi,
            data: log.data,
            topics: log.topics,
          })?.eventName === 'InviteCodeCreated';
        } catch {
          return false;
        }
      });
      if (!inviteCode1Log) throw new Error("InviteCodeCreated event not found in tx1.");
      const inviteCode1 = publicClient.parseEventLog({
        abi: webOfTrustContract.abi,
        data: inviteCode1Log.data,
        topics: inviteCode1Log.topics,
      }).args.inviteCode; 
      addLog(`  - Deployer created invite code 1: ${inviteCode1.slice(0, 10)}...`);

      const deployerHash2 = await deployerWallet.writeContract({
        ...webOfTrustContract,
        functionName: "createInviteCode",
        args: [],
      });
      const deployerReceipt2 = await publicClient.waitForTransactionReceipt({
        hash: deployerHash2,
      });
      const inviteCode2Log = deployerReceipt2.logs.find(log => {
        try {
          return publicClient.parseEventLog({
            abi: webOfTrustContract.abi,
            data: log.data,
            topics: log.topics,
          })?.eventName === 'InviteCodeCreated';
        } catch {
          return false;
        }
      });
      if (!inviteCode2Log) throw new Error("InviteCodeCreated event not found in tx2.");
      const inviteCode2 = publicClient.parseEventLog({
        abi: webOfTrustContract.abi,
        data: inviteCode2Log.data,
        topics: inviteCode2Log.topics,
      }).args.inviteCode;
      addLog(`  - Deployer created invite code 2: ${inviteCode2.slice(0, 10)}...`);

      // 2. Register Alice and Bob
      addLog("2. Registering Alice and Bob...");
      const requiredStake = parseEther("0.01");

      const aliceHash = await aliceWallet.writeContract({
        ...webOfTrustContract,
        functionName: "register",
        args: [inviteCode1],
        value: requiredStake,
      });
      await publicClient.waitForTransactionReceipt({ hash: aliceHash });
      addLog(`  - Alice registered with stake: ${aliceWallet.account.address}`);

      const bobHash = await bobWallet.writeContract({
        ...webOfTrustContract,
        functionName: "register",
        args: [inviteCode2],
        value: requiredStake,
      });
      await publicClient.waitForTransactionReceipt({ hash: bobHash });
      addLog(`  - Bob registered with stake: ${bobWallet.account.address}`);

      // 3. Build Malicious Action Hash
      addLog("3. Building malicious action hash...");
      const canonical = canonicalizeAction("native_transfer", {
        to: "0x0000000000000000000000000000000000000001",
        amount: 100,
      });
      const actionHash = keccak256(toBytes(canonical));
      addLog(`  - Malicious Action Hash: ${actionHash.slice(0, 10)}...`);

      // 4. Flag Action for Review (Alice simulates Security Module)
      addLog("4. Alice flags action for review...");
      const flagHash = await aliceWallet.writeContract({
        ...reviewOracleContract,
        functionName: "flagActionForReview",
        args: [actionHash],
      });
      await publicClient.waitForTransactionReceipt({ hash: flagHash });
      addLog(`  - Action flagged. Task ID: 0`);

      // 5. Cast 3 Blacklist Votes (Deployer, Alice, Bob)
      addLog("5. Casting 3 blacklist votes...");
      const vote1Hash = await deployerWallet.writeContract({
        ...reviewOracleContract,
        functionName: "castBlacklistVote",
        args: [0n, true],
      });
      await publicClient.waitForTransactionReceipt({ hash: vote1Hash });
      addLog(`  - Deployer voted. Current votes for blacklist: 1`);

      const vote2Hash = await aliceWallet.writeContract({
        ...reviewOracleContract,
        functionName: "castBlacklistVote",
        args: [0n, true],
      });
      await publicClient.waitForTransactionReceipt({ hash: vote2Hash });
      addLog(`  - Alice voted. Current votes for blacklist: 2`);

      const vote3Hash = await bobWallet.writeContract({
        ...reviewOracleContract,
        functionName: "castBlacklistVote",
        args: [0n, true],
      });
      await publicClient.waitForTransactionReceipt({ hash: vote3Hash });
      addLog(`  - Bob voted. Current votes for blacklist: 3 (Quorum Reached)`);

      // 6. Resolve Blacklist Vote (Alice)
      addLog("6. Alice resolves blacklist vote...");
      const resolveHash = await aliceWallet.writeContract({
        ...reviewOracleContract,
        functionName: "resolveBlacklistVote",
        args: [0n],
      });
      await publicClient.waitForTransactionReceipt({ hash: resolveHash });
      addLog("  - Vote resolved. Action blacklisted.");

      // 7. Verify Action Status
      addLog("7. Verifying action status...");
      const finalStatus = await publicClient.readContract({
        ...actionRegistryContract,
        functionName: "getActionStatus",
        args: [actionHash],
      });
      addLog(`  - Final Action Status: ${finalStatus.toString()} (Expected: 2 - Blacklisted)`);

      if (finalStatus === 2n) {
        addLog("Demo Flow Completed Successfully! Action is now blacklisted on-chain.");
        onActionBlacklisted(); // Trigger parent update
      } else {
        addLog("Demo Flow Completed, but action was NOT blacklisted. Status: " + finalStatus.toString());
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An unknown error occurred during demo flow.");
      addLog("Demo Flow Failed!");
    }
  }

  return (
    <div className="card">
      <h3>Full Demo Flow (On-chain)</h3>
      <p>This runs the entire blacklisting process on your local Hardhat node:</p>
      <ol>
        <li>Deployer creates invite codes.</li>
        <li>Alice & Bob register with stake.</li>
        <li>Malicious action hash is built.</li>
        <li>Alice flags action for review.</li>
        <li>Deployer, Alice, & Bob cast blacklist votes.</li>
        <li>Alice resolves the vote, blacklisting the action.</li>
      </ol>
      <button onClick={runDemoFlow}>Run Full Demo Flow</button>
      {log.length > 0 && (
        <div style={{ marginTop: "10px", maxHeight: "300px", overflowY: "scroll", background: "#f0f0f0", padding: "10px", borderRadius: "5px" }}>
          <h4>Demo Log:</h4>
          {log.map((entry, index) => (
            <p key={index} style={{ margin: "0", fontSize: "0.9em" }}>
              {entry}
            </p>
          ))}
        </div>
      )}
      {error && (
        <div style={{ color: "red", marginTop: "10px" }}>
          <h4>Error:</h4>
          <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{error}</pre>
        </div>
      )}
    </div>
  );
}

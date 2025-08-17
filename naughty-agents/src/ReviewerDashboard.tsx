import { useState, useMemo, useEffect } from "react";
import { useEvmAddress } from "@coinbase/cdp-hooks";
import { SendTransactionButton, type SendTransactionButtonProps } from "@coinbase/cdp-react/components/SendTransactionButton";
import { createPublicClient, http, encodeFunctionData } from "viem";
import { baseSepolia } from "viem/chains";
import WebOfTrust from "./artifacts/contracts/WebOfTrust.sol/WebOfTrust.json";

// The address of the deployed WebOfTrust contract.
const webOfTrustAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const contractABI = WebOfTrust.abi;

// Public client to read from the contract
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

function ReviewerDashboard() {
  const { evmAddress } = useEvmAddress();
  const [inviteCode, setInviteCode] = useState("");
  const [requiredStake, setRequiredStake] = useState<bigint | undefined>();
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function getStake() {
      try {
        const stake = await publicClient.readContract({
          address: webOfTrustAddress,
          abi: contractABI,
          functionName: "requiredStake",
        });
        setRequiredStake(stake as bigint);
      } catch (e: any) {
        setError("Could not fetch required stake from contract.");
      }
    }
    getStake();
  }, []);

  const transaction = useMemo<SendTransactionButtonProps["transaction"] | undefined>(() => {
    if (!evmAddress || !requiredStake || !inviteCode) {
      return undefined;
    }
    return {
      to: webOfTrustAddress,
      value: requiredStake,
      data: encodeFunctionData({
        abi: contractABI,
        functionName: 'register',
        args: [inviteCode],
      }),
      chainId: 84532, // Base Sepolia
    };
  }, [evmAddress, requiredStake, inviteCode]);

  const handleSuccess: SendTransactionButtonProps["onSuccess"] = (hash) => {
    setStatus(`Transaction sent! Hash: ${hash}`);
    setError("");
  };

  const handleError: SendTransactionButtonProps["onError"] = (err) => {
    setError(err.message);
    setStatus("");
  };

  return (
    <div className="card">
      <h2 className="card-title">Reviewer Dashboard</h2>
      <p>Have an invite code? Stake and register to become a reviewer.</p>
      <div className="form-group">
        <label htmlFor="inviteCode">Invite Code</label>
        <input
          type="text"
          id="inviteCode"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="0x..."
        />
      </div>
      {evmAddress && transaction ? (
        <SendTransactionButton
          account={evmAddress}
          network="base-sepolia"
          transaction={transaction}
          onError={handleError}
          onSuccess={handleSuccess}
        >
          Stake & Register
        </SendTransactionButton>
      ) : (
        <button className="button" disabled>
          Enter Invite Code
        </button>
      )}
      {status && <p className="status">{status}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default ReviewerDashboard;

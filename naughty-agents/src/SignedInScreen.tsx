import { useEvmAddress, useIsSignedIn } from "@coinbase/cdp-hooks";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPublicClient, http, formatEther } from "viem";
import { baseSepolia } from "viem/chains";

import Header from "./Header";
import Transaction from "./Transaction";
import UserBalance from "./UserBalance";
import UserDashboard from "./UserDashboard";
import ReviewerDashboard from "./ReviewerDashboard";

/**
 * Create a viem client to access user's balance on the Base Sepolia network
 */
const client = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

/**
 * The Signed In screen
 */
function SignedInScreen() {
  const { isSignedIn } = useIsSignedIn();
  const { evmAddress } = useEvmAddress();
  const [balance, setBalance] = useState<bigint | undefined>(undefined);
  const [viewMode, setViewMode] = useState<'user' | 'reviewer'>('user');

  const formattedBalance = useMemo(() => {
    if (balance === undefined) return undefined;
    return formatEther(balance);
  }, [balance]);

  const getBalance = useCallback(async () => {
    if (!evmAddress) return;
    const balance = await client.getBalance({
      address: evmAddress,
    });
    setBalance(balance);
  }, [evmAddress]);

  useEffect(() => {
    getBalance();
    const interval = setInterval(getBalance, 500);
    return () => clearInterval(interval);
  }, [getBalance]);

  return (
    <>
      <Header />
      <main className="main flex-col-container flex-grow">
        <div className="main-inner flex-col-container">
          <div className="card card--user-balance">
            <UserBalance balance={formattedBalance} />
          </div>

          <div className="view-toggle button-group">
            <button className={`button ${viewMode === 'user' ? 'active' : ''}`} onClick={() => setViewMode('user')}>User View</button>
            <button className={`button ${viewMode === 'reviewer' ? 'active' : ''}`} onClick={() => setViewMode('reviewer')}>Reviewer View</button>
          </div>

          {viewMode === 'user' && <UserDashboard />}
          {viewMode === 'reviewer' && <ReviewerDashboard />}

          <div className="card card--transaction">
            {isSignedIn && evmAddress && (
              <Transaction balance={formattedBalance} onSuccess={getBalance} />
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default SignedInScreen;

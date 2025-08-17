import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const NaughtyAgentsModule = buildModule("NaughtyAgentsModule", (m) => {
  const requiredStake = m.getParameter("requiredStake", 10n ** 15n); // 0.001 ETH

  const webOfTrust = m.contract("WebOfTrust", [requiredStake]);
  const actionRegistry = m.contract("ActionRegistry", []);
  const reviewOracle = m.contract("ReviewOracle", [webOfTrust, actionRegistry]);

  // Set ReviewOracle on ActionRegistry (one-time)
  m.call(actionRegistry, "setReviewOracleAddress", [reviewOracle]);

  const securityModule = m.contract("NaughtyAgentsSecurityModule", [actionRegistry, reviewOracle]);

  return { webOfTrust, actionRegistry, reviewOracle, securityModule };
});

export default NaughtyAgentsModule;


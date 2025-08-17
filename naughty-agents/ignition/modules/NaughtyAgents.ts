import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const NaughtyAgentsModule = buildModule("NaughtyAgentsModule", (m) => {
  const requiredStake = m.getParameter("requiredStake", parseEther("0.01"));

  const webOfTrust = m.contract("WebOfTrust", [requiredStake]);
  const actionRegistry = m.contract("ActionRegistry", []);
  const reviewOracle = m.contract("ReviewOracle", [webOfTrust, actionRegistry]);

  // After deploying, we need to link the ActionRegistry to the ReviewOracle
  m.call(actionRegistry, "setReviewOracleAddress", [reviewOracle]);

  return { webOfTrust, actionRegistry, reviewOracle };
});

export default NaughtyAgentsModule;

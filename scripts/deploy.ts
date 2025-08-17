import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // 1) Deploy ActionRegistry
  const ActionRegistry = await ethers.getContractFactory("ActionRegistry");
  const actionRegistry = await ActionRegistry.deploy();
  await actionRegistry.waitForDeployment();
  const actionRegistryAddr = await actionRegistry.getAddress();
  console.log("ActionRegistry:", actionRegistryAddr);

  // 2) Deploy WebOfTrust (example requiredStake: 0.01 ether)
  const WebOfTrust = await ethers.getContractFactory("WebOfTrust");
  const webOfTrust = await WebOfTrust.deploy(ethers.parseEther("0.01"));
  await webOfTrust.waitForDeployment();
  const webOfTrustAddr = await webOfTrust.getAddress();
  console.log("WebOfTrust:", webOfTrustAddr);

  // 3) Deploy ReviewOracle wiring WOT + Registry
  const ReviewOracle = await ethers.getContractFactory("ReviewOracle");
  const reviewOracle = await ReviewOracle.deploy(webOfTrustAddr, actionRegistryAddr);
  await reviewOracle.waitForDeployment();
  const reviewOracleAddr = await reviewOracle.getAddress();
  console.log("ReviewOracle:", reviewOracleAddr);

  // 4) Link ActionRegistry to ReviewOracle (one-time)
  const tx = await actionRegistry.setReviewOracleAddress(reviewOracleAddr);
  await tx.wait();
  console.log("ActionRegistry linked to ReviewOracle");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});



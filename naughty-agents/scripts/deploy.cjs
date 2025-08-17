const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const ActionRegistry = await ethers.getContractFactory("ActionRegistry");
  const actionRegistry = await ActionRegistry.deploy();
  await actionRegistry.waitForDeployment();
  const actionRegistryAddr = await actionRegistry.getAddress();
  console.log("ActionRegistry:", actionRegistryAddr);

  const WebOfTrust = await ethers.getContractFactory("WebOfTrust");
  const webOfTrust = await WebOfTrust.deploy(ethers.parseEther("0.01"));
  await webOfTrust.waitForDeployment();
  const webOfTrustAddr = await webOfTrust.getAddress();
  console.log("WebOfTrust:", webOfTrustAddr);

  const ReviewOracle = await ethers.getContractFactory("ReviewOracle");
  const reviewOracle = await ReviewOracle.deploy(webOfTrustAddr, actionRegistryAddr);
  await reviewOracle.waitForDeployment();
  const reviewOracleAddr = await reviewOracle.getAddress();
  console.log("ReviewOracle:", reviewOracleAddr);

  const tx = await actionRegistry.setReviewOracleAddress(reviewOracleAddr);
  await tx.wait();
  console.log("ActionRegistry linked to ReviewOracle");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

---
description: A tutorial for deploying a smart contract on Zircuit
---

# Deploy on Zircuit

## Overview

Deploying your first contract on Zircuit is easy! This tutorial will show you how.

If you already have an existing development environment for Ethereum, this will be fast and probably take only 10-15 minutes.

We have even provided you a boilerplate project to make this process even simpler!

### Walkthrough

#### 1. Set Up Hardhat

- Create the folder for your new project and navigate within

```bash
mkdir my-zircuit-coin
cd my-zircuit-coin
```
- Install Hardhat using npm (Node Package Manager):

```bash
npm install --save-dev hardhat
```
- Install the hardhat toolbox for a later step

```bash
npm i @nomicfoundation/hardhat-toolbox
```
- Initialize a new Hardhat project:

```bash
npx hardhat
```

#### 2. Write Your Smart Contract

Place this file in `contracts/Token.sol` inside of your hardhat project.

```solidity
// WARNING: 
// THIS CODE IS SIMPLIFIED AND WAS CREATED FOR TESTING 
// PURPOSES ONLY. DO NOT USE THIS CODE IN PRODUCTION!
pragma solidity 0.8.19;

contract Token {
    string public name = "Name Goes here";
    string public symbol = "TICKER";

    // The fixed amount of tokens, stored in an unsigned integer type variable.
    uint256 public totalSupply = 21000000;

    // An address type variable is used to store ethereum accounts.
    address public owner;

    // A mapping is a key/value map. Here we store each account's balance.
    mapping(address => uint256) balances;

    // The Transfer event helps off-chain applications understand
    // what happens within your contract.
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    constructor() {
        balances[msg.sender] = totalSupply;
        owner = msg.sender;
    }

    function transfer(address to, uint256 amount) external {
        require(balances[msg.sender] >= amount, "Not enough tokens");

        // Transfer the amount.
        balances[msg.sender] -= amount;
        balances[to] += amount;

        // Notify off-chain applications of the transfer.
        emit Transfer(msg.sender, to, amount);
    }

    function balanceOf(address account) external view returns (uint256) {
        return balances[account];
    }
}
```

All you need to do now to customize your token is replace the following section of the `Token.sol` file:

```solidity
string public name = "Name Goes Here";
string public symbol = "TICKER";

// The fixed amount of tokens, stored in an unsigned integer type variable.
uint256 public totalSupply = 21000000;
```

These values are just filler, so put in a fun name for your token, a ticker and adjust the supply as you see fit!

#### 3. Set Up Your Network and Solidity Compiler Configuration

Edit your `hardhat.config.ts`/`hardhat.config.js` to define the Zircuit network.

```ts
import { HardhatUserConfig, configVariable } from "hardhat/config";
import hardhatToolboxViem from "@nomicfoundation/hardhat-toolbox-viem";

const config: HardhatUserConfig = {
  solidity: "0.8.24",
  plugins: [hardhatToolboxViem],
  networks: {
    zircuit: {
      type: "http",
      chainType: "l1",
      url: configVariable("ZIRCUIT_RPC_URL", "https://zircuit1-mainnet.p2pify.com/"),
      accounts: [configVariable("ZIRCUIT_PRIVATE_KEY")],
    },
  },
};
export default config;
```

Set `ZIRCUIT_PRIVATE_KEY` and optionally `ZIRCUIT_RPC_URL` in your Hardhat keystore or environment.

#### 4. Compile Your Smart Contract

```bash
npx hardhat compile
```

#### 5. Write A Deployment Script

Create `scripts/deploy.ts` (or `.js`).

```ts
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  const TokenFactory = await ethers.getContractFactory("Token");
  const token = await TokenFactory.deploy();
  await token.waitForDeployment();
  console.log("Token deployed to:", await token.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

#### 6. Deploy Your Smart Contract

```bash
npx hardhat run scripts/deploy.ts --network zircuit
```

#### 7. Verify and Interact with Your Contract

- Use Hardhat console or scripts to interact with your contract
- Verify your smart contract via the Zircuit [block explorer](https://explorer.zircuit.com)

### Conclusion

Congratulations! You've successfully launched your first contract on Zircuit.

import { ethers, upgrades, network, deployments } from "hardhat";
import {
  DEV_CHAINS,
  NATIVE_TOKEN_WRAPPERS,
  MARKETPLACE_ADDRESS,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} from "../helper-config";
import { verify } from "../helper-functions";

async function main() {
  const isDev = DEV_CHAINS.includes(network.name);
  const waitConfirmations = isDev ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS;

  let constructorArgs;
  if (isDev) {
    // get mock contract address
    const weth = await deployments.get("WETH");
    constructorArgs = [weth.address];
  } else {
    // set external contract address
    constructorArgs = [NATIVE_TOKEN_WRAPPERS[network.name]];
  }

  const marketplaceAddress = MARKETPLACE_ADDRESS[network.name];
  if (!marketplaceAddress) {
    console.error("No deployed marketplace proxy address on the network");
  }

  const MarketplaceV2 = await ethers.getContractFactory("Marketplace");
  const marketplacev2 = await upgrades.deployImplementation(MarketplaceV2, {
    kind: "uups",
    constructorArgs,
    unsafeAllow: ["constructor", "state-variable-immutable", "delegatecall"],
  });

  // Verify the deployment
  if (!isDev) {
    setTimeout(console.log, waitConfirmations * 1000);

    console.log("Verifying...");
    await verify(marketplacev2.toString(), constructorArgs);
  }

  await upgrades.upgradeProxy(marketplaceAddress, MarketplaceV2, {
    kind: "uups",
    constructorArgs,
    unsafeAllow: ["constructor", "state-variable-immutable", "delegatecall"],
    useDeployedImplementation: true,
  });
  console.log("Marketplace upgraded");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

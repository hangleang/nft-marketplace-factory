import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

import {
  DEV_CHAINS,
  NATIVE_TOKEN_WRAPPERS,
  TRUST_FORWARDERS,
  VERIFICATION_BLOCK_CONFIRMATIONS,
} from "../helper-config";
import { verify } from "../helper-functions";

const func: DeployFunction = async ({ getNamedAccounts, deployments, network, upgrades }) => {
  const { log } = deployments;
  const { deployer, _feeCollector } = await getNamedAccounts();
  const isDev = DEV_CHAINS.includes(network.name);
  const waitConfirmations = isDev ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS;

  let constructorArgs: string[];
  let args: unknown[] = [
    deployer, // admin address
    "", // contract URI
  ];
  if (isDev) {
    // get mock contract address
    const weth = await deployments.get("WETH");
    const minimalForwarder = await deployments.get("MinimalForwarderMock");
    constructorArgs = [weth.address];
    args = [
      ...args,
      [minimalForwarder.address], // newly deployed trust forwarder address
    ];
  } else {
    // set external contract address
    constructorArgs = [NATIVE_TOKEN_WRAPPERS[network.name]];
    args = [
      ...args,
      [TRUST_FORWARDERS[network.name]], // existing trust forwarder by given network
    ];
  }

  args = [
    ...args,
    deployer, // fee recipient address
    500, // platform fees percentage 500 == %5.0
  ];

  // the following will only deploy "Greeter" if the contract was never deployed or if the code changed since last deployment
  // const args = ["Hello, World!"];
  const marketplaceFactory = await ethers.getContractFactory("Marketplace");
  const marketplace = await upgrades.deployProxy(marketplaceFactory, args, {
    kind: "uups",
    initializer: "initialize",
    constructorArgs,
    unsafeAllow: ["constructor", "state-variable-immutable", "delegatecall"],
  });
  await marketplace.deployed();

  log("Marketplace proxy contract deployed at:", marketplace.address);

  // Verify the deployment
  if (!isDev) {
    setTimeout(console.log, waitConfirmations * 1000);

    log("Verifying...");
    await verify(marketplace.address, constructorArgs);
  }
};

export default func;
func.tags = ["all", "Marketplace", "NFT_Marketplace"];
func.dependencies = ["mocks"]; // this contains dependencies tags need to execute before deploy this contract

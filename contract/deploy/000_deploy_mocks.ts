import { DeployFunction } from "hardhat-deploy/types";

import { DEV_CHAINS } from "../helper-config";

const func: DeployFunction = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const isDev = DEV_CHAINS.includes(network.name);

  if (isDev) {
    // deploy mocks/test contract
    await deploy("WETH", {
      from: deployer,
      log: true,
      autoMine: true,
    });
    await deploy("ERC20Mock", {
      from: deployer,
      log: true,
      autoMine: true,
    });
    await deploy("MinimalForwarderMock", {
      from: deployer,
      log: true,
      autoMine: true,
    });
    log("Mocks Deployed!");
    log("----------------------------------------------------");
    log("You are deploying to a local network, you'll need a local network running to interact");
    log("Please run `yarn hardhat console` to interact with the deployed smart contracts!");
    log("----------------------------------------------------");
  }
};

export default func;
func.tags = ["all", "mocks"];
func.dependencies = []; // this contains dependencies tags need to execute before deploy this contract

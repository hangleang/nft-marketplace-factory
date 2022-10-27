import { DeployFunction } from "hardhat-deploy/types";

import { DEV_CHAINS } from "../helper-config";

const func: DeployFunction = async ({ getNamedAccounts, deployments, ethers, network }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const [_platformOwner, _feeCollector, artist] = await ethers.getSigners();
  const isDev = DEV_CHAINS.includes(network.name);

  if (isDev) {
    // deploy tests contract
    await deploy("ERC20Test", {
      from: deployer,
      log: true,
      autoMine: true,
    });
    await deploy("ERC721Test", {
      from: artist.address,
      log: true,
      autoMine: true,
    });
    log("Tests Deployed!");
    log("----------------------------------------------------");
    log("You are deploying to a local network, you'll need a local network running to interact");
    log("Please run `yarn hardhat console` to interact with the deployed smart contracts!");
    log("----------------------------------------------------");
  }
};

export default func;
func.tags = ["all", "tests"];
func.dependencies = []; // this contains dependencies tags need to execute before deploy this contract

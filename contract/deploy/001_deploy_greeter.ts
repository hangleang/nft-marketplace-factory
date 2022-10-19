import { DeployFunction } from "hardhat-deploy/types";

import { DEV_CHAINS, VERIFICATION_BLOCK_CONFIRMATIONS } from "../helper-config";
import { verify } from "../helper-functions";

const func: DeployFunction = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const isDev = DEV_CHAINS.includes(network.name);
  const waitConfirmations = isDev ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS;

  if (isDev) {
    // deploy mocks/test contract
  } else {
    // set external contract address
  }

  // the following will only deploy "Greeter" if the contract was never deployed or if the code changed since last deployment
  const args = ["Hello, World!"];
  const greeter = await deploy("Greeter", {
    from: deployer,
    args,
    log: true,
    autoMine: isDev,
    waitConfirmations,
  });

  // Verify the deployment
  if (!isDev) {
    log("Verifying...");
    await verify(greeter.address, args);
  }
};

export default func;
func.tags = ["all", "Greeter"];
func.dependencies = []; // this contains dependencies tags need to execute before deploy this contract

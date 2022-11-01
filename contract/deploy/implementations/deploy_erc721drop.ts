import { DeployFunction } from "hardhat-deploy/types";

import { DEV_CHAINS, VERIFICATION_BLOCK_CONFIRMATIONS } from "../../helper-config";
import { verify } from "../../helper-functions";

const func: DeployFunction = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const isDev = DEV_CHAINS.includes(network.name);
  const waitConfirmations = isDev ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS;

  // the following will only deploy "ERC721Drop" if the contract was never deployed or if the code changed since last deployment
  const erc721Drop = await deploy("ERC721Drop", {
    from: deployer,
    log: true,
    autoMine: isDev,
    waitConfirmations,
  });

  // Verify the deployment
  if (!isDev) {
    log("Verifying...");
    await verify(erc721Drop.address, []);
  }
};

export default func;
func.tags = ["all", "Impls", "ERC721Drop"];
func.dependencies = []; // this contains dependencies tags need to execute before deploy this contract

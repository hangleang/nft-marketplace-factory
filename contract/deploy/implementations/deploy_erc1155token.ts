import { DeployFunction } from "hardhat-deploy/types";

import { DEV_CHAINS, VERIFICATION_BLOCK_CONFIRMATIONS } from "../../helper-config";
import { verify } from "../../helper-functions";

const func: DeployFunction = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const isDev = DEV_CHAINS.includes(network.name);
  const waitConfirmations = isDev ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS;

  // the following will only deploy "ERC1155Token" if the contract was never deployed or if the code changed since last deployment
  const erc1155Token = await deploy("ERC1155Token", {
    from: deployer,
    log: true,
    autoMine: isDev,
    waitConfirmations,
  });

  // Verify the deployment
  if (!isDev) {
    log("Verifying...");
    await verify(erc1155Token.address, []);
  }
};

export default func;
func.tags = ["all", "Impls", "ERC1155Token"];
func.dependencies = []; // this contains dependencies tags need to execute before deploy this contract

import { DeployFunction } from "hardhat-deploy/types";

import { DEV_CHAINS, TRUST_FORWARDERS, VERIFICATION_BLOCK_CONFIRMATIONS } from "../helper-config";
import { verify } from "../helper-functions";

const func: DeployFunction = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const isDev = DEV_CHAINS.includes(network.name);
  const waitConfirmations = isDev ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS;

  let forwarderAddress: string;
  if (isDev) {
    // get mock contract address
    const minimalForwarder = await deployments.get("MinimalForwarderMock");
    forwarderAddress = minimalForwarder.address;
  } else {
    // set external contract address
    forwarderAddress = TRUST_FORWARDERS[network.name];
  }

  const args = [forwarderAddress];

  // the following will only deploy "ContractRegistry" if the contract was never deployed or if the code changed since last deployment
  const registry = await deploy("ContractRegistry", {
    from: deployer,
    args,
    log: true,
    autoMine: isDev,
    waitConfirmations,
  });

  // Verify the deployment
  if (!isDev) {
    log("Verifying...");
    await verify(registry.address, args);
  }
};

export default func;
func.tags = ["all", "ContractRegistry", "NFT_Marketplace"];
func.dependencies = ["mocks"]; // this contains dependencies tags need to execute before deploy this contract

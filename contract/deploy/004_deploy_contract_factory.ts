import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

import { DEV_CHAINS, TRUST_FORWARDERS, VERIFICATION_BLOCK_CONFIRMATIONS } from "../helper-config";
import { verify } from "../helper-functions";
import { ContractRegistry } from "../types";

const func: DeployFunction = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const isDev = DEV_CHAINS.includes(network.name);
  const waitConfirmations = isDev ? 1 : VERIFICATION_BLOCK_CONFIRMATIONS;

  let args: unknown[];
  if (isDev) {
    // get mock contract address
    const minimalForwarder = await deployments.get("MinimalForwarderMock");
    args = [minimalForwarder.address];
  } else {
    // set external contract address
    args = [TRUST_FORWARDERS[network.name]];
  }

  const registry: ContractRegistry = await ethers.getContract("ContractRegistry");
  args = [...args, registry.address];

  // const isRegistryAdmin: boolean = await registry.hasRole(
  //   ethers.utils.solidityKeccak256(["string"], ["DEFAULT_ADMIN_ROLE"]),
  //   deployer,
  // );
  // if (!isRegistryAdmin) {
  //   throw new Error("Caller is not registry admin");
  // }

  // the following will only deploy "ContractFactory" if the contract was never deployed or if the code changed since last deployment
  const factory = await deploy("ContractFactory", {
    from: deployer,
    args,
    log: true,
    autoMine: isDev,
    waitConfirmations,
  });

  const grantRoleTx = await registry.grantRole(
    ethers.utils.solidityKeccak256(["string"], ["REGISTRAR_ROLE"]),
    factory.address,
  );
  console.log("Granting REGISTRAR_ROLE to factory on registry at tx: ", grantRoleTx.hash);
  await grantRoleTx.wait();

  // Verify the deployment
  if (!isDev) {
    log("Verifying...");
    await verify(factory.address, args);
  }
};

export default func;
func.tags = ["all", "ContractFactory", "NFT_Marketplace"];
func.dependencies = ["mocks", "ContractRegistry"]; // this contains dependencies tags need to execute before deploy this contract

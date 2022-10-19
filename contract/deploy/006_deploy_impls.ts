import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

import { DEV_CHAINS } from "../helper-config";
import { verify } from "../helper-functions";
import { ContractFactory } from "../types";

const func: DeployFunction = async ({ getNamedAccounts, deployments, network }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const isDev = DEV_CHAINS.includes(network.name);

  const factoryAddress = (await deployments.get("ContractFactory")).address;
  const factory: ContractFactory = await ethers.getContractAt("ContractFactory", factoryAddress);

  // the following will only deploy all "Implementation" contracts if the contract was never deployed or if the code changed since last deployment
  const erc721Token = await deploy("ERC721Token", {
    from: deployer,
    log: true,
    autoMine: isDev,
  });
  const erc1155Token = await deploy("ERC1155Token", {
    from: deployer,
    log: true,
    autoMine: isDev,
  });
  const erc721Drop = await deploy("ERC721Drop", {
    from: deployer,
    log: true,
    autoMine: isDev,
  });
  const erc1155Drop = await deploy("ERC1155Drop", {
    from: deployer,
    log: true,
    autoMine: isDev,
  });

  // then, add all the deployed implementations in factory contract
  const multicallTxn = await factory.multicall(
    [
      factory.interface.encodeFunctionData("addImplementation", [erc721Token.address]),
      factory.interface.encodeFunctionData("addImplementation", [erc1155Token.address]),
      factory.interface.encodeFunctionData("addImplementation", [erc721Drop.address]),
      factory.interface.encodeFunctionData("addImplementation", [erc1155Drop.address]),
    ],
    {
      from: deployer,
      gasLimit: 5_000_000,
    },
  );
  console.log("Adding implementations at tx: ", multicallTxn.hash);
  await multicallTxn.wait();

  // Verify the deployment
  if (!isDev) {
    log("Verifying...");
    await verify(erc721Token.address, []);
    await verify(erc1155Token.address, []);
    await verify(erc721Drop.address, []);
    await verify(erc1155Drop.address, []);
  }
};

export default func;
func.tags = ["all", "Impls", "NFT_Marketplace"];
func.dependencies = ["mocks", "ContractFactory"]; // this contains dependencies tags need to execute before deploy this contract

import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/types";

import { ContractFactory } from "../types";

const func: DeployFunction = async ({ getNamedAccounts, deployments }) => {
  const { log } = deployments;
  const { deployer } = await getNamedAccounts();

  const factoryAddress = (await deployments.get("ContractFactory")).address;
  const factory: ContractFactory = await ethers.getContractAt("ContractFactory", factoryAddress);

  const erc721TokenAddress = (await deployments.get("ERC721Token")).address;
  const erc721DropAddress = (await deployments.get("ERC721Drop")).address;
  const erc1155TokenAddress = (await deployments.get("ERC1155Token")).address;
  const erc1155DropAddress = (await deployments.get("ERC1155Drop")).address;

  // then, add all the deployed implementations in factory contract
  const multicallTxn = await factory.multicall(
    [
      factory.interface.encodeFunctionData("addImplementation", [erc721TokenAddress]),
      factory.interface.encodeFunctionData("addImplementation", [erc1155TokenAddress]),
      factory.interface.encodeFunctionData("addImplementation", [erc721DropAddress]),
      factory.interface.encodeFunctionData("addImplementation", [erc1155DropAddress]),
    ],
    {
      from: deployer,
      gasLimit: 5_000_000,
    },
  );
  log("Adding implementations at tx: ", multicallTxn.hash);
  await multicallTxn.wait();
};

export default func;
func.tags = ["all", "AddImpls", "NFT_Marketplace"];
func.dependencies = ["mocks", "ContractFactory", "Impls"]; // this contains dependencies tags need to execute before deploy this contract

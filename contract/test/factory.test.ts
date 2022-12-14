import { expect } from "chai";
import { deployments, ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ContractFactory, ContractRegistry, ERC721Token, Greeter } from "../types";
const { utils } = ethers;

const ERC721TOKEN_TYPE: string = utils.formatBytes32String("ERC721Token");

describe("Factory", () => {
  let platformOwner: SignerWithAddress;
  let creator: SignerWithAddress;
  let saleRecipient: SignerWithAddress;
  let royaltyRecipient: SignerWithAddress;
  let factory: ContractFactory;
  let rigistry: ContractRegistry;
  let erc721TokenImpl: ERC721Token;
  let encodedInitData: string;

  before(async () => {
    [platformOwner, creator, saleRecipient, royaltyRecipient] = await ethers.getSigners();
    await deployments.fixture(["ContractFactory", "AddImpls"]);
    rigistry = await ethers.getContractAt("ContractRegistry", (await deployments.get("ContractRegistry")).address);
    factory = await ethers.getContractAt("ContractFactory", (await deployments.get("ContractFactory")).address);
    erc721TokenImpl = await ethers.getContractAt("ERC721Token", (await deployments.get("ERC721Token")).address);

    const initParams: unknown[] = [
      creator.address,
      "Demo NFT Token",
      "DNF",
      "contractURI",
      [],
      saleRecipient.address,
      royaltyRecipient.address,
      500, // 5% of royalty
      500, // 5% of platformFee
      platformOwner.address,
    ];
    encodedInitData = (await ethers.getContractFactory("ERC721Token")).interface.encodeFunctionData(
      "initialize",
      initParams,
    );
  });

  it("check implementation in factory contract", async () => {
    const implAddress = await factory.getLatestImplementation(ERC721TOKEN_TYPE);
    expect(implAddress).to.equal(erc721TokenImpl.address);
  });

  it("should run deployProxy success with given contract type", async () => {
    const deployTxn = factory.connect(creator).deployProxy(ERC721TOKEN_TYPE, encodedInitData);
    await expect(deployTxn).to.emit(factory, "ProxyDeployed").to.emit(rigistry, "Added");
  });

  it("should run deployProxyDeterministic success with given params", async () => {
    const salt = ethers.utils.formatBytes32String((await rigistry.count(creator.address)).toString());
    const deployTxn = factory.connect(creator).deployProxyDeterministic(ERC721TOKEN_TYPE, encodedInitData, salt);
    await expect(deployTxn).to.emit(factory, "ProxyDeployed").to.emit(rigistry, "Added");
  });

  it("should run deployProxyByImplementation success with given params", async () => {
    const salt = ethers.utils.formatBytes32String((await rigistry.count(creator.address)).toString());
    const deployTxn = factory
      .connect(creator)
      .deployProxyByImplementation(erc721TokenImpl.address, ERC721TOKEN_TYPE, encodedInitData, salt);
    await expect(deployTxn).to.emit(factory, "ProxyDeployed").to.emit(rigistry, "Added");
  });

  describe("Factory: attempt to add incompatible implementation", async () => {
    let greeter: Greeter;

    before(async () => {
      await deployments.fixture("Greeter");
      greeter = await ethers.getContractAt("Greeter", (await deployments.get("Greeter")).address);
    });

    it("should not able to add new implementation if it is not compatible", async () => {
      await expect(factory.connect(platformOwner).addImplementation(greeter.address)).to.revertedWithoutReason();
    });

    // it("should not able to add the existing implementation", async () => {
    //   await expect(factory.connect(platformOwner).addImplementation(erc721TokenImpl.address)).to.revertedWith(
    //     "!VERSION",
    //   );
    // });
  });
});

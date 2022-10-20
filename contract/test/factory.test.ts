import { expect } from "chai";
import { deployments, ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ContractFactory, ContractRegistry, ERC721Token, Greeter } from "../types";
import { Contract } from "ethers";
const { utils } = ethers;

const ERC721TOKEN_HASH: string = utils.formatBytes32String("ERC721Token");
const MARKETPLACE_HASH: string = utils.formatBytes32String("Marketplace");

describe("Factory testcase", () => {
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
    await deployments.fixture(["ContractFactory", "Impls"]);
    rigistry = await ethers.getContract("ContractRegistry");
    factory = await ethers.getContract("ContractFactory");
    erc721TokenImpl = await ethers.getContract("ERC721Token");

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
    const implAddress = await factory.getLatestImplementation(ERC721TOKEN_HASH);
    expect(implAddress).to.equal(erc721TokenImpl.address);
  });

  it("should run deployProxy success with given contract type", async () => {
    const deployTxn = factory.connect(creator).deployProxy(ERC721TOKEN_HASH, encodedInitData);
    await expect(deployTxn).to.emit(factory, "ProxyDeployed").to.emit(rigistry, "Added");
  });

  it("should run deployProxyDeterministic success with given params", async () => {
    const salt = ethers.utils.formatBytes32String((await rigistry.count(creator.address)).toString());
    const deployTxn = factory.connect(creator).deployProxyDeterministic(ERC721TOKEN_HASH, encodedInitData, salt);
    await expect(deployTxn).to.emit(factory, "ProxyDeployed").to.emit(rigistry, "Added");
  });

  it("should run deployProxyByImplementation success with given params", async () => {
    const salt = ethers.utils.formatBytes32String((await rigistry.count(creator.address)).toString());
    const deployTxn = factory
      .connect(creator)
      .deployProxyByImplementation(erc721TokenImpl.address, encodedInitData, salt);
    await expect(deployTxn).to.emit(factory, "ProxyDeployed").to.emit(rigistry, "Added");
  });

  describe("Factory: add marketplace implementation", async () => {
    let marketplace: Contract;

    before(async () => {
      // await deployments.fixture("mocks");
      const weth = await deployments.get("WETH");
      marketplace = await ethers
        .getContractFactory("Marketplace")
        .then(f => f.connect(platformOwner).deploy(weth.address));
    });

    it("should able to add new implementation with compatible contract", async () => {
      const version = await marketplace.contractVersion();

      await expect(factory.connect(platformOwner).addImplementation(marketplace.address))
        .to.emit(factory, "ImplementationAdded")
        .withArgs(marketplace.address, MARKETPLACE_HASH, version);
    });

    it("should not able to add or approve new implemetation if signer is not the admin or FACTORY_ROLE", async () => {
      await expect(factory.connect(creator).addImplementation(marketplace.address)).to.revertedWith("!ACCESS");
      await expect(factory.connect(creator).approveImplementation(marketplace.address, true)).to.revertedWith(
        "!ACCESS",
      );
    });
  });

  describe("Factory: attempt to add incompatible implementation", async () => {
    let greeter: Greeter;

    before(async () => {
      await deployments.fixture("Greeter");
      greeter = await ethers.getContract("Greeter");
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

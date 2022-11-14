import { expect } from "chai";
import { deployments, ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TypedDataDomain, TypedDataField } from "ethers";
import { mine } from "@nomicfoundation/hardhat-network-helpers";

import { ERC721Token, IERC721Token, ERC20Test } from "../../types";
import ERC721TOKEN_ABI from "../../artifacts/contracts/tokens/ERC721Token.sol/ERC721Token.json";
import { formatTypedDataField } from "../utils";
const { utils } = ethers;

// CONTRACT METADATA
const CONTRACT_NAME: string = "ERC721Token";
const CONTRACT_TYPE: string = utils.formatBytes32String(CONTRACT_NAME);
const CONTRACT_VERSION: number = 1;
const NATIVE_TOKEN: string = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// TOKEN
const NAME: string = "Test NFT Token";
const SYMBOL: string = "TNT";
const URI: string = "ipfs://random-string";

// FEE
const ONE_BPS: number = 100; // 1% in BPS unit
const ZERO_FEE: number = ONE_BPS * 0;
const PLATFORM_FEE: number = ONE_BPS * 5; // 5% of platformFee
const ROYALTY_FEE: number = ONE_BPS * 5; // 5% of royalty
const MAX_BPS: number = ONE_BPS * 100; // 100% = MAX_BPS

// ROLES
const ADMIN_ROLE: string = ethers.constants.HashZero;
const TRANSFER_ROLE: string = utils.keccak256(utils.toUtf8Bytes("TRANSFER_ROLE"));
const MINTER_ROLE: string = utils.keccak256(utils.toUtf8Bytes("MINTER_ROLE"));
const ADDRRESS_ZERO: string = ethers.constants.AddressZero;

describe("ERC721Token", async () => {
  let platformOwner: SignerWithAddress;
  let creator: SignerWithAddress;
  let saleRecipient: SignerWithAddress;
  let royaltyRecipient: SignerWithAddress;
  let recipient: SignerWithAddress;
  let operator: SignerWithAddress;
  let erc721Token: ERC721Token;

  before(async () => {
    [platformOwner, creator, saleRecipient, royaltyRecipient, recipient, operator] = await ethers.getSigners();
    await deployments.fixture(["ContractFactory", "AddImpls"]);
    const factory = await ethers.getContractAt("ContractFactory", (await deployments.get("ContractFactory")).address);

    const initParams: unknown[] = [
      creator.address,
      NAME,
      SYMBOL,
      URI,
      [], // trust fowarders for meta-tx
      saleRecipient.address,
      royaltyRecipient.address,
      ROYALTY_FEE,
      PLATFORM_FEE,
      platformOwner.address,
    ];
    const encodedInitData: string = (await ethers.getContractFactory("ERC721Token")).interface.encodeFunctionData(
      "initialize",
      initParams,
    );
    const receipt = await (await factory.connect(creator).deployProxy(CONTRACT_TYPE, encodedInitData)).wait();
    const proxyDeployedEvent = receipt.events?.find(x => x.event == "ProxyDeployed");
    const proxyAddress = proxyDeployedEvent?.args?.proxy;
    erc721Token = await ethers.getContractAt("ERC721Token", proxyAddress);
  });

  it("checking....", async () => {
    expect(await erc721Token.contractType()).to.eq(CONTRACT_TYPE);
    expect(await erc721Token.contractVersion()).to.eq(CONTRACT_VERSION);
    expect(await erc721Token.contractURI()).to.eq(URI);
    expect(await erc721Token.name()).to.eq(NAME);
    expect(await erc721Token.symbol()).to.eq(SYMBOL);
    expect(await erc721Token.primarySaleRecipient()).to.eq(saleRecipient.address);
    const platformInfo = await erc721Token.getPlatformFeeInfo();
    expect(platformInfo[0]).to.eq(platformOwner.address);
    expect(platformInfo[1]).to.eq(PLATFORM_FEE);
    const royaltyInfo = await erc721Token.getDefaultRoyaltyInfo();
    expect(royaltyInfo[0]).to.eq(royaltyRecipient.address);
    expect(royaltyInfo[1]).to.eq(ROYALTY_FEE);
    // expect(await erc721Token.getDefaultRoyaltyInfo()).to.eq([royaltyRecipient.address, ROYALTY_FEE]);

    // CHECK ACCESS CONTROL
    expect(await erc721Token.hasRole(ADMIN_ROLE, creator.address)).to.true;
    expect(await erc721Token.hasRole(MINTER_ROLE, creator.address)).to.true;
    expect(await erc721Token.hasRole(TRANSFER_ROLE, ADDRRESS_ZERO)).to.true;
  });

  describe("ERC721Token: minting", async () => {
    it("should be able to mint a token with MINTER_ROLE", async () => {
      // get init states
      const expectTokenID = await erc721Token.nextTokenIdToMint();
      const totalSupply = await erc721Token.totalSupply();
      const recipientBalance = await erc721Token.balanceOf(recipient.address);

      // mintTo recipient with ADMIN privillage
      await expect(erc721Token.connect(creator).mintTo(recipient.address, URI))
        .to.emit(erc721Token, "TokensMinted")
        .withArgs(recipient.address, expectTokenID, URI);

      expect(await erc721Token.tokenURI(expectTokenID)).to.eq(URI);
      expect(await erc721Token.nextTokenIdToMint()).to.eq(expectTokenID.add(1));
      expect(await erc721Token.totalSupply()).to.eq(totalSupply.add(1));
      expect(await erc721Token.balanceOf(recipient.address)).to.eq(recipientBalance.add(1));
      expect(await erc721Token.ownerOf(expectTokenID)).to.eq(recipient.address);
    });

    it("should not able to mint a token without MINTER_ROLE", async () => {
      await expect(erc721Token.connect(platformOwner).mintTo(recipient.address, URI)).to.reverted;
      // .revertedWith(
      //   `AccessControl: account ${platformOwner.address} is missing role ${MINTER_ROLE}`,
      // );
    });

    it("should not able to mint a token if empty URI", async () => {
      await expect(erc721Token.connect(creator).mintTo(recipient.address, "")).to.revertedWith("!URI");
    });
  });

  describe("ERC721Token: request minting", async () => {
    let domain: TypedDataDomain;
    let mintReq: IERC721Token.MintRequestStruct;
    let mintReqType: Record<string, TypedDataField[]>;
    let erc20: ERC20Test;

    before(async () => {
      await deployments.fixture("tests");
      const chainId = (await ethers.provider.getNetwork()).chainId;
      const blockNumber = ethers.provider.blockNumber;
      const blockTimestamps = (await ethers.provider.getBlock(blockNumber)).timestamp;
      erc20 = await ethers.getContractAt("ERC20Test", (await deployments.get("ERC20Test")).address);
      await erc20.mint(creator.address, 1000);
      await erc20.mint(recipient.address, 1000);
      domain = {
        name: CONTRACT_NAME,
        version: CONTRACT_VERSION.toString(),
        chainId,
        verifyingContract: erc721Token.address,
      };
      // NOTE: should keep it in order
      mintReq = {
        to: recipient.address,
        royaltyRecipient: royaltyRecipient.address,
        royaltyBps: ROYALTY_FEE,
        primarySaleRecipient: saleRecipient.address,
        uri: URI,
        price: 0,
        currency: ADDRRESS_ZERO,
        validityStartTimestamp: blockTimestamps,
        validityEndTimestamp: blockTimestamps + 1000,
        uid: utils.formatBytes32String("0"),
      };
      mintReqType = formatTypedDataField(ERC721TOKEN_ABI.abi, "mintWithSignature", "MintRequest", "_req");
    });

    it("should be able to verify the signature signed by the creator", async () => {
      const signature = await creator._signTypedData(domain, mintReqType, mintReq);
      const digest = utils._TypedDataEncoder.hash(domain, mintReqType, mintReq);
      const signer = utils.recoverAddress(digest, signature);
      expect(signer).to.eq(creator.address);
      const verifyRes = await erc721Token.verify(mintReq, signature);
      expect(verifyRes[0]).to.true;
      expect(verifyRes[1]).to.eq(creator.address);
    });

    it("should be able to mintWithSignature for zero price", async () => {
      // get init states
      const nextTokenID = await erc721Token.nextTokenIdToMint();
      const totalSupply = await erc721Token.totalSupply();
      const recipientBalance = await erc721Token.balanceOf(recipient.address);

      // sign & mint with the signature
      const signature = await creator._signTypedData(domain, mintReqType, mintReq);
      await expect(erc721Token.connect(recipient).mintWithSignature(mintReq, signature))
        .to.emit(erc721Token, "RoyaltyForToken")
        .withArgs(nextTokenID, mintReq.royaltyRecipient, mintReq.royaltyBps)
        .to.emit(erc721Token, "TokensMintedWithSignature");
      // .withArgs(creator.address, recipient.address, nextTokenID, mintReq); // can't expect with array or tuple

      // check states
      expect(await erc721Token.nextTokenIdToMint()).to.eq(nextTokenID.add(1));
      expect(await erc721Token.totalSupply()).to.eq(totalSupply.add(1));
      expect(await erc721Token.balanceOf(recipient.address)).to.eq(recipientBalance.add(1));
      expect(await erc721Token.ownerOf(nextTokenID)).to.eq(recipient.address);
    });

    it("should be able to mintWithSignature for price of ERC20", async () => {
      // update mintReq data
      mintReq.currency = erc20.address;
      mintReq.price = 1000;
      // keep UID iterated
      mintReq.uid = utils.formatBytes32String("1");
      const signature = await creator._signTypedData(domain, mintReqType, mintReq);

      // approve ERC20 token for ERC721Token contract
      await erc20.connect(recipient).approve(erc721Token.address, 1000);

      // get init states
      const nextTokenID = await erc721Token.nextTokenIdToMint();
      const totalSupply = await erc721Token.totalSupply();
      const recipientBalance = await erc721Token.balanceOf(recipient.address);
      const recipientERC20Balance = await erc20.balanceOf(recipient.address);
      const sellerERC20Balance = await erc20.balanceOf(saleRecipient.address);

      // mint with signature
      await erc721Token.connect(recipient).mintWithSignature(mintReq, signature);

      // check states
      expect(await erc721Token.nextTokenIdToMint()).to.eq(nextTokenID.add(1));
      expect(await erc721Token.totalSupply()).to.eq(totalSupply.add(1));
      expect(await erc721Token.balanceOf(recipient.address)).to.eq(recipientBalance.add(1));
      expect(await erc721Token.ownerOf(nextTokenID)).to.eq(recipient.address);

      // check ERC20 balances
      const fee = (mintReq.price * PLATFORM_FEE) / MAX_BPS;
      expect(await erc20.balanceOf(recipient.address)).to.eq(recipientERC20Balance.sub(mintReq.price));
      // can be underflow if lower price
      expect(await erc20.balanceOf(saleRecipient.address)).to.eq(sellerERC20Balance.add(mintReq.price - fee));
    });

    it("should be able to mintWithSignature for price of native token", async () => {
      // update mintReq data
      mintReq.currency = NATIVE_TOKEN;
      mintReq.price = 1000;
      // keep UID iterated
      mintReq.uid = utils.formatBytes32String("2");
      const signature = await creator._signTypedData(domain, mintReqType, mintReq);

      // get init states
      const nextTokenID = await erc721Token.nextTokenIdToMint();
      const totalSupply = await erc721Token.totalSupply();
      const recipientBalance = await erc721Token.balanceOf(recipient.address);
      const recipientNativeBalance = await ethers.provider.getBalance(recipient.address);
      const sellerNativeBalance = await ethers.provider.getBalance(saleRecipient.address);

      // mint with signature
      await erc721Token.connect(recipient).mintWithSignature(mintReq, signature, { value: mintReq.price });

      // check states
      expect(await erc721Token.nextTokenIdToMint()).to.eq(nextTokenID.add(1));
      expect(await erc721Token.totalSupply()).to.eq(totalSupply.add(1));
      expect(await erc721Token.balanceOf(recipient.address)).to.eq(recipientBalance.add(1));
      expect(await erc721Token.ownerOf(nextTokenID)).to.eq(recipient.address);

      // check ERC20 balances
      const fee = (mintReq.price * PLATFORM_FEE) / MAX_BPS;
      // NOTE: vary cause by gas fee
      expect(await ethers.provider.getBalance(recipient.address)).to.below(recipientNativeBalance.sub(mintReq.price));
      // can be underflow if lower price
      expect(await ethers.provider.getBalance(saleRecipient.address)).to.eq(
        sellerNativeBalance.add(mintReq.price - fee),
      );
    });

    it("should not be able to mintWithSignature if value not enough", async () => {
      // update mintReq data
      mintReq.currency = NATIVE_TOKEN;
      mintReq.price = 1000;
      // keep UID iterated
      mintReq.uid = utils.formatBytes32String("3");
      const signature = await creator._signTypedData(domain, mintReqType, mintReq);

      await expect(
        erc721Token.connect(recipient).mintWithSignature(mintReq, signature, { value: 100 }),
      ).to.revertedWith("!ENOUGH");
    });

    it("should not be able to mintWithSignature for ERC20 if value not zero", async () => {
      // update mintReq data
      mintReq.currency = erc20.address;
      mintReq.price = 1000;
      // keep UID iterated
      mintReq.uid = utils.formatBytes32String("4");
      const signature = await creator._signTypedData(domain, mintReqType, mintReq);

      await expect(
        erc721Token.connect(recipient).mintWithSignature(mintReq, signature, { value: 1000 }),
      ).to.revertedWith("!VALUE");
    });

    it("should not be able to mintWithSignature for invalid signature", async () => {
      // keep UID iterated
      mintReq.uid = utils.formatBytes32String("5");
      const signature = await platformOwner._signTypedData(domain, mintReqType, mintReq);

      await expect(erc721Token.connect(recipient).mintWithSignature(mintReq, signature)).to.revertedWith("!SIGNATURE");
    });

    it("should not be able to mintWithSignature if recipient is not specify", async () => {
      // update mintReq to meet the criteria
      mintReq.to = ADDRRESS_ZERO;
      // keep UID iterated
      mintReq.uid = utils.formatBytes32String("6");

      // generate signature
      const signature = await creator._signTypedData(domain, mintReqType, mintReq);

      await expect(erc721Token.connect(recipient).mintWithSignature(mintReq, signature)).to.revertedWith("!RECIPIENT");
    });

    // PLEASE KEEP THIS IN THE BELOW OF THE TEST, SINCE WE ATTEMP TO INSTANTLY MINE BLOCKS
    it("should not be able to mintWithSignature for expired request", async () => {
      // keep UID iterated
      mintReq.uid = utils.formatBytes32String("7");
      const signature = await creator._signTypedData(domain, mintReqType, mintReq);

      // mine 1001 blocks (def: 1 block = 1 sec) since validation period is 1000 secs
      await mine(1001);

      await expect(erc721Token.connect(recipient).mintWithSignature(mintReq, signature)).to.revertedWith("EXPIRED");
    });
  });

  describe("ERC721Token: burn token", async () => {
    it("should be able to burn a token by token owner", async () => {
      // get init states
      const expectedTokenId = await erc721Token.nextTokenIdToMint();
      const totalSupply = await erc721Token.totalSupply();
      const recipientBalance = await erc721Token.balanceOf(recipient.address);

      await erc721Token.connect(creator).mintTo(recipient.address, URI);
      await erc721Token.connect(recipient).burn(expectedTokenId);

      expect(await erc721Token.nextTokenIdToMint()).to.eq(expectedTokenId.add(1));
      expect(await erc721Token.totalSupply()).to.eq(totalSupply);
      expect(await erc721Token.balanceOf(recipient.address)).to.eq(recipientBalance);
      await expect(erc721Token.ownerOf(expectedTokenId)).to.revertedWith("ERC721: invalid token ID");
    });

    it("should be able to burn a token by approving for operator", async () => {
      // get init states
      const expectedTokenId = await erc721Token.nextTokenIdToMint();
      const totalSupply = await erc721Token.totalSupply();
      const recipientBalance = await erc721Token.balanceOf(recipient.address);

      await erc721Token.connect(creator).mintTo(recipient.address, URI);
      await erc721Token.connect(recipient).setApprovalForAll(operator.address, true);
      await erc721Token.connect(operator).burn(expectedTokenId);

      expect(await erc721Token.nextTokenIdToMint()).to.eq(expectedTokenId.add(1));
      expect(await erc721Token.totalSupply()).to.eq(totalSupply);
      expect(await erc721Token.balanceOf(recipient.address)).to.eq(recipientBalance);
      await expect(erc721Token.ownerOf(expectedTokenId)).to.revertedWith("ERC721: invalid token ID");
    });

    it("should not able to burn a token if signer not owner nor approved", async () => {
      const expectedTokenId = await erc721Token.nextTokenIdToMint();
      await erc721Token.connect(creator).mintTo(recipient.address, URI);

      await expect(erc721Token.connect(platformOwner).burn(expectedTokenId)).to.revertedWith("!APPROVED");
    });
  });

  describe("ERC721Token: contract metadata & extensions", async () => {
    it("should be able to set contractURI with ADMIN_ROLE", async () => {
      await erc721Token.connect(creator).setContractURI(URI);
      expect(await erc721Token.contractURI()).to.eq(URI);
    });

    it("should be able to set platformFee with ADMIN_ROLE", async () => {
      // give platform fee to a user with 0%
      await expect(erc721Token.connect(creator).setPlatformFeeInfo(recipient.address, ZERO_FEE))
        .to.emit(erc721Token, "PlatformFeeInfoUpdated")
        .withArgs(recipient.address, ZERO_FEE);
    });

    it("should be able to set default sale recipient with ADMIN_ROLE", async () => {
      await expect(erc721Token.connect(creator).setPrimarySaleRecipient(recipient.address))
        .to.emit(erc721Token, "PrimarySaleRecipientUpdated")
        .withArgs(recipient.address);
    });

    it("should be able to set default royalty with ADMIN_ROLE", async () => {
      await expect(erc721Token.connect(creator).setDefaultRoyaltyInfo(recipient.address, ZERO_FEE))
        .to.emit(erc721Token, "DefaultRoyalty")
        .withArgs(recipient.address, ZERO_FEE);
    });

    it("should not able to set contractURI without ADMIN_ROLE", async () => {
      await expect(erc721Token.connect(platformOwner).setContractURI(URI)).to.reverted;
    });

    it("should not able to set platformFee without ADMIN_ROLE", async () => {
      await expect(erc721Token.connect(platformOwner).setPlatformFeeInfo(recipient.address, ZERO_FEE)).to.reverted;
    });

    it("should not able to set default sale recipient without ADMIN_ROLE", async () => {
      await expect(erc721Token.connect(platformOwner).setPrimarySaleRecipient(recipient.address)).to.reverted;
    });

    it("should not able to set default royalty without ADMIN_ROLE", async () => {
      await expect(erc721Token.connect(platformOwner).setDefaultRoyaltyInfo(recipient.address, ZERO_FEE)).to.reverted;
    });
  });
});

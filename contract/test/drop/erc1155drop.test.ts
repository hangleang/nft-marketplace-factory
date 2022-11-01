import { expect } from "chai";
import { BigNumber } from "ethers";
import { deployments, ethers } from "hardhat";
import { mine } from "@nomicfoundation/hardhat-network-helpers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import { ERC1155Drop, ERC20Test } from "../../types";
import { IClaimCondition } from "../../types/contracts/drop/ERC1155Drop";
import { buildMerkleRoot, buildMerkleTree, getMerkleProofs, getTimestamp } from "../utils";
import MerkleTree from "merkletreejs";

const { utils } = ethers;

// CONTRACT METADATA
const CONTRACT_NAME: string = "ERC1155Drop";
const CONTRACT_TYPE: string = utils.formatBytes32String(CONTRACT_NAME);
const CONTRACT_VERSION: number = 1;
const NATIVE_TOKEN: string = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

// TOKEN
const NAME: string = "Demo NFT Drop";
const SYMBOL: string = "DND";
const URI: string = "ipfs://random-string";

// FEE
const ONE_BPS: number = 100; // 1% in BPS unit
const PLATFORM_FEE: number = ONE_BPS * 5; // 5% of platformFee
const ROYALTY_FEE: number = ONE_BPS * 5; // 5% of royalty

// ROLES
const ADMIN_ROLE: string = ethers.constants.HashZero;
const TRANSFER_ROLE: string = utils.keccak256(utils.toUtf8Bytes("TRANSFER_ROLE"));
const MINTER_ROLE: string = utils.keccak256(utils.toUtf8Bytes("MINTER_ROLE"));

// OTHERS
const ADDRRESS_ZERO: string = ethers.constants.AddressZero;
const EMPTY_BYTES: string = utils.formatBytes32String("");

describe("ERC1155Drop", async () => {
  let platformOwner: SignerWithAddress;
  let creator: SignerWithAddress;
  let saleRecipient: SignerWithAddress;
  let royaltyRecipient: SignerWithAddress;
  let recipient: SignerWithAddress;
  let allowlist: SignerWithAddress[];
  let erc1155Drop: ERC1155Drop;
  let defaultClaimCondition: IClaimCondition.ClaimConditionStruct;

  before(async () => {
    await deployments.fixture(["ContractFactory", "Impls"]);
    [platformOwner, creator, saleRecipient, royaltyRecipient, recipient, ...allowlist] = await ethers.getSigners();
    erc1155Drop = await ethers.getContractAt("ERC1155Drop", (await deployments.get("ERC1155Drop")).address);
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
    const encodedInitData: string = (await ethers.getContractFactory("ERC1155Drop")).interface.encodeFunctionData(
      "initialize",
      initParams,
    );
    const receipt = await (await factory.connect(creator).deployProxy(CONTRACT_TYPE, encodedInitData)).wait();
    const proxyDeployedEvent = receipt.events?.find(x => x.event == "ProxyDeployed");
    const proxyAddress = proxyDeployedEvent?.args?.proxy;
    erc1155Drop = await ethers.getContractAt("ERC1155Drop", proxyAddress);

    defaultClaimCondition = {
      startTimestamp: 1,
      maxClaimableSupply: 10,
      supplyClaimed: 0,
      quantityLimitPerTransaction: 1,
      waitTimeInSecondsBetweenClaims: 0,
      merkleRoot: EMPTY_BYTES,
      pricePerToken: 0,
      currency: ADDRRESS_ZERO,
    };
  });

  it("checking....", async () => {
    expect(await erc1155Drop.contractType()).to.eq(CONTRACT_TYPE);
    expect(await erc1155Drop.contractVersion()).to.eq(CONTRACT_VERSION);
    expect(await erc1155Drop.contractURI()).to.eq(URI);
    expect(await erc1155Drop.name()).to.eq(NAME);
    expect(await erc1155Drop.symbol()).to.eq(SYMBOL);
    expect(await erc1155Drop.primarySaleRecipient()).to.eq(saleRecipient.address);
    const platformInfo = await erc1155Drop.getPlatformFeeInfo();
    expect(platformInfo[0]).to.eq(platformOwner.address);
    expect(platformInfo[1]).to.eq(PLATFORM_FEE);
    const royaltyInfo = await erc1155Drop.getDefaultRoyaltyInfo();
    expect(royaltyInfo[0]).to.eq(royaltyRecipient.address);
    expect(royaltyInfo[1]).to.eq(ROYALTY_FEE);
    // expect(await erc1155Drop.getDefaultRoyaltyInfo()).to.eq([royaltyRecipient.address, ROYALTY_FEE]);

    // CHECK ACCESS CONTROL
    expect(await erc1155Drop.hasRole(ADMIN_ROLE, creator.address)).to.true;
    expect(await erc1155Drop.hasRole(MINTER_ROLE, creator.address)).to.true;
    expect(await erc1155Drop.hasRole(TRANSFER_ROLE, ADDRRESS_ZERO)).to.true;
  });

  describe("ERC1155Drop: define claim conditions", async () => {
    let claimConditions: IClaimCondition.ClaimConditionStruct[];

    before(async () => {
      const blockTimestamp = await getTimestamp();
      claimConditions = [
        {
          ...defaultClaimCondition,
          startTimestamp: blockTimestamp,
        },
        {
          ...defaultClaimCondition,
          startTimestamp: blockTimestamp + 10,
        },
        {
          ...defaultClaimCondition,
          startTimestamp: blockTimestamp + 20,
        },
      ];
    });

    it("should be able to set claim conditions by ADMIN_ROLE", async () => {
      const tokenId = 1;
      await expect(erc1155Drop.connect(creator).setClaimConditions(tokenId, claimConditions, false)).to.not.reverted;
      // .withArgs(tokenId, claimConditions);
    });

    it("should be able to set claim conditions with resetClaimEligibility", async () => {
      // init states
      const tokenId = 1;
      let currentStartId: BigNumber;
      let count: BigNumber;

      await erc1155Drop.connect(creator).setClaimConditions(tokenId, claimConditions, false);
      [currentStartId, count] = await erc1155Drop.claimCondition(tokenId);
      expect(currentStartId).to.eq(0);
      expect(count).to.eq(claimConditions.length);

      await erc1155Drop.connect(creator).setClaimConditions(tokenId, claimConditions, false);
      [currentStartId, count] = await erc1155Drop.claimCondition(tokenId);
      expect(currentStartId).to.eq(0);
      expect(count).to.eq(claimConditions.length);

      await erc1155Drop.connect(creator).setClaimConditions(tokenId, claimConditions, true);
      [currentStartId, count] = await erc1155Drop.claimCondition(tokenId);
      expect(currentStartId).to.eq(3);
      expect(count).to.eq(claimConditions.length);

      await erc1155Drop.connect(creator).setClaimConditions(tokenId, claimConditions, true);
      [currentStartId, count] = await erc1155Drop.claimCondition(tokenId);
      expect(currentStartId).to.eq(6);
      expect(count).to.eq(claimConditions.length);
    });

    it("should be able to set claim conditions of phases", async () => {
      // init state
      const tokenId = 2;
      let activeID: number;
      let activeClaimCondition: IClaimCondition.ClaimConditionStruct;
      // anonymous function for checking active claim condition
      const check = async (expectActiveId: number) => {
        activeID = (await erc1155Drop.getActiveClaimConditionId(tokenId)).toNumber();
        expect(activeID).to.eq(expectActiveId);
        activeClaimCondition = await erc1155Drop.getClaimConditionById(tokenId, activeID);
        expect(activeClaimCondition.startTimestamp).to.eq(claimConditions[activeID].startTimestamp);
        expect(activeClaimCondition.maxClaimableSupply).to.eq(claimConditions[activeID].maxClaimableSupply);
        expect(activeClaimCondition.quantityLimitPerTransaction).to.eq(
          claimConditions[activeID].quantityLimitPerTransaction,
        );
        expect(activeClaimCondition.waitTimeInSecondsBetweenClaims).to.eq(
          claimConditions[activeID].waitTimeInSecondsBetweenClaims,
        );
      };

      const currentTimestamp = await getTimestamp();
      claimConditions[0].startTimestamp = currentTimestamp + 10;
      claimConditions[0].maxClaimableSupply = 11;
      claimConditions[0].quantityLimitPerTransaction = 12;
      claimConditions[0].waitTimeInSecondsBetweenClaims = 13;
      claimConditions[1].startTimestamp = currentTimestamp + 20;
      claimConditions[1].maxClaimableSupply = 21;
      claimConditions[1].quantityLimitPerTransaction = 22;
      claimConditions[1].waitTimeInSecondsBetweenClaims = 23;
      claimConditions[2].startTimestamp = currentTimestamp + 30;
      claimConditions[2].maxClaimableSupply = 31;
      claimConditions[2].quantityLimitPerTransaction = 32;
      claimConditions[2].waitTimeInSecondsBetweenClaims = 33;
      await erc1155Drop.connect(creator).setClaimConditions(tokenId, claimConditions, false);

      await check(0);

      await mine(10);
      await check(1);

      await mine(10);
      await check(2);

      await mine(10);
      expect(await erc1155Drop.getActiveClaimConditionId(tokenId)).to.eq(2);
    });
  });

  describe("ERC1155Drop: lazy mint & claim", async () => {
    let erc20: ERC20Test;

    before(async () => {
      await deployments.fixture("tests");
      erc20 = await ethers.getContractAt("ERC20Test", (await deployments.get("ERC20Test")).address);
      await erc20.mint(creator.address, 1000);
      await erc20.mint(recipient.address, 1000);
    });

    it("should be able to claim tokens with a price", async () => {
      // init & update state
      const tokenId = 1;
      const currentTimestamp = await getTimestamp();
      const maxClaimableSupply = 100;
      const qtyToClaim = 10;
      const conditions = [
        {
          ...defaultClaimCondition,
          startTimestamp: currentTimestamp,
          maxClaimableSupply,
          quantityLimitPerTransaction: qtyToClaim,
          currency: NATIVE_TOKEN,
          pricePerToken: 1000,
        },
      ];

      // lazy mint & set claim conditions
      const expectdTokenID = await erc1155Drop.nextTokenIdToMint();
      await expect(erc1155Drop.connect(creator).lazyMint(maxClaimableSupply, URI))
        .to.emit(erc1155Drop, "TokensLazyMinted")
        .withArgs(expectdTokenID, expectdTokenID.add(maxClaimableSupply - 1), URI);
      await erc1155Drop.connect(creator).setClaimConditions(tokenId, conditions, false);

      // claim drop
      const activeID = await erc1155Drop.getActiveClaimConditionId(tokenId);
      await expect(
        erc1155Drop
          .connect(recipient)
          .claim(recipient.address, tokenId, qtyToClaim, NATIVE_TOKEN, 1000, [], 0, { value: 10000 }),
      )
        .to.emit(erc1155Drop, "TokensClaimed")
        .withArgs(activeID, tokenId, recipient.address, recipient.address, qtyToClaim);
    });

    it("should be able to claim tokens with price of ERC20", async () => {
      // init & update state
      const tokenId = 1;
      const currentTimestamp = await getTimestamp();
      const maxClaimableSupply = 100;
      const qtyToClaim = 1;
      const conditions = [
        {
          ...defaultClaimCondition,
          startTimestamp: currentTimestamp,
          maxClaimableSupply,
          quantityLimitPerTransaction: qtyToClaim,
          currency: erc20.address,
          pricePerToken: 1000,
        },
      ];

      // lazy mint & set claim conditions
      await erc1155Drop.connect(creator).lazyMint(maxClaimableSupply, URI);
      await erc1155Drop.connect(creator).setClaimConditions(tokenId, conditions, false);

      // approve ERC20 spend
      await erc20.connect(recipient).approve(erc1155Drop.address, 1000);

      // claim drop
      await erc1155Drop.connect(recipient).claim(recipient.address, tokenId, qtyToClaim, erc20.address, 1000, [], 0);
    });

    it("should not able to claim tokens if price not enough or invalid currency", async () => {
      // init & update state
      const tokenId = 1;
      const currentTimestamp = await getTimestamp();
      const maxClaimableSupply = 100;
      const qtyToClaim = 10;
      const conditions = [
        {
          ...defaultClaimCondition,
          startTimestamp: currentTimestamp,
          maxClaimableSupply,
          quantityLimitPerTransaction: qtyToClaim,
          currency: NATIVE_TOKEN,
          pricePerToken: 1000,
        },
      ];

      // lazy mint & set claim conditions
      await erc1155Drop.connect(creator).lazyMint(maxClaimableSupply, URI);
      await erc1155Drop.connect(creator).setClaimConditions(tokenId, conditions, false);

      // claim drop with native token
      await expect(
        erc1155Drop
          .connect(recipient)
          .claim(recipient.address, tokenId, qtyToClaim, NATIVE_TOKEN, 100, [], 0, { value: 100 }),
      ).to.revertedWith("!CURRENCY");

      // approve ERC20 spend & claim drop with ERC20
      await erc20.connect(recipient).approve(erc1155Drop.address, 1000);
      await expect(
        erc1155Drop.connect(recipient).claim(recipient.address, tokenId, qtyToClaim, erc20.address, 1000, [], 0),
      ).to.revertedWith("!CURRENCY");
    });

    it("should not able to claim tokens if invalid QTY", async () => {
      // init & update state
      const tokenId = 1;
      const currentTimestamp = await getTimestamp();
      const maxClaimableSupply = 100;
      const quantityLimitPerTransaction = 10;
      const conditions = [
        {
          ...defaultClaimCondition,
          startTimestamp: currentTimestamp,
          maxClaimableSupply,
          quantityLimitPerTransaction,
        },
      ];

      // lazy mint & set claim conditions
      await erc1155Drop.connect(creator).lazyMint(maxClaimableSupply, URI);
      await erc1155Drop.connect(creator).setClaimConditions(tokenId, conditions, false);

      // claim over QTY limit
      const attemptClaimQTY = quantityLimitPerTransaction + 1;
      await expect(
        erc1155Drop.connect(recipient).claim(recipient.address, tokenId, attemptClaimQTY, ADDRRESS_ZERO, 0, [], 0),
      ).to.revertedWith("!QTY");
    });

    it("should not able to claim tokens if reached mintable cap", async () => {
      // init & update state
      const tokenId = 2;
      const currentTimestamp = await getTimestamp();
      const maxClaimableSupply = 10;
      const quantityLimitPerTransaction = 10;
      const conditions = [
        {
          ...defaultClaimCondition,
          startTimestamp: currentTimestamp,
          maxClaimableSupply,
          quantityLimitPerTransaction,
        },
      ];

      // lazy mint & set claim conditions
      await erc1155Drop.connect(creator).lazyMint(maxClaimableSupply, URI);
      await erc1155Drop.connect(creator).setClaimConditions(tokenId, conditions, false);

      // claim successfully
      await erc1155Drop
        .connect(recipient)
        .claim(recipient.address, tokenId, quantityLimitPerTransaction, ADDRRESS_ZERO, 0, [], 0);

      // can not claim since this phase reach maxClaimableSupply
      await expect(
        erc1155Drop.connect(platformOwner).claim(platformOwner.address, tokenId, 1, ADDRRESS_ZERO, 0, [], 0),
      ).to.revertedWith(">MAX_MINT");
    });

    it("should not able to claim tokens if reached supply cap", async () => {
      // init & update state
      const tokenId = 3;
      const currentTimestamp = await getTimestamp();
      const maxClaimableSupply = 100;
      const quantityLimitPerTransaction = 10;
      const conditions = [
        {
          ...defaultClaimCondition,
          startTimestamp: currentTimestamp,
          maxClaimableSupply,
          quantityLimitPerTransaction,
        },
      ];

      // lazy mint & set claim conditions
      await erc1155Drop.connect(creator).lazyMint(maxClaimableSupply, URI);
      await erc1155Drop.connect(creator).setClaimConditions(tokenId, conditions, false);

      // set max supply
      const maxSupply = 10;
      await expect(erc1155Drop.connect(creator).setMaxTotalSupply(tokenId, maxSupply))
        .to.emit(erc1155Drop, "MaxTotalSupplyUpdated")
        .withArgs(tokenId, maxSupply);

      await erc1155Drop
        .connect(recipient)
        .claim(recipient.address, tokenId, quantityLimitPerTransaction, ADDRRESS_ZERO, 0, [], 0);

      // can not claim since
      await expect(
        erc1155Drop.connect(platformOwner).claim(platformOwner.address, tokenId, 1, ADDRRESS_ZERO, 0, [], 0),
      ).to.revertedWith(">MAX_SUP");
    });

    it("should not able to claim tokens if reached max claimable per address", async () => {
      // init & update state
      const tokenId = 4;
      const currentTimestamp = await getTimestamp();
      const maxClaimableSupply = 100;
      const quantityLimitPerTransaction = 10;
      const conditions = [
        {
          ...defaultClaimCondition,
          startTimestamp: currentTimestamp,
          maxClaimableSupply,
          quantityLimitPerTransaction,
        },
      ];

      // lazy mint & set claim conditions
      await erc1155Drop.connect(creator).lazyMint(maxClaimableSupply, URI);
      await erc1155Drop.connect(creator).setClaimConditions(tokenId, conditions, false);

      // set max claimable on recipient
      const maxCount = 10;
      await expect(erc1155Drop.connect(creator).setMaxWalletClaimCount(tokenId, maxCount))
        .to.emit(erc1155Drop, "MaxWalletClaimCountUpdated")
        .withArgs(tokenId, maxCount);

      await erc1155Drop
        .connect(recipient)
        .claim(recipient.address, tokenId, quantityLimitPerTransaction, ADDRRESS_ZERO, 0, [], 0);

      // can not claim cause by max wallet count
      await expect(
        erc1155Drop.connect(recipient).claim(recipient.address, tokenId, 1, ADDRRESS_ZERO, 0, [], 0),
      ).to.revertedWith(">MAX_COUNT");
    });

    it("should be able to claim only 1 time per address without price, util reset", async () => {
      // init & update state
      const tokenId = 10;
      const currentTimestamp = await getTimestamp();
      const conditions = [
        {
          ...defaultClaimCondition,
          startTimestamp: currentTimestamp,
          maxClaimableSupply: 100,
          quantityLimitPerTransaction: 100,
          waitTimeInSecondsBetweenClaims: ethers.constants.MaxUint256,
        },
      ];

      // lazy mint & set claim conditions
      await erc1155Drop.connect(creator).lazyMint(100, URI);
      await erc1155Drop.connect(creator).setClaimConditions(tokenId, conditions, false);

      // claim drop
      await erc1155Drop.connect(recipient).claim(recipient.address, tokenId, 1, ADDRRESS_ZERO, 0, [], 0);
      // can not claim again
      await expect(
        erc1155Drop.connect(recipient).claim(platformOwner.address, tokenId, 1, ADDRRESS_ZERO, 0, [], 0),
      ).to.revertedWith("!TIME");

      // util admin reset claim eligibility
      await erc1155Drop.connect(creator).setClaimConditions(tokenId, conditions, true);
      await erc1155Drop.connect(recipient).claim(recipient.address, tokenId, 1, ADDRRESS_ZERO, 0, [], 0);
    });

    describe("ERC1155Drop: claim tokens with allowlist", async () => {
      let tree: MerkleTree;
      let root: string;
      let tokenId: number;
      let qtyPerUser: number;

      before(async () => {
        tokenId = 11;
        qtyPerUser = 1000;

        const currentTimestamp = await getTimestamp();
        const claimableSupply = qtyPerUser * allowlist.length;
        const allowlistAddresses = allowlist.map(acc => acc.address);

        tree = buildMerkleTree(allowlistAddresses, qtyPerUser);
        root = buildMerkleRoot(tree);
        // console.log(tree.toString());

        const conditions = [
          {
            ...defaultClaimCondition,
            startTimestamp: currentTimestamp,
            maxClaimableSupply: claimableSupply,
            quantityLimitPerTransaction: qtyPerUser,
            waitTimeInSecondsBetweenClaims: ethers.constants.MaxUint256,
            merkleRoot: root,
          },
        ];
        await erc1155Drop.connect(creator).lazyMint(claimableSupply, URI);
        await erc1155Drop.connect(creator).setClaimConditions(tokenId, conditions, false);
      });

      it("should be able to claim tokens if in allowlist", async () => {
        const proofs = getMerkleProofs(tree, allowlist[0].address, qtyPerUser);

        await expect(
          erc1155Drop
            .connect(allowlist[0])
            .claim(allowlist[0].address, tokenId, qtyPerUser, ADDRRESS_ZERO, 0, proofs, qtyPerUser),
        ).to.not.reverted;
      });

      it("should not able to claim tokens if not in allowlist", async () => {
        const proofs = getMerkleProofs(tree, platformOwner.address, qtyPerUser);

        await expect(
          erc1155Drop
            .connect(platformOwner)
            .claim(platformOwner.address, tokenId, qtyPerUser, ADDRRESS_ZERO, 0, proofs, qtyPerUser),
        ).to.revertedWith("!PROOF");
      });

      it("should not able to claim tokens if already claimed", async () => {
        const proofs = getMerkleProofs(tree, allowlist[1].address, qtyPerUser);

        await erc1155Drop
          .connect(allowlist[1])
          .claim(allowlist[1].address, tokenId, qtyPerUser, ADDRRESS_ZERO, 0, proofs, qtyPerUser);
        await expect(
          erc1155Drop
            .connect(allowlist[1])
            .claim(allowlist[1].address, tokenId, qtyPerUser, ADDRRESS_ZERO, 0, proofs, qtyPerUser),
        ).to.revertedWith("CLAIMED");
      });

      it("should not able to claim tokens if attempt to claim over allowance", async () => {
        const proofs = getMerkleProofs(tree, allowlist[2].address, qtyPerUser);
        const attemptQTY = qtyPerUser + 1;

        await expect(
          erc1155Drop
            .connect(allowlist[2])
            .claim(allowlist[2].address, tokenId, attemptQTY, ADDRRESS_ZERO, 0, proofs, qtyPerUser),
        ).to.revertedWith("!PROOF_ALLOWANCE");
      });
    });
  });
});

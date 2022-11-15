import { expect } from "chai";
import { deployments, ethers } from "hardhat";
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import type { SnapshotRestorer } from "@nomicfoundation/hardhat-network-helpers";
import { mine, takeSnapshot } from "@nomicfoundation/hardhat-network-helpers";

import { Marketplace, IMarketplace, ERC721Test, WETH } from "../types";
import { getTimestamp } from "./utils";
import { BigNumber } from "ethers";
const { utils } = ethers;

// CONTRACT METADATA
const CONTRACT_URI: string = "ipfs://random-string";

// FEE
const ONE_BPS: number = 100; // 1% in BPS unit
const ZERO_FEE: number = ONE_BPS * 0; // 0% in BPS unit
const MAX_BPS: number = ONE_BPS * 100; // 100% = MAX_BPS
const MARKETPLACE_FEE: number = ONE_BPS * 5; // 5% of platformFee

// ROLES
const ADMIN_ROLE: string = ethers.constants.HashZero;
const LISTER_ROLE: string = utils.keccak256(utils.toUtf8Bytes("LISTER_ROLE"));
const ASSET_ROLE: string = utils.keccak256(utils.toUtf8Bytes("ASSET_ROLE"));

// OTHER
const NATIVE_TOKEN: string = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ADDRRESS_ZERO: string = ethers.constants.AddressZero;
const ONE_DAY: number = 1 * 24 * 60 * 60; // 1 day
const DELAY_PERIOD: number = ONE_DAY;
const STARTLIST_BUFFER: number = 1 * 60 * 60; // 1 hour
enum TokenType {
  ERC1155,
  ERC721,
}
enum ListingType {
  Direct,
  Auction,
}

const setupTest = deployments.createFixture(async ({ deployments, getNamedAccounts, ethers, upgrades }, _options) => {
  await deployments.fixture(["mocks", "tests"]);
  const { deployer, feeCollector } = await getNamedAccounts();

  // get mock contract address
  const forwarderAddress = (await deployments.get("MinimalForwarderMock")).address;
  const wethAddress = (await deployments.get("WETH")).address;
  const constructorArgs = [wethAddress];
  const args = [
    deployer, // admin address
    CONTRACT_URI, // contract URI
    [forwarderAddress], // newly deployed trust forwarder address
    feeCollector, // fee recipient address
    MARKETPLACE_FEE, // platform fees percentage 500 == %5.0
  ];

  // marketplace instantiations
  const marketplaceFactory = await ethers.getContractFactory("Marketplace");
  const marketplace = await upgrades.deployProxy(marketplaceFactory, args, {
    kind: "uups",
    initializer: "initialize",
    constructorArgs,
    unsafeAllow: ["constructor", "state-variable-immutable", "delegatecall"],
  });

  const erc721Address: string = (await deployments.get("ERC721Test")).address;

  return {
    marketplaceAddress: marketplace.address,
    erc721Address,
    wethAddress,
  };
});

describe("Marketplace", async () => {
  let platformOwner: SignerWithAddress;
  let feeCollector: SignerWithAddress;
  let artist: SignerWithAddress;
  let lister: SignerWithAddress;
  let buyers: SignerWithAddress[];
  let marketplace: Marketplace;
  let erc721token: ERC721Test;
  let weth: WETH;
  // sample listing params
  let sampleListingParams: IMarketplace.ListingParametersStruct;
  let buyoutPrice: BigNumber;
  // snapshot for restoring state
  let snapshot: SnapshotRestorer;

  before(async () => {
    [platformOwner, feeCollector, artist, lister, ...buyers] = await ethers.getSigners();
    const { marketplaceAddress, erc721Address, wethAddress } = await setupTest();
    marketplace = await ethers.getContractAt("Marketplace", marketplaceAddress);
    erc721token = await ethers.getContractAt("ERC721Test", erc721Address);
    weth = await ethers.getContractAt("WETH", wethAddress);
    buyoutPrice = utils.parseEther("1000");
    const currentTimestamp = await getTimestamp();
    sampleListingParams = {
      assetContract: erc721token.address,
      tokenId: 0,
      startTime: currentTimestamp,
      secondsUntilEndTime: ONE_DAY,
      quantityToList: 1,
      currencyToAccept: NATIVE_TOKEN,
      reservePricePerToken: 0,
      buyoutPricePerToken: buyoutPrice,
      listingType: ListingType.Direct,
    };
  });

  it("checking...", async () => {
    // CHECK PLATFORM INFO
    const platformInfo = await marketplace.getPlatformFeeInfo();
    expect(platformInfo[0]).to.eq(feeCollector.address);
    expect(platformInfo[1]).to.eq(MARKETPLACE_FEE);

    // CHECK ACCESS CONTROL
    expect(await marketplace.hasRole(ADMIN_ROLE, platformOwner.address)).to.true;
    expect(await marketplace.hasRole(LISTER_ROLE, ADDRRESS_ZERO)).to.true; // mean anyone can list, otherwise restrict
    expect(await marketplace.hasRole(ASSET_ROLE, ADDRRESS_ZERO)).to.true; // mean any compatible assets can list, otherwise restrict
  });

  describe("Marketplace: listing", async () => {
    let expectedTokenId: BigNumber;

    before(async () => {
      // mint & approve the token
      expectedTokenId = await erc721token.nextTokenIdToMint();
      await erc721token.connect(artist).mint(lister.address, 1);
      await erc721token.connect(lister).setApprovalForAll(marketplace.address, true);
      snapshot = await takeSnapshot();
    });

    afterEach(async () => await snapshot.restore());

    it("should be able to start list now", async () => {
      // create direct listing
      const listParams = {
        ...sampleListingParams,
        tokenId: expectedTokenId,
      };
      // const expectedListingId = await marketplace.totalListings();
      await expect(marketplace.connect(lister).createListing(listParams)).to.emit(marketplace, "ListingAdded");
      // .withArgs(expectedListingId, erc721token.address, lister.address, listing);
    });

    it("should be able to list in the future", async () => {
      const currentTimestamp = await getTimestamp();
      const expectedStartTimestamp = currentTimestamp + DELAY_PERIOD; // now + 1 day

      // create direct listing
      const listParams = {
        ...sampleListingParams,
        tokenId: expectedTokenId,
        startTime: expectedStartTimestamp,
      };
      // this will start listing with expectedStartTimestamp
      await marketplace.connect(lister).createListing(listParams);
    });

    it("should be able to list within the STARTLIST_BUFFER", async () => {
      const currentTimestamp = await getTimestamp();
      const expectedStartTimestamp = currentTimestamp - STARTLIST_BUFFER / 2; // now - 1/2 hour

      // create direct listing
      const listParams = {
        ...sampleListingParams,
        tokenId: expectedTokenId,
        startTime: expectedStartTimestamp,
      };
      // this will start listing with currentTimestamp, not expectedStartTimestamp
      await marketplace.connect(lister).createListing(listParams);
    });

    it("should not able to list if startTimestamp has been past STARTLIST_BUFFER", async () => {
      const currentTimestamp = await getTimestamp();
      const expectedStartTimestamp = currentTimestamp - STARTLIST_BUFFER; // now - 1 hour

      // create direct listing
      const listParams = {
        ...sampleListingParams,
        tokenId: expectedTokenId,
        startTime: expectedStartTimestamp,
      };
      await expect(marketplace.connect(lister).createListing(listParams)).to.revertedWith(">ST_BUFFER");
    });

    it("should be able to update listing which's not start", async () => {
      const currentTimestamp = await getTimestamp();
      const expectedStartTimestamp = currentTimestamp + DELAY_PERIOD; // now + 1 day

      // create direct listing
      const expectedListingId = await marketplace.totalListings();
      const listParams = {
        ...sampleListingParams,
        tokenId: expectedTokenId,
        startTime: expectedStartTimestamp,
      };
      // this will start listing with expectedStartTimestamp
      await marketplace.connect(lister).createListing(listParams);

      // get current listing state
      const [
        _listingID,
        _tokenOwner,
        _assetContract,
        _tokenId,
        startTime,
        endTime,
        quantity,
        currency,
        _reservePricePerToken,
        buyoutPricePerToken,
        _tokenType,
        _listingType,
      ] = await marketplace.listings(expectedListingId);

      // almost start, let's set reserve price per token
      await mine(DELAY_PERIOD - 10);
      const newReservePricePerToken = utils.parseEther("100");
      await expect(
        marketplace
          .connect(lister)
          .updateListing(
            expectedListingId,
            quantity,
            newReservePricePerToken,
            buyoutPricePerToken,
            currency,
            startTime,
            endTime.sub(startTime),
          ),
      )
        .to.emit(marketplace, "ListingUpdated")
        .withArgs(expectedListingId, lister.address);
    });

    it("should not able to update auction listing if started or reserve > buyout", async () => {
      const currentTimestamp = await getTimestamp();
      const expectedStartTimestamp = currentTimestamp + DELAY_PERIOD; // now + 1 day

      // create direct listing
      const expectedListingId = await marketplace.totalListings();
      const listParams = {
        ...sampleListingParams,
        tokenId: expectedTokenId,
        startTime: expectedStartTimestamp,
        listingType: ListingType.Auction,
      };
      // this will start listing with expectedStartTimestamp
      await marketplace.connect(lister).createListing(listParams);

      // get current listing state
      const [
        _listingID,
        _tokenOwner,
        _assetContract,
        _tokenId,
        startTime,
        endTime,
        quantity,
        currency,
        _reservePricePerToken,
        buyoutPricePerToken,
        _tokenType,
        _listingType,
      ] = await marketplace.listings(expectedListingId);

      // almost started, let's attempt set reserve > buyout
      const threshold = 10;
      await mine(DELAY_PERIOD - threshold);
      const newReservePricePerToken = buyoutPricePerToken.add(1);
      await expect(
        marketplace
          .connect(lister)
          .updateListing(
            expectedListingId,
            quantity,
            newReservePricePerToken,
            buyoutPricePerToken,
            currency,
            startTime,
            endTime.sub(startTime),
          ),
      ).to.revertedWith(">BUYOUT");

      // started, let's attempt update
      await mine(threshold);
      await expect(
        marketplace
          .connect(lister)
          .updateListing(
            expectedListingId,
            quantity,
            newReservePricePerToken,
            buyoutPricePerToken,
            currency,
            startTime,
            endTime.sub(startTime),
          ),
      ).to.revertedWith("STARTED");
    });
  });

  describe("Marketplace: direct listing", async () => {
    // let sampleDirectParams: IMarketplace.ListingParametersStruct;
    let expectedTokenId: BigNumber;
    let expectedListingId: BigNumber;
    let expectedStartTimestamp: number;

    before("shoulb be able to create direct listing by token owner", async () => {
      const currentTimestamp = await getTimestamp();
      expectedStartTimestamp = currentTimestamp + DELAY_PERIOD;

      // mint & approve the token
      expectedTokenId = await erc721token.nextTokenIdToMint();
      await erc721token.connect(artist).mint(lister.address, 1);
      await erc721token.connect(lister).setApprovalForAll(marketplace.address, true);

      // create direct listing
      expectedListingId = await marketplace.totalListings();
      const listParams = {
        ...sampleListingParams,
        tokenId: expectedTokenId,
        startTime: expectedStartTimestamp,
        listingType: ListingType.Direct,
      };
      await marketplace.connect(lister).createListing(listParams);

      // mine blocks
      await mine(DELAY_PERIOD);
      snapshot = await takeSnapshot();
    });

    afterEach(async () => await snapshot.restore());

    it("checking...", async () => {
      const [
        listingId,
        tokenOwner,
        assetContract,
        tokenId,
        startTime,
        endTime,
        quantity,
        currency,
        reservePricePerToken,
        buyoutPricePerToken,
        tokenType,
        listingType,
      ] = await marketplace.listings(expectedListingId);
      expect(listingId).to.eq(expectedListingId);
      expect(tokenOwner).to.eq(lister.address);
      expect(assetContract).to.eq(erc721token.address);
      expect(tokenId).to.eq(expectedTokenId);
      expect(startTime).to.eq(expectedStartTimestamp);
      expect(endTime).to.eq(expectedStartTimestamp + ONE_DAY);
      expect(quantity).to.eq(sampleListingParams.quantityToList);
      expect(currency).to.eq(sampleListingParams.currencyToAccept);
      expect(reservePricePerToken).to.eq(sampleListingParams.reservePricePerToken);
      expect(buyoutPricePerToken).to.eq(sampleListingParams.buyoutPricePerToken);
      expect(tokenType).to.eq(TokenType.ERC721);
      expect(listingType).to.eq(ListingType.Direct);
    });

    it("should be able to accept offer by lister", async () => {
      // check WETH balance & token ownership
      let currentTokenOwner = await erc721token.ownerOf(expectedTokenId);
      let currentWETHBalance = await weth.balanceOf(buyers[0].address);
      expect(currentTokenOwner).to.eq(lister.address);
      expect(currentWETHBalance).to.eq(0);

      // calculate amount need to wrap
      const pricePerToken = utils.parseEther("100");
      const qtyWanted = 1;
      const offerAmount = pricePerToken.mul(qtyWanted);

      // wrap 100 ETH, then check balance
      await weth.connect(buyers[0]).deposit({ value: offerAmount });
      currentWETHBalance = await weth.balanceOf(buyers[0].address);
      expect(currentWETHBalance).to.eq(offerAmount);

      // approve & make offer for direct listing
      const expirationTimestamp = ethers.constants.MaxUint256;
      await weth.connect(buyers[0]).approve(marketplace.address, offerAmount);
      await expect(
        marketplace
          .connect(buyers[0])
          .offer(expectedListingId, qtyWanted, NATIVE_TOKEN, pricePerToken, expirationTimestamp),
      )
        .to.emit(marketplace, "NewOffer")
        .withArgs(
          expectedListingId,
          buyers[0].address,
          ListingType.Direct,
          qtyWanted,
          offerAmount,
          weth.address,
          expirationTimestamp,
        );

      // token ownership & WETH balance is out of users wallet
      currentTokenOwner = await erc721token.ownerOf(expectedTokenId);
      currentWETHBalance = await weth.balanceOf(buyers[0].address);
      expect(currentTokenOwner).to.eq(lister.address);
      expect(currentWETHBalance).to.eq(offerAmount);

      // lister accept offer & release the NFT to offeror
      const listerBalanceBefore = await lister.getBalance();
      // const feeRecipientBalanceBefore = await feeCollector.getBalance();
      await expect(
        marketplace.connect(lister).acceptOffer(expectedListingId, buyers[0].address, weth.address, pricePerToken),
      )
        .to.emit(marketplace, "NewSale")
        .withArgs(expectedListingId, erc721token.address, lister.address, buyers[0].address, qtyWanted, offerAmount);

      // check balance & token ownership after accept offer
      const listerBalanceAfter = await lister.getBalance();
      // const feeRecipientBalanceAfter = await feeCollector.getBalance();
      const platformFee = offerAmount.mul(MARKETPLACE_FEE).div(MAX_BPS);
      expect(listerBalanceAfter.sub(listerBalanceBefore)).to.below(offerAmount.sub(platformFee)); // bias cause by gas fee
      // expect(feeRecipientBalanceAfter.sub(feeRecipientBalanceBefore)).to.eq(platformFee);
      currentWETHBalance = await weth.balanceOf(buyers[0].address);
      expect(currentWETHBalance).to.eq(0);
      expect(await erc721token.ownerOf(expectedTokenId)).to.eq(buyers[0].address);
    });

    it("should not able to accept offer if expired", async () => {
      // calculate amount need to wrap
      const pricePerToken = utils.parseEther("100");
      const qtyWanted = 1;
      const offerAmount = pricePerToken.mul(qtyWanted);

      // wrap 100 ETH
      await weth.connect(buyers[0]).deposit({ value: offerAmount });

      // approve & make offer with expired timestamp
      const expirationTimestamp = 0;
      await weth.connect(buyers[0]).approve(marketplace.address, offerAmount);
      await expect(
        marketplace
          .connect(buyers[0])
          .offer(expectedListingId, qtyWanted, NATIVE_TOKEN, pricePerToken, expirationTimestamp),
      )
        .to.emit(marketplace, "NewOffer")
        .withArgs(
          expectedListingId,
          buyers[0].address,
          ListingType.Direct,
          qtyWanted,
          offerAmount,
          weth.address,
          expirationTimestamp,
        );

      // lister attemp accept the expired offer expected to be reverted
      await expect(
        marketplace.connect(lister).acceptOffer(expectedListingId, buyers[0].address, weth.address, pricePerToken),
      ).to.revertedWith("EXPIRED");
    });
  });

  describe("Marketplace: auction listing", async () => {
    // let sampleAuctionParams: IMarketplace.ListingParametersStruct;
    let expectedTokenId: BigNumber;
    let expectedListingId: BigNumber;
    let expectedStartTimestamp: number;

    before("shoulb be able to create auction listing by token owner", async () => {
      const currentTimestamp = await getTimestamp();
      expectedStartTimestamp = currentTimestamp + DELAY_PERIOD;

      // mint & approve the token
      expectedTokenId = await erc721token.nextTokenIdToMint();
      await erc721token.connect(artist).mint(lister.address, 1);
      await erc721token.connect(lister).setApprovalForAll(marketplace.address, true);

      // create auction listing
      expectedListingId = await marketplace.totalListings();
      const listParams = {
        ...sampleListingParams,
        tokenId: expectedTokenId,
        startTime: expectedStartTimestamp,
        listingType: ListingType.Auction,
      };
      await marketplace.connect(lister).createListing(listParams);

      // mine blocks
      await mine(DELAY_PERIOD);
      snapshot = await takeSnapshot();
    });

    afterEach(async () => await snapshot.restore());

    it("checking...", async () => {
      const [
        listingId,
        tokenOwner,
        assetContract,
        tokenId,
        startTime,
        endTime,
        quantity,
        currency,
        reservePricePerToken,
        buyoutPricePerToken,
        tokenType,
        listingType,
      ] = await marketplace.listings(expectedListingId);
      expect(listingId).to.eq(expectedListingId);
      expect(tokenOwner).to.eq(lister.address);
      expect(assetContract).to.eq(erc721token.address);
      expect(tokenId).to.eq(expectedTokenId);
      expect(startTime).to.eq(expectedStartTimestamp);
      expect(endTime).to.eq(expectedStartTimestamp + ONE_DAY);
      expect(quantity).to.eq(sampleListingParams.quantityToList);
      expect(currency).to.eq(sampleListingParams.currencyToAccept);
      expect(reservePricePerToken).to.eq(sampleListingParams.reservePricePerToken);
      expect(buyoutPricePerToken).to.eq(sampleListingParams.buyoutPricePerToken);
      expect(tokenType).to.eq(TokenType.ERC721);
      expect(listingType).to.eq(ListingType.Auction);
    });

    it("should be able to bid an existing auction with acceptable price from any buyer", async () => {
      // bidding state with anonymous function
      let offerPricePerToken: BigNumber;
      let qtyWanted: number;
      let buyer: SignerWithAddress;
      const bid = async () => {
        const buyerBalance = await buyer.getBalance();
        const expirationTimestamp = ethers.constants.MaxUint256;
        const attachedDeposit = offerPricePerToken.mul(qtyWanted);
        await marketplace
          .connect(buyer)
          .offer(expectedListingId, qtyWanted, NATIVE_TOKEN, offerPricePerToken, expirationTimestamp, {
            value: attachedDeposit,
          });

        // check bidding state
        const [listingID, offeror, qty, currency, pricePerToken, expirationTime] = await marketplace.winningBid(
          expectedListingId,
        );
        // const gasPrice = await ethers.provider.getGasPrice();
        expect(await buyer.getBalance()).to.below(buyerBalance.sub(attachedDeposit));
        expect(listingID).to.eq(expectedListingId);
        expect(offeror).to.eq(buyer.address);
        expect(qty).to.eq(qtyWanted);
        expect(currency).to.eq(NATIVE_TOKEN);
        expect(pricePerToken).to.eq(offerPricePerToken);
        expect(expirationTime).to.eq(expirationTimestamp);
      };

      // get marketplace bid buffer in BPS unit
      const bidBufferBps = await marketplace.bidBufferBps();

      // buyer1 bid
      buyer = buyers[0];
      offerPricePerToken = utils.parseEther("10");
      qtyWanted = 1;
      await bid();

      // buyer2 bid
      buyer = buyers[1];
      const buffer = offerPricePerToken.mul(bidBufferBps).div(MAX_BPS);
      offerPricePerToken = offerPricePerToken.add(buffer);
      qtyWanted = 1;
      await bid();
    });

    it("should be able to close the auction with the buyout price", async () => {
      // check token ownership & marketplace escrow balance
      let currentTokenOwner = await erc721token.ownerOf(expectedTokenId);
      let currentWETHBalance = await weth.balanceOf(marketplace.address);
      expect(currentTokenOwner).to.eq(marketplace.address);
      expect(currentWETHBalance).to.eq(0);

      // buy out the token & transfer NFT to buyer
      const expirationTimestamp = ethers.constants.MaxUint256;
      const qtyWanted = 1;
      const attachedDeposit = buyoutPrice.mul(qtyWanted);
      await expect(
        marketplace
          .connect(buyers[0])
          .offer(expectedListingId, qtyWanted, NATIVE_TOKEN, buyoutPrice, expirationTimestamp, {
            value: attachedDeposit,
          }),
      )
        .to.emit(marketplace, "AuctionClosed")
        .withArgs(expectedListingId, buyers[0].address, false, lister.address, buyers[0].address);

      // check token ownership & marketplace escrow balance
      currentTokenOwner = await erc721token.ownerOf(expectedTokenId);
      currentWETHBalance = await weth.balanceOf(marketplace.address);
      expect(currentTokenOwner).to.eq(buyers[0].address);
      expect(currentWETHBalance).to.eq(attachedDeposit);

      // close auction & release the escrow balance for the lister
      const listerBalanceBefore = await lister.getBalance();
      const feeRecipientBalanceBefore = await feeCollector.getBalance();
      await expect(marketplace.connect(lister).closeAuction(expectedListingId, lister.address))
        .to.emit(marketplace, "AuctionClosed")
        .withArgs(expectedListingId, lister.address, false, lister.address, buyers[0].address);

      // check balance after release the escrow
      const listerBalanceAfter = await lister.getBalance();
      const feeRecipientBalanceAfter = await feeCollector.getBalance();
      const platformFee = attachedDeposit.mul(MARKETPLACE_FEE).div(MAX_BPS);
      expect(listerBalanceAfter.sub(listerBalanceBefore)).to.closeTo(
        attachedDeposit.sub(platformFee),
        utils.parseEther("0.00015"),
      ); // bias cause by gas fee
      expect(feeRecipientBalanceAfter.sub(feeRecipientBalanceBefore)).to.eq(platformFee);
      currentWETHBalance = await weth.balanceOf(marketplace.address);
      expect(currentWETHBalance).to.eq(0);
    });
  });
});

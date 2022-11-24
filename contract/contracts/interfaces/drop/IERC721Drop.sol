// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721Upgradeable.sol";

import "../IMetadata.sol";
import "./IClaimCondition.sol";

interface IERC721Drop is IMetadata, IERC721Upgradeable, IClaimCondition {
    /// @dev Emitted when tokens are claimed.
    event TokensClaimed(
        uint256 indexed claimConditionIndex,
        address indexed claimer,
        address indexed receiver,
        uint256 startTokenId,
        uint256 quantityClaimed
    );

    /// @dev Emitted when tokens are lazy minted.
    event TokensLazyMinted(uint256 startTokenId, uint256 endTokenId, string baseURI, bytes encryptedBaseURI);

    /// @dev Emitted when the URI for a batch of 'delayed-reveal' NFTs is revealed.
    event NFTRevealed(uint256 startTokenId, uint256 endTokenId, string revealedURI);

    // /// @dev Emitted when new claim conditions are set.
    // event ClaimConditionsUpdated(bytes[] claimConditions);

    /// @dev Emitted when the global max supply of tokens is updated.
    event MaxTotalSupplyUpdated(uint256 maxTotalSupply);

    /// @dev Emitted when the wallet claim count for an address is updated.
    event WalletClaimCountUpdated(address indexed wallet, uint256 count);

    /// @dev Emitted when the global max wallet claim count is updated.
    event MaxWalletClaimCountUpdated(uint256 count);

    /// @dev Emitted when the claim conditions is updated.
    event ClaimConditionsUpdated(uint256 currentStartId, uint256 count, bool resetClaimEligibility);

    /**
     *  @notice Lets an account with `MINTER_ROLE` lazy mint 'n' NFTs.
     *          The URIs for each token is the provided `_baseURIForTokens` + `{tokenId}`.
     *
     *  @param amount           The amount of NFTs to lazy mint.
     *  @param baseURIForTokens The URI for the NFTs to lazy mint. If lazy minting
     *                           'delayed-reveal' NFTs, the is a URI for NFTs in the
     *                           un-revealed state.
     *  @param encryptedBaseURI If lazy minting 'delayed-reveal' NFTs, this is the
     *                           result of encrypting the URI of the NFTs in the revealed
     *                           state.
     */
    function lazyMint(
        uint256 amount,
        string calldata baseURIForTokens,
        bytes calldata encryptedBaseURI
    ) external;

    /**
     *  @notice Lets an account claim a given quantity of NFTs.
     *
     *  @param receiver                       The receiver of the NFTs to claim.
     *  @param quantity                       The quantity of NFTs to claim.
     *  @param currency                       The currency in which to pay for the claim.
     *  @param pricePerToken                  The price per token to pay for the claim.
     *  @param proofs                         The proof of the claimer's inclusion in the merkle root allowlist
     *                                        of the claim conditions that apply.
     *  @param proofMaxAllowance   (Optional) The maximum number of NFTs an address included in an
     *                                        allowlist can claim.
     */
    function claim(
        address receiver,
        uint256 quantity,
        address currency,
        uint256 pricePerToken,
        bytes32[] calldata proofs,
        uint256 proofMaxAllowance
    ) external payable;

    /**
     *  @notice Lets a contract admin (account with `DEFAULT_ADMIN_ROLE`) set claim conditions.
     *
     *  @param phases                Claim conditions in ascending order by `startTimestamp`.
     *  @param resetClaimEligibility Whether to reset `limitLastClaimTimestamp` and
     *                               `limitMerkleProofClaim` values when setting new
     *                               claim conditions.
     */
    function setClaimConditions(ClaimCondition[] calldata phases, bool resetClaimEligibility) external;
}   
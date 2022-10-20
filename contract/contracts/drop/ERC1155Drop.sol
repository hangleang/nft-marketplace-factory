// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;

//  ==========  External imports    ==========
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

// Access Control + security
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

// Utils
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/BitMapsUpgradeable.sol";
// import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

//  ==========  Internal imports    ==========
import "../interfaces/drop/IERC1155Drop.sol";

import "../extensions/upgradeable/PlatformFeeUpgradeable.sol";
import "../extensions/upgradeable/PrimarySaleUpgradeable.sol";
import "../extensions/upgradeable/RoyaltyUpgradeable.sol";
import "../extensions/upgradeable/OpenseaCompUpgradeable.sol";

import "../base/ERC2771ContextUpgradeable.sol";
import "../lib/CurrencyTransferLib.sol";
import "../lib/FeeType.sol";
import "../lib/MerkleProof.sol";

/**
 * @dev ERC1155Drop contract definition
 * Initializable: a base contract to aid in writing UPGRADEABLE contracts
 * IERC1155Drop: ERC1155Drop contract interface which contains data structs, event definitions, functions signature
 * ERC1155Upgradeable: Non-Fungible Token Standard
 * ReentrancyGuardUpgradeable: prevent reentrant calls to a function
 * ERC2771ContextUpgradeable: support for meta transactions, useful for onboarding new users mint, list NFT without upfront gas
 * MulticallUpgradeable: batch together multiple calls in a single external call
 * AccessControlEnumerableUpgradeable: implement role-based access control mechanisms, more robust than Ownable
 * PlatformFee, PrimarySale, Royalty & OpenseaComp: as extensions
 */
contract ERC1155Drop is 
    Initializable,
    IERC1155Drop,
    ERC1155Upgradeable,
    ReentrancyGuardUpgradeable,
    ERC2771ContextUpgradeable,
    MulticallUpgradeable,
    AccessControlEnumerableUpgradeable,
    PlatformFeeUpgradeable,
    PrimarySaleUpgradeable,
    RoyaltyUpgradeable,
    OpenseaCompUpgradeable
{
    using BitMapsUpgradeable for BitMapsUpgradeable.BitMap;
    using StringsUpgradeable for uint256;

    /*///////////////////////////////////////////////////////////////
                            State variables
    //////////////////////////////////////////////////////////////*/

    bytes32 private constant CONTRACT_TYPE = bytes32("ERC1155Drop");
    uint256 private constant VERSION = 1;
    
    /// @dev Contract level metadata.
    string public contractURI;

    /// @dev Token name
    string public name;

    /// @dev Token symbol
    string public symbol;

    /// @dev Only TRANSFER_ROLE holders can have tokens transferred from or to them, during restricted transfers.
    bytes32 private constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");
    /// @dev Only MINTER_ROLE holders can sign off on `MintRequest`s.
    bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Max BPS
    uint256 private constant MAX_BPS = 10_000;

    /// @dev The next token ID of the NFT to "lazy mint".
    uint256 public nextTokenIdToMint;

    /// @dev Largest tokenId of each batch of tokens with the same baseURI
    uint256[] public baseURIIndices;

    
    /**
     *  @dev Mapping from 'Largest tokenId of a batch of tokens with the same baseURI'
     *       to base URI for the respective batch of tokens.
     **/
    mapping(uint256 => string) private baseURI;

    /// @dev Mapping from token ID => total circulating supply of tokens with that ID.
    mapping(uint256 => uint256) public totalSupply;

    /// @dev Mapping from token ID => maximum possible total circulating supply of tokens with that ID.
    mapping(uint256 => uint256) public maxTotalSupply;

    /// @dev Mapping from token ID => the set of all claim conditions, at any given moment, for tokens of the token ID.
    mapping(uint256 => ClaimConditionList) public claimCondition;

    /// @dev Mapping from token ID => the address of the recipient of primary sales.
    mapping(uint256 => address) public saleRecipient;

    /// @dev Mapping from token ID => claimer wallet address => total number of NFTs of the token ID a wallet has claimed.
    mapping(uint256 => mapping(address => uint256)) public walletClaimCount;

    /// @dev Mapping from token ID => the max number of NFTs of the token ID a wallet can claim.
    mapping(uint256 => uint256) public maxWalletClaimCount;

    /*///////////////////////////////////////////////////////////////
                    Modifiers
    //////////////////////////////////////////////////////////////*/

    modifier isValidBPS(uint256 _bps) override(PlatformFeeUpgradeable, RoyaltyUpgradeable) {
        require(_bps <= MAX_BPS, ">MAX_BPS");
        _;
    }

    /*///////////////////////////////////////////////////////////////
                    Constructor + initializer logic
    //////////////////////////////////////////////////////////////*/

    /// @dev Initiliazes the contract, like a constructor.
    function initialize(
        address _defaultAdmin,
        string memory _name,
        string memory _symbol,
        string memory _contractURI,
        address[] memory _trustedForwarders,
        address _primarySaleRecipient,
        address _royaltyRecipient,
        uint128 _royaltyBps,
        uint128 _platformFeeBps,
        address _platformFeeRecipient
    ) external initializer {
        // Initialize inherited contracts, most base-like -> most derived.
        __ReentrancyGuard_init();
        __ERC2771Context_init_unchained(_trustedForwarders);
        __ERC1155_init_unchained("");
        __OpenseaComp_init_unchained(_defaultAdmin);
        __PlatformFee_init_unchained(_platformFeeRecipient, _platformFeeBps);
        __PrimarySale_init_unchained(_primarySaleRecipient);
        __Royalty_init(_royaltyRecipient, _royaltyBps);

        // Initialize this contract's state.
        name = _name;
        symbol = _symbol;
        contractURI = _contractURI;

        // Initialize roles
        _setupRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
        _setupRole(MINTER_ROLE, _defaultAdmin);
        _setupRole(TRANSFER_ROLE, _defaultAdmin);
        _setupRole(TRANSFER_ROLE, address(0));
    }


    /*///////////////////////////////////////////////////////////////
                        Generic contract logic
    //////////////////////////////////////////////////////////////*/

    /// @dev Returns the module type of the contract.
    function contractType() external override pure returns (bytes32) {
        return CONTRACT_TYPE;
    }

    /// @dev Returns the version of the contract.
    function contractVersion() external override pure returns (uint8) {
        return uint8(VERSION);
    }

    /// @dev Lets a module admin set the URI for contract-level metadata.
    function setContractURI(string calldata _uri) external override onlyRole(DEFAULT_ADMIN_ROLE) {
        contractURI = _uri;
    }

    /*///////////////////////////////////////////////////////////////
                        ERC1155 Drop logic
    //////////////////////////////////////////////////////////////*/

    /// @dev Returns the URI for a given tokenId.
    function uri(uint256 _tokenId) public view override returns (string memory) {
        for (uint256 i = 0; i < baseURIIndices.length; i += 1) {
            if (_tokenId < baseURIIndices[i]) {
                return string(abi.encodePacked(baseURI[baseURIIndices[i]], _tokenId.toString()));
            }
        }

        return "";
    }

    /**
     *  @dev Lets an account with `MINTER_ROLE` lazy mint 'n' NFTs.
     *       The URIs for each token is the provided `_baseURIForTokens` + `{tokenId}`.
     */
    function lazyMint(uint256 _amount, string calldata _baseURIForTokens) external onlyRole(MINTER_ROLE) {
        uint256 startId = nextTokenIdToMint;
        uint256 baseURIIndex = startId + _amount;

        nextTokenIdToMint = baseURIIndex;
        baseURI[baseURIIndex] = _baseURIForTokens;
        baseURIIndices.push(baseURIIndex);

        emit TokensLazyMinted(startId, startId + _amount - 1, _baseURIForTokens);
    }

    /// @dev Lets a token owner burn the tokens they own (i.e. destroy for good)
    function burn( 
        address account,
        uint256 id,
        uint256 value
    ) public virtual {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "!APPROVED"
        );
        _burn(account, id, value);
    }

     /// @dev Lets a token owner burn multiple tokens they own at once (i.e. destroy for good)
    function burnBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory values
    ) public virtual {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "!APPROVED"
        );

        _burnBatch(account, ids, values);
    }

    /*///////////////////////////////////////////////////////////////
                            Claim logic
    //////////////////////////////////////////////////////////////*/

     /// @dev Lets an account claim a given quantity of NFTs, of a single tokenId.
    function claim(
        address _receiver,
        uint256 _tokenId,
        uint256 _quantity,
        address _currency,
        uint256 _pricePerToken,
        bytes32[] calldata _proofs,
        uint256 _proofMaxQuantityPerTransaction
    ) external payable nonReentrant {
        require(isTrustedForwarder(msg.sender) || _msgSender() == tx.origin, "BOT");

        // Get the active claim condition index.
        uint256 activeConditionId = getActiveClaimConditionId(_tokenId);

        /**
         *  We make allowlist checks (i.e. verifyClaimMerkleProof) before verifying the claim's general
         *  validity (i.e. verifyClaim) because we give precedence to the check of allow list quantity
         *  restriction over the check of the general claim condition's quantityLimitPerTransaction
         *  restriction.
         */

        // Verify inclusion in allowlist.
        (bool validMerkleProof, ) = verifyClaimMerkleProof(
            activeConditionId,
            _msgSender(),
            _tokenId,
            _quantity,
            _proofs,
            _proofMaxQuantityPerTransaction
        );

        // Verify claim validity. If not valid, revert.
        // when there's allowlist present --> verifyClaimMerkleProof will verify the _proofMaxQuantityPerTransaction value with hashed leaf in the allowlist
        // when there's no allowlist, this check is true --> verifyClaim will check for _quantity being less/equal than the limit
        bool toVerifyMaxQuantityPerTransaction = _proofMaxQuantityPerTransaction == 0 ||
            claimCondition[_tokenId].phases[activeConditionId].merkleRoot == bytes32(0);
        verifyClaim(
            activeConditionId,
            _msgSender(),
            _tokenId,
            _quantity,
            _currency,
            _pricePerToken,
            toVerifyMaxQuantityPerTransaction
        );

        if (validMerkleProof && _proofMaxQuantityPerTransaction > 0) {
            /**
             *  Mark the claimer's use of their position in the allowlist. A spot in an allowlist
             *  can be used only once.
             */
            claimCondition[_tokenId].limitMerkleProofClaim[activeConditionId].set(uint256(uint160(_msgSender())));
        }

        // If there's a price, collect price.
        _collectClaimPrice(_quantity, _currency, _pricePerToken, _tokenId);

        // Mint the relevant tokens to claimer.
        _transferClaimedTokens(_receiver, activeConditionId, _tokenId, _quantity);

        emit TokensClaimed(activeConditionId, _tokenId, _msgSender(), _receiver, _quantity);
    }

     /// @dev Lets a contract admin (account with `DEFAULT_ADMIN_ROLE`) set claim conditions, for a tokenId.
    function setClaimConditions(
        uint256 _tokenId,
        ClaimCondition[] calldata _phases,
        bool _resetClaimEligibility
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        ClaimConditionList storage condition = claimCondition[_tokenId];
        uint256 existingStartIndex = condition.currentStartId;
        uint256 existingPhaseCount = condition.count;

        /**
         *  `limitLastClaimTimestamp` and `limitMerkleProofClaim` are mappings that use a
         *  claim condition's UID as a key.
         *
         *  If `_resetClaimEligibility == true`, we assign completely new UIDs to the claim
         *  conditions in `_phases`, effectively resetting the restrictions on claims expressed
         *  by `limitLastClaimTimestamp` and `limitMerkleProofClaim`.
         */
        uint256 newStartIndex = existingStartIndex;
        if (_resetClaimEligibility) {
            newStartIndex = existingStartIndex + existingPhaseCount;
        }

        condition.count = _phases.length;
        condition.currentStartId = newStartIndex;

        uint256 lastConditionStartTimestamp;
        for (uint256 i = 0; i < _phases.length; i++) {
            require(
                i == 0 || lastConditionStartTimestamp < _phases[i].startTimestamp,
                "startTimestamp must be in ascending order."
            );

            uint256 supplyClaimedAlready = condition.phases[newStartIndex + i].supplyClaimed;
            require(supplyClaimedAlready <= _phases[i].maxClaimableSupply, "max supply claimed already");

            condition.phases[newStartIndex + i] = _phases[i];
            condition.phases[newStartIndex + i].supplyClaimed = supplyClaimedAlready;

            lastConditionStartTimestamp = _phases[i].startTimestamp;
        }

        /**
         *  Gas refunds (as much as possible)
         *
         *  If `_resetClaimEligibility == true`, we assign completely new UIDs to the claim
         *  conditions in `_phases`. So, we delete claim conditions with UID < `newStartIndex`.
         *
         *  If `_resetClaimEligibility == false`, and there are more existing claim conditions
         *  than in `_phases`, we delete the existing claim conditions that don't get replaced
         *  by the conditions in `_phases`.
         */
        if (_resetClaimEligibility) {
            for (uint256 i = existingStartIndex; i < newStartIndex; i++) {
                delete condition.phases[i];
                delete condition.limitMerkleProofClaim[i];
            }
        } else {
            if (existingPhaseCount > _phases.length) {
                for (uint256 i = _phases.length; i < existingPhaseCount; i++) {
                    delete condition.phases[newStartIndex + i];
                    delete condition.limitMerkleProofClaim[newStartIndex + i];
                }
            }
        }

        emit ClaimConditionsUpdated(_tokenId, _phases);
    }

    /// @dev Checks a request to claim NFTs against the active claim condition's criteria.
    function verifyClaim(
        uint256 _conditionId,
        address _claimer,
        uint256 _tokenId,
        uint256 _quantity,
        address _currency,
        uint256 _pricePerToken,
        bool verifyMaxQuantityPerTransaction
    ) public view {
        ClaimCondition memory currentClaimPhase = claimCondition[_tokenId].phases[_conditionId];

        require(
            _currency == currentClaimPhase.currency && _pricePerToken == currentClaimPhase.pricePerToken,
            "!CRYPTO"
        );

        // If we're checking for an allowlist quantity restriction, ignore the general quantity restriction.
        require(
            _quantity > 0 &&
                (!verifyMaxQuantityPerTransaction || _quantity <= currentClaimPhase.quantityLimitPerTransaction),
            "!QTY"
        );
        require(
            currentClaimPhase.supplyClaimed + _quantity <= currentClaimPhase.maxClaimableSupply,
            ">MAX_MINT"
        );
        require(
            maxTotalSupply[_tokenId] == 0 || totalSupply[_tokenId] + _quantity <= maxTotalSupply[_tokenId], 
            ">MAX_SUP"
        );
        require(
            maxWalletClaimCount[_tokenId] == 0 ||
                walletClaimCount[_tokenId][_claimer] + _quantity <= maxWalletClaimCount[_tokenId],
            ">LIMIT"
        );

        (uint256 lastClaimTimestamp, uint256 nextValidClaimTimestamp) = getClaimTimestamp(_tokenId, _conditionId, _claimer);
        require(lastClaimTimestamp == 0 || block.timestamp >= nextValidClaimTimestamp, "!TIME");
    }

    /// @dev Checks whether a claimer meets the claim condition's allowlist criteria.
    function verifyClaimMerkleProof(
        uint256 _conditionId,
        address _claimer,
        uint256 _tokenId,
        uint256 _quantity,
        bytes32[] calldata _proofs,
        uint256 _proofMaxQuantityPerTransaction
    ) public view returns (bool validMerkleProof, uint256 merkleProofIndex) {
        ClaimCondition memory currentClaimPhase = claimCondition[_tokenId].phases[_conditionId];

        if (currentClaimPhase.merkleRoot != bytes32(0)) {
            (validMerkleProof, merkleProofIndex) = MerkleProof.verify(
                _proofs,
                currentClaimPhase.merkleRoot,
                keccak256(abi.encodePacked(_claimer, _proofMaxQuantityPerTransaction))
            );
            require(validMerkleProof, "!PROOF");
            require(
                !claimCondition[_tokenId].limitMerkleProofClaim[_conditionId].get(uint256(uint160(_claimer))),
                "CLAIMED"
            );
            require(
                _proofMaxQuantityPerTransaction == 0 || _quantity <= _proofMaxQuantityPerTransaction,
                "!PROOFS"
            );
        }
    }

    /*///////////////////////////////////////////////////////////////
                        Getter functions
    //////////////////////////////////////////////////////////////*/

    /// @dev At any given moment, returns the uid for the active claim condition, for a given tokenId.
    function getActiveClaimConditionId(uint256 _tokenId) public view returns (uint256) {
        ClaimConditionList storage conditionList = claimCondition[_tokenId];
        for (uint256 i = conditionList.currentStartId + conditionList.count; i > conditionList.currentStartId; i--) {
            if (block.timestamp >= conditionList.phases[i - 1].startTimestamp) {
                return i - 1;
            }
        }

        revert("!CONDITION.");
    }

    /// @dev Returns the timestamp for when a claimer is eligible for claiming NFTs again.
    function getClaimTimestamp(uint256 _tokenId, uint256 _conditionId, address _claimer)
        public
        view
        returns (uint256 lastClaimTimestamp, uint256 nextValidClaimTimestamp)
    {
        lastClaimTimestamp = claimCondition[_tokenId].limitLastClaimTimestamp[_conditionId][_claimer];

        unchecked {
            nextValidClaimTimestamp =
                lastClaimTimestamp +
                claimCondition[_tokenId].phases[_conditionId].waitTimeInSecondsBetweenClaims;

            if (nextValidClaimTimestamp < lastClaimTimestamp) {
                nextValidClaimTimestamp = type(uint256).max;
            }
        }
    }

    /// @dev Returns the claim condition at the given uid.
    function getClaimConditionById(uint256 _tokenId, uint256 _conditionId) external view returns (ClaimCondition memory condition) {
        condition = claimCondition[_tokenId].phases[_conditionId];
    }

    /*///////////////////////////////////////////////////////////////
                        Setter functions
    //////////////////////////////////////////////////////////////*/

     /// @dev Lets a contract admin set a claim count for a wallet.
    function setWalletClaimCount(
        uint256 _tokenId,
        address _claimer,
        uint256 _count
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        walletClaimCount[_tokenId][_claimer] = _count;
        emit WalletClaimCountUpdated(_tokenId, _claimer, _count);
    }

    /// @dev Lets a contract admin set a maximum number of NFTs of a tokenId that can be claimed by any wallet.
    function setMaxWalletClaimCount(uint256 _tokenId, uint256 _count) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxWalletClaimCount[_tokenId] = _count;
        emit MaxWalletClaimCountUpdated(_tokenId, _count);
    }

    /// @dev Lets a module admin set a max total supply for token.
    function setMaxTotalSupply(uint256 _tokenId, uint256 _maxTotalSupply) external onlyRole(DEFAULT_ADMIN_ROLE) {
        maxTotalSupply[_tokenId] = _maxTotalSupply;
        emit MaxTotalSupplyUpdated(_tokenId, _maxTotalSupply);
    }

    /// @dev Lets a contract admin set the recipient for all primary sales.
    function setSaleRecipientForToken(uint256 _tokenId, address _saleRecipient) external onlyRole(DEFAULT_ADMIN_ROLE) {
        saleRecipient[_tokenId] = _saleRecipient;
        emit SaleRecipientForTokenUpdated(_tokenId, _saleRecipient);
    }

    /*///////////////////////////////////////////////////////////////
                        Internal Functions
    //////////////////////////////////////////////////////////////*/

    
    /// @dev Collects and distributes the primary sale value of NFTs being claimed.
    function _collectClaimPrice(
        uint256 _quantityToClaim,
        address _currency,
        uint256 _pricePerToken,
        uint256 _tokenId
    ) internal {
        if (_pricePerToken == 0) {
            return;
        }

        uint256 totalPrice = _quantityToClaim * _pricePerToken;
        uint256 platformFees = (totalPrice * platformFeeBps()) / MAX_BPS;

        if (_currency == CurrencyTransferLib.NATIVE_TOKEN) {
            require(msg.value == totalPrice, "<VALUE");
        }

        address recipient = saleRecipient[_tokenId] == address(0) ? primarySaleRecipient() : saleRecipient[_tokenId];

        CurrencyTransferLib.transferCurrency(_currency, _msgSender(), platformFeeRecipient(), platformFees);
        CurrencyTransferLib.transferCurrency(_currency, _msgSender(), recipient, totalPrice - platformFees);
    }

    /// @dev Transfers the NFTs being claimed.
    function _transferClaimedTokens(
        address _to,
        uint256 _conditionId,
        uint256 _tokenId,
        uint256 _quantityBeingClaimed
    ) internal {
        // Update the supply minted under mint condition.
        claimCondition[_tokenId].phases[_conditionId].supplyClaimed += _quantityBeingClaimed;

        // if transfer claimed tokens is called when `to != msg.sender`, it'd use msg.sender's limits.
        // behavior would be similar to `msg.sender` mint for itself, then transfer to `_to`.
        claimCondition[_tokenId].limitLastClaimTimestamp[_conditionId][_msgSender()] = block.timestamp;
        walletClaimCount[_tokenId][_msgSender()] += _quantityBeingClaimed;

        _mint(_to, _tokenId, _quantityBeingClaimed, "");
    }

    /*///////////////////////////////////////////////////////////////
                        Low-level overrides 
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev See {ERC1155-_beforeTokenTransfer}.
     */
    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        // if transfer is restricted on the contract, we still want to allow burning and minting
        if (!hasRole(TRANSFER_ROLE, address(0)) && from != address(0) && to != address(0)) {
            require(hasRole(TRANSFER_ROLE, from) || hasRole(TRANSFER_ROLE, to), "!ACCESS");
        }

        if (from == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                totalSupply[ids[i]] += amounts[i];
            }
        }

        if (to == address(0)) {
            for (uint256 i = 0; i < ids.length; ++i) {
                totalSupply[ids[i]] -= amounts[i];
            }
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlEnumerableUpgradeable, RoyaltyUpgradeable, ERC1155Upgradeable, IERC165Upgradeable)
        returns (bool)
    {
        return
            super.supportsInterface(interfaceId);
    }

    function _msgSender()
        internal
        view
        virtual
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (address sender)
    {
        return ERC2771ContextUpgradeable._msgSender();
    }

    function _msgData()
        internal
        view
        virtual
        override(ContextUpgradeable, ERC2771ContextUpgradeable)
        returns (bytes calldata)
    {
        return ERC2771ContextUpgradeable._msgData();
    }
}
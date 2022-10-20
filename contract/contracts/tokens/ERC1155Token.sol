// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.11;

//  ==========  External imports    ==========
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";

// Signature utils
import "@openzeppelin/contracts-upgradeable/utils/cryptography/ECDSAUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/EIP712Upgradeable.sol";

// Access Control + security
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

// Utils
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";

//  ==========  Internal imports    ==========
import "../interfaces/tokens/IERC1155Token.sol";

import "../extensions/upgradeable/PlatformFeeUpgradeable.sol";
import "../extensions/upgradeable/PrimarySaleUpgradeable.sol";
import "../extensions/upgradeable/RoyaltyUpgradeable.sol";
import "../extensions/upgradeable/OpenseaCompUpgradeable.sol";

import "../base/ERC2771ContextUpgradeable.sol";
import "../lib/CurrencyTransferLib.sol";
import "../lib/FeeType.sol";

/**
 * @dev ERC1155Token contract definition
 * Initializable: a base contract to aid in writing UPGRADEABLE contracts
 * IERC1155Token: ERC1155 contract interface which contains data structs, event definitions, functions signature
 * ReentrancyGuardUpgradeable: prevent reentrant calls to a function
 * ERC2771ContextUpgradeable: support for meta transactions, useful for onboarding new users mint, list NFT without upfront gas
 * MulticallUpgradeable: batch together multiple calls in a single external call
 * AccessControlEnumerableUpgradeable: implement role-based access control mechanisms, more robust than Ownable
 * EIP712Upgradeable: a standard for hashing and signing of typed structured data
 * ERC1155Upgradeable: the basic standard multi-token
 * PlatformFee, PrimarySale, Royalty & OpenseaComp: as extensions
 */
contract ERC1155Token is
    Initializable,
    IERC1155Token,
    ReentrancyGuardUpgradeable,
    ERC2771ContextUpgradeable,
    MulticallUpgradeable,
    AccessControlEnumerableUpgradeable,
    EIP712Upgradeable,
    ERC1155Upgradeable,
    PlatformFeeUpgradeable,
    PrimarySaleUpgradeable,
    RoyaltyUpgradeable,
    OpenseaCompUpgradeable
{
    using ECDSAUpgradeable for bytes32;
    using StringsUpgradeable for uint256;

    /*///////////////////////////////////////////////////////////////
                            State variables
    //////////////////////////////////////////////////////////////*/

    bytes32 private constant CONTRACT_TYPE = bytes32("ERC1155Token");
    uint256 private constant VERSION = 1;

    /// @dev Contract level metadata.
    string public contractURI;

    /// @dev Token name
    string public name;

    /// @dev Token symbol
    string public symbol;

    bytes32 private constant TYPEHASH =
        keccak256(
            "MintRequest(address to,address royaltyRecipient,uint256 royaltyBps,address primarySaleRecipient,uint256 tokenId,string uri,uint256 quantity,uint256 pricePerToken,address currency,uint128 validityStartTimestamp,uint128 validityEndTimestamp,bytes32 uid)"
        );

    /// @dev Only TRANSFER_ROLE holders can have tokens transferred from or to them, during restricted transfers.
    bytes32 private constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");
    /// @dev Only MINTER_ROLE holders can sign off on `MintRequest`s.
    bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Max BPS
    uint256 private constant MAX_BPS = 10_000;

    /// @dev The next token ID of the NFT to mint.
    uint256 public nextTokenIdToMint;

    /// @dev Mapping from mint request UID => whether the mint request is processed.
    mapping(bytes32 => bool) private minted;

    mapping(uint256 => string) private _tokenURI;

    /// @dev Token ID => total circulating supply of tokens with that ID.
    mapping(uint256 => uint256) public totalSupply;

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
        __EIP712_init_unchained("ERC1155Token", "1");
        __ERC1155_init_unchained("");
        __OpenseaComp_init_unchained(_defaultAdmin);
        __PlatformFee_init_unchained(_platformFeeRecipient, _platformFeeBps);
        __PrimarySale_init_unchained(_primarySaleRecipient);
        __Royalty_init_unchained(_royaltyRecipient, _royaltyBps);

        // Initialize this contract's state.
        name = _name;
        symbol = _symbol;
        contractURI = _contractURI;

        // Initialize roles
        // _owner = _defaultAdmin;
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
                        ERC1155 logic
    //////////////////////////////////////////////////////////////*/

    /// @dev Returns the URI for a tokenId
    function uri(uint256 _tokenId) public view override returns (string memory) {
        return _tokenURI[_tokenId];
    }

    /// @dev Lets an account with MINTER_ROLE mint an NFT.
    function mintTo(
        address _to,
        uint256 _tokenId,
        string calldata _uri,
        uint256 _amount
    ) external onlyRole(MINTER_ROLE) {
        uint256 tokenIdToMint;
        if (_tokenId == type(uint256).max) {
            tokenIdToMint = nextTokenIdToMint;
            nextTokenIdToMint += 1;
        } else {
            require(_tokenId < nextTokenIdToMint, "!ID");
            tokenIdToMint = _tokenId;
        }

        // `_mintTo` is re-used. `mintTo` just adds a minter role check.
        _mintTo(_to, _uri, tokenIdToMint, _amount);
    }

    /// @dev Lets a token owner burn the tokens they own (i.e. destroy for good)
    function burn(
        address account,
        uint256 id,
        uint256 value
    ) public virtual {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: !APPROVED"
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
            "ERC1155: !APPROVED"
        );

        _burnBatch(account, ids, values);
    }

    /// @dev Mints an NFT according to the provided mint request.
    function mintWithSignature(MintRequest calldata _req, bytes calldata _signature) external payable nonReentrant {
        address signer = verifyRequest(_req, _signature);
        address receiver = _req.to;

        uint256 tokenIdToMint;
        if (_req.tokenId == type(uint256).max) {
            tokenIdToMint = nextTokenIdToMint;
            nextTokenIdToMint += 1;
        } else {
            require(_req.tokenId < nextTokenIdToMint, "!ID");
            tokenIdToMint = _req.tokenId;
        }

        if (_req.royaltyRecipient != address(0)) {
            setRoyaltyInfoForToken(tokenIdToMint, _req.royaltyRecipient, _req.royaltyBps);
        }

        _mintTo(receiver, _req.uri, tokenIdToMint, _req.quantity);
        _collectPrice(_req);

        emit TokensMintedWithSignature(signer, receiver, tokenIdToMint, _req);
    }

    /// @dev Verifies that a mint request is valid.
    function verifyRequest(MintRequest calldata _req, bytes calldata _signature) internal returns (address) {
        (bool success, address signer) = verify(_req, _signature);
        require(success, "!SIGNATURE");

        require(
            _req.validityStartTimestamp <= block.timestamp && _req.validityEndTimestamp >= block.timestamp,
            "EXPIRED"
        );
        require(_req.to != address(0), "!RECIPIENT");
        require(_req.quantity > 0, "!QTY");

        minted[_req.uid] = true;

        return signer;
    }

    /// @dev Verifies that a mint request is signed by an account holding MINTER_ROLE (at the time of the function call).
    function verify(MintRequest calldata _req, bytes calldata _signature) public view returns (bool, address) {
        address signer = _recoverAddress(_req, _signature);
        return (!minted[_req.uid] && hasRole(MINTER_ROLE, signer), signer);
    }

    /*///////////////////////////////////////////////////////////////
                        Internal functions
    //////////////////////////////////////////////////////////////*/

    /// @dev Mints an NFT to `to`
    function _mintTo(
        address _to,
        string calldata _uri,
        uint256 _tokenId,
        uint256 _amount
    ) internal {
        if (bytes(_tokenURI[_tokenId]).length == 0) {
            require(bytes(_uri).length > 0, "!URI");
            _tokenURI[_tokenId] = _uri;
        }

        _mint(_to, _tokenId, _amount, "");

        emit TokensMinted(_to, _tokenId, _uri, _amount);
    }

    /// @dev Collects and distributes the primary sale value of tokens being claimed.
    function _collectPrice(MintRequest calldata _req) internal {
        if (_req.pricePerToken == 0) {
            return;
        }

        uint256 totalPrice = _req.pricePerToken * _req.quantity;
        uint256 platformFees = (totalPrice * platformFeeBps()) / MAX_BPS;

        if (_req.currency == CurrencyTransferLib.NATIVE_TOKEN) {
            require(msg.value == totalPrice, "!ENOUGH");
        } else {
            require(msg.value == 0, "!VALUE");
        }

        address saleRecipient = _req.primarySaleRecipient == address(0)
            ? primarySaleRecipient()
            : _req.primarySaleRecipient;

        CurrencyTransferLib.transferCurrency(_req.currency, _msgSender(), platformFeeRecipient(), platformFees);
        CurrencyTransferLib.transferCurrency(_req.currency, _msgSender(), saleRecipient, totalPrice - platformFees);
    }

    /// @dev Returns the address of the signer of the mint request.
    function _recoverAddress(MintRequest calldata _req, bytes calldata _signature) internal view returns (address) {
        return _hashTypedDataV4(keccak256(_encodeRequest(_req))).recover(_signature);
    }
    
    /// @dev Resolves 'stack too deep' error in `recoverAddress`.
    function _encodeRequest(MintRequest calldata _req) internal pure returns (bytes memory) {
        return
            abi.encode(
                TYPEHASH,
                _req.to,
                _req.royaltyRecipient,
                _req.royaltyBps,
                _req.primarySaleRecipient,
                _req.tokenId,
                keccak256(bytes(_req.uri)),
                _req.quantity,
                _req.pricePerToken,
                _req.currency,
                _req.validityStartTimestamp,
                _req.validityEndTimestamp,
                _req.uid
            );
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
            require(hasRole(TRANSFER_ROLE, from) || hasRole(TRANSFER_ROLE, to), "!TRANSFER_ROLE");
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
            super.supportsInterface(interfaceId) ||
            interfaceId == type(IERC1155Upgradeable).interfaceId;
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
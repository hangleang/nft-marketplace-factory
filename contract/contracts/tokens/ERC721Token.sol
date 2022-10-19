// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

//  ==========  External imports    ==========
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";

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
import "../interfaces/tokens/IERC721Token.sol";

import "../extensions/upgradeable/PlatformFeeUpgradeable.sol";
import "../extensions/upgradeable/PrimarySaleUpgradeable.sol";
import "../extensions/upgradeable/RoyaltyUpgradeable.sol";
import "../extensions/upgradeable/OpenseaCompUpgradeable.sol";

import "../base/ERC2771ContextUpgradeable.sol";
import "../lib/CurrencyTransferLib.sol";
import "../lib/FeeType.sol";

/**
 * @dev ERC721Token contract definition
 * Initializable: a base contract to aid in writing UPGRADEABLE contracts
 * IERC721Token: ERC721 contract interface which contains data structs, event definitions, functions signature
 * ReentrancyGuardUpgradeable: prevent reentrant calls to a function
 * ERC2771ContextUpgradeable: support for meta transactions, useful for onboarding new users mint, list NFT without upfront gas
 * MulticallUpgradeable: batch together multiple calls in a single external call
 * AccessControlEnumerableUpgradeable: implement role-based access control mechanisms, more robust than Ownable
 * EIP712Upgradeable: a standard for hashing and signing of typed structured data
 * ERC721EnumerableUpgradeable: Non-Fungible Token Standard
 * PlatformFee, PrimarySale, Royalty & OpenseaComp: as extensions
 */
contract ERC721Token is 
    Initializable,
    IERC721Token,
    ReentrancyGuardUpgradeable,
    ERC2771ContextUpgradeable,
    MulticallUpgradeable,
    AccessControlEnumerableUpgradeable,
    EIP712Upgradeable,
    ERC721EnumerableUpgradeable,
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

    bytes32 private constant MODULE_TYPE = bytes32("ERC721Token");
    uint256 private constant VERSION = 1;
    
    /// @dev Contract level metadata.
    string public contractURI;

    bytes32 private constant TYPEHASH =
        keccak256(
            "MintRequest(address to,address royaltyRecipient,uint256 royaltyBps,address primarySaleRecipient,string uri,uint256 price,address currency,uint128 validityStartTimestamp,uint128 validityEndTimestamp,bytes32 uid)"
        );

    /// @dev Only TRANSFER_ROLE holders can have tokens transferred from or to them, during restricted transfers.
    bytes32 private constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");
    /// @dev Only MINTER_ROLE holders can sign off on `MintRequest`s.
    bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");

    /// @dev Max bps in the thirdweb system
    uint256 private constant MAX_BPS = 10_000;

    /// @dev The token ID of the next token to mint.
    uint256 public nextTokenIdToMint;

    /// @dev Mapping from mint request UID => whether the mint request is processed.
    mapping(bytes32 => bool) private minted;

    /// @dev Mapping from tokenId => URI
    mapping(uint256 => string) private uri;

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
        __EIP712_init_unchained("ERC721Token", "1");
        __ERC721_init_unchained(_name, _symbol);
        __OpenseaComp_init_unchained(_defaultAdmin);
        __PlatformFee_init_unchained(_platformFeeRecipient, _platformFeeBps);
        __PrimarySale_init_unchained(_primarySaleRecipient);
        __Royalty_init_unchained(_royaltyRecipient, _royaltyBps);

        // Initialize this contract's state.
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
        return MODULE_TYPE;
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
                        ERC721 logic
    //////////////////////////////////////////////////////////////*/

    /// @dev Returns the URI for a tokenId
    function tokenURI(uint256 _tokenId) public view override returns (string memory) {
        return uri[_tokenId];
    }

    /// @dev Lets an account with MINTER_ROLE mint an NFT.
    function mintTo(address _to, string calldata _uri) external onlyRole(MINTER_ROLE) returns (uint256) {
        // `_mintTo` is re-used. `mintTo` just adds a minter role check.
        return _mintTo(_to, _uri);
    }

    /// @dev Burns `tokenId`. See {ERC721-_burn}.
    function burn(uint256 tokenId) public virtual {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "!APPROVED");
        _burn(tokenId);
    }

    /// @dev Mints an NFT according to the provided mint request.
    function mintWithSignature(MintRequest calldata _req, bytes calldata _signature)
        external
        payable
        nonReentrant
        returns (uint256 tokenIdMinted)
    {
        address signer = verifyRequest(_req, _signature);
        address receiver = _req.to;

        tokenIdMinted = _mintTo(receiver, _req.uri);

        if (_req.royaltyRecipient != address(0)) {
            setRoyaltyInfoForToken(tokenIdMinted, _req.royaltyRecipient, _req.royaltyBps);
        }

        _collectPrice(_req);

        emit TokensMintedWithSignature(signer, receiver, tokenIdMinted, _req);
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

        minted[_req.uid] = true;

        return signer;
    }

    /// @dev Verifies that a mint request is signed by an account holding MINTER_ROLE (at the time of the function call).
    function verify(MintRequest calldata _req, bytes calldata _signature) public view returns (bool, address) {
        address signer = _recoverAddress(_req, _signature);
        return (!minted[_req.uid] && hasRole(MINTER_ROLE, signer), signer);
    }

    /*///////////////////////////////////////////////////////////////
                        Internal Functions
    //////////////////////////////////////////////////////////////*/

    /// @dev Mints an NFT to `to`
    function _mintTo(address _to, string calldata _uri) internal returns (uint256 tokenId) {
        tokenId = nextTokenIdToMint;
        nextTokenIdToMint += 1;

        require(bytes(_uri).length > 0, "!URI");
        uri[tokenId] = _uri;

        _safeMint(_to, tokenId);
        emit TokensMinted(_to, tokenId, _uri);
    }

    /// @dev Returns the address of the signer of the mint request.
    function _recoverAddress(MintRequest calldata _req, bytes calldata _signature) internal view returns (address) {
        return _hash(_req).recover(_signature);
    }

    /// @dev Return the digest hash of the mint request.
    function _hash(MintRequest calldata _req) internal view returns (bytes32 digest) {
        return _hashTypedDataV4(keccak256(_encodeRequest(_req)));
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
                keccak256(bytes(_req.uri)),
                _req.price,
                _req.currency,
                _req.validityStartTimestamp,
                _req.validityEndTimestamp,
                _req.uid
            );
    }

    function _collectPrice(MintRequest calldata _req) internal {
        if (_req.price == 0) {
            return;
        }

        uint256 totalPrice = _req.price;
        uint256 platformFee = (totalPrice * platformFeeBps()) / MAX_BPS;

        if (_req.currency == CurrencyTransferLib.NATIVE_TOKEN) {
            require(msg.value == totalPrice, "!ENOUGH");
        } else {
            require(msg.value == 0, "!VALUE");
        }

        address saleRecipient = _req.primarySaleRecipient == address(0)
            ? primarySaleRecipient()
            : _req.primarySaleRecipient;

        CurrencyTransferLib.transferCurrency(_req.currency, _msgSender(), platformFeeRecipient(), platformFee);
        CurrencyTransferLib.transferCurrency(_req.currency, _msgSender(), saleRecipient, totalPrice - platformFee);
    }

    /*///////////////////////////////////////////////////////////////
                        Low-level overrides 
    //////////////////////////////////////////////////////////////*/

    /// @dev See {ERC721-_beforeTokenTransfer}.
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721EnumerableUpgradeable) {
        super._beforeTokenTransfer(from, to, tokenId);

        // if transfer is restricted on the contract, we still want to allow burning and minting
        if (!hasRole(TRANSFER_ROLE, address(0)) && from != address(0) && to != address(0)) {
            require(hasRole(TRANSFER_ROLE, from) || hasRole(TRANSFER_ROLE, to), "restricted to TRANSFER_ROLE holders");
        }
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlEnumerableUpgradeable, RoyaltyUpgradeable, ERC721EnumerableUpgradeable, IERC165Upgradeable)
        returns (bool)
    {
        return
            super.supportsInterface(interfaceId) ||
            interfaceId == type(IERC721Upgradeable).interfaceId;
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
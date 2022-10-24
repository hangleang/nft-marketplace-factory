// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

//  ==========  External imports    ==========

import "@openzeppelin/contracts/proxy/beacon/UpgradeableBeacon.sol";
import "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

//  ==========  Internal imports    ==========

import "./interfaces/ITokenFactory.sol";
import "./extensions/PlatformFee.sol";

// token implemetations
import "./tokens/ERC721Token.sol";
import "./tokens/ERC1155Token.sol";
import "./drop/ERC721Drop.sol";
import "./drop/ERC1155Drop.sol";

/**
 * @dev TokenFactory contract definition
 * ITokenFactory: TokenFactory contract interface which contains data structs, event definitions, functions signature
 * ERC2771Context: support for meta transactions, useful for onboarding new users mint, list NFT without upfront gas
 * Multicall: batch together multiple calls in a single external call
 * AccessControlEnumerable: implement role-based access control mechanisms, more robust than Ownable
 * PlatformFee: extend to enable platform fee in marketplace
 */
contract TokenFactory is ITokenFactory, ERC2771Context, Multicall, AccessControlEnumerable, PlatformFee {
    /*///////////////////////////////////////////////////////////////
                            State variables
    //////////////////////////////////////////////////////////////*/

    /// @dev Only CREATOR_ROLE holders.
    bytes32 private constant CREATOR_ROLE = keccak256("CREATOR_ROLE");

    /// @dev The max bps of the contract. So, 10_000 == 100 %
    uint16 private constant MAX_BPS = 10_000;

    /// @dev Token Type => address of the token implemetation.
    mapping(TokenType => address) public tokenBeacons;

    /// @dev UID => address of the instance of token proxy
    mapping(uint256 => address) public tokens;

    /// @dev The UID of the next token proxy to be created
    uint256 public nextTokenUid;

    /// @dev array of trust forwarders
    address public trustedForwarder;

    /*///////////////////////////////////////////////////////////////
                    Modifiers
    //////////////////////////////////////////////////////////////*/

    modifier isValidBPS(uint256 _bps) override(PlatformFee) {
        require(_bps <= MAX_BPS, ">MAX_BPS");
        _;
    }

    /*///////////////////////////////////////////////////////////////
                    Constructor 
    //////////////////////////////////////////////////////////////*/

    constructor(address _trustedForwarder, uint256 _platformFeeBps, address _platformFeeRecipient) 
        ERC2771Context(_trustedForwarder) 
        PlatformFee(_platformFeeRecipient, uint128(_platformFeeBps)) 
    {
        // Initialize this contract's state.
        trustedForwarder = _trustedForwarder;
        tokenBeacons[TokenType.ERC721Token] = address(new UpgradeableBeacon(address(new ERC721Token())));
        tokenBeacons[TokenType.ERC1155Token] = address(new UpgradeableBeacon(address(new ERC1155Token())));
        tokenBeacons[TokenType.ERC721Drop] = address(new UpgradeableBeacon(address(new ERC721Drop())));
        tokenBeacons[TokenType.ERC1155Drop] = address(new UpgradeableBeacon(address(new ERC1155Drop())));

        // Initialize roles
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(CREATOR_ROLE, _msgSender());
        _setupRole(CREATOR_ROLE, address(0));
    }

    /*///////////////////////////////////////////////////////////////
                    External Functions 
    //////////////////////////////////////////////////////////////*/

    function newToken(
        TokenType tokenType,
        address _defaultAdmin,
        string memory _name,
        string memory _symbol,
        string memory _contractURI,
        address _primarySaleRecipient,
        address _royaltyRecipient,
        uint128 _royaltyBps
    ) external override returns (address token) {
        require(hasRole(CREATOR_ROLE, _msgSender()), "!CREATOR");

        bytes4 init_selector;
        if (tokenType == TokenType.ERC721Token) {
            init_selector = ERC721Token.initialize.selector;
        } else if (tokenType == TokenType.ERC1155Token) {
            init_selector = ERC1155Token.initialize.selector;
        } else if (tokenType == TokenType.ERC721Drop) {
            init_selector = ERC721Drop.initialize.selector;
        } else if (tokenType == TokenType.ERC1155Drop) {
            init_selector = ERC1155Drop.initialize.selector;
        } else {
            revert("!TOKEN_TYPE");
        }

        bytes memory data = abi.encodeWithSelector(
            init_selector,
            _defaultAdmin,
            _name,
            _symbol,
            _contractURI,
            [trustedForwarder],
            _primarySaleRecipient,
            _royaltyRecipient,
            _royaltyBps,
            platformFeeBps(),
            platformFeeRecipient()
        );

        token = _newToken(tokenType, data);
    }

    function newToken(TokenType tokenType, bytes calldata data) external override returns (address token) {
        require(hasRole(CREATOR_ROLE, _msgSender()), "!CREATOR");
        token = _newToken(tokenType, data);
    }

    /*///////////////////////////////////////////////////////////////
                    Internal + Low-level functions
    //////////////////////////////////////////////////////////////*/

    function _newToken(TokenType tokenType, bytes memory data) internal returns (address token) {
        uint256 uid = nextTokenUid;
        nextTokenUid += 1;

        BeaconProxy proxy = new BeaconProxy(tokenBeacons[tokenType], data);

        token = address(proxy);
        tokens[uid] = token;

        emit TokenCreated(tokenType, token);
    }

    function _msgSender() internal view virtual override(Context, ERC2771Context) returns (address sender) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}
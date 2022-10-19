// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

//  ==========  External imports    ==========

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

//  ==========  Internal imports    ==========

import "./interfaces/IContractFactory.sol";
import "./interfaces/IContractRegistry.sol"; // interface of the registry contract
import "./interfaces/IMetadata.sol"; // interface of the contract instance

/**
 * @dev ContractFactory contract definition
 * IContractFactory: ContractFactory contract interface which contains data structs, event definitions, functions signature
 * ERC2771Context: support for meta transactions, useful for onboarding new users mint, list NFT without upfront gas
 * Multicall: batch together multiple calls in a single external call
 * AccessControlEnumerable: implement role-based access control mechanisms, more robust than Ownable
 */
contract ContractFactory is IContractFactory, ERC2771Context, Multicall, AccessControlEnumerable {
    /*///////////////////////////////////////////////////////////////
                            State variables
    //////////////////////////////////////////////////////////////*/

    /// @dev Only FACTORY_ROLE holders can approve/unapprove implementations for proxies to point to.
    bytes32 public constant FACTORY_ROLE = keccak256("FACTORY_ROLE");

    /// @dev The contract registry address
    address public immutable registry;

    /// @dev mapping of implementation address to deployment approval
    mapping(address => bool) public approvals;

    /// @dev mapping of implementation address to implementation added version
    mapping(bytes32 => uint256) public currentVersion;

    /// @dev mapping of contract type to contract version to implementation address
    mapping(bytes32 => mapping(uint256 => address)) public implementations;

    /// @dev mapping of proxy address to deployer address
    mapping(address => address) public deployers;

    /*///////////////////////////////////////////////////////////////
                    Constructor 
    //////////////////////////////////////////////////////////////*/

    constructor(address _trustForwarder, address _registry) ERC2771Context(_trustForwarder) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(FACTORY_ROLE, _msgSender());

        registry = _registry;
    }

    /*///////////////////////////////////////////////////////////////
                    External Functions 
    //////////////////////////////////////////////////////////////*/

    /// @dev Deploys a proxy that points to the latest version of the given contract type.
    function deployProxy(bytes32 _type, bytes memory _data) external override returns (address) {
        bytes32 salt = bytes32(IContractRegistry(registry).count(_msgSender()));
        return deployProxyDeterministic(_type, _data, salt);
    }

    /**
     *  @dev Deploys a proxy at a deterministic address by taking in `salt` as a parameter.
     *       Proxy points to the latest version of the given contract type.
     */
    function deployProxyDeterministic(
        bytes32 _type,
        bytes memory _data,
        bytes32 _salt
    ) public override returns (address) {
        address _implementation = implementations[_type][currentVersion[_type]];
        return deployProxyByImplementation(_implementation, _data, _salt);
    }

    /// @dev Deploys a proxy that points to the given implementation.
    function deployProxyByImplementation(
        address _implementation,
        bytes memory _data,
        bytes32 _salt
    ) public override returns (address deployedProxy) {
        require(approvals[_implementation], "!APPROVED");

        bytes32 salthash = keccak256(abi.encodePacked(_msgSender(), _salt));
        deployedProxy = Clones.cloneDeterministic(_implementation, salthash);

        deployers[deployedProxy] = _msgSender();

        emit ProxyDeployed(_implementation, deployedProxy, _msgSender());

        IContractRegistry(registry).add(_msgSender(), deployedProxy);

        if (_data.length > 0) {
            // slither-disable-next-line unused-return
            Address.functionCall(deployedProxy, _data);
        }
    }

    /// @dev Lets a contract admin set the address of a contract type x version.
    function addImplementation(address _implementation) external override {
        require(hasRole(FACTORY_ROLE, _msgSender()), "!ACCESS");

        IMetadata module = IMetadata(_implementation);

        bytes32 contractType = module.contractType();
        require(contractType.length > 0, "INVALID");

        uint8 version = module.contractVersion();
        uint8 currentVersionOfType = uint8(currentVersion[contractType]);
        require(version >= currentVersionOfType, "!VERSION");

        currentVersion[contractType] = version;
        implementations[contractType][version] = _implementation;
        approvals[_implementation] = true;

        emit ImplementationAdded(_implementation, contractType, version);
    }

    /// @dev Lets a contract admin approve a specific contract for deployment.
    function approveImplementation(address _implementation, bool _toApprove) external override {
        require(hasRole(FACTORY_ROLE, _msgSender()), "not admin.");

        approvals[_implementation] = _toApprove;

        emit ImplementationApproved(_implementation, _toApprove);
    }

    /*///////////////////////////////////////////////////////////////
                    Getter Functions 
    //////////////////////////////////////////////////////////////*/

    /// @dev Returns the implementation given a contract type and version.
    function getImplementation(bytes32 _type, uint256 _version) external view override returns (address) {
        return implementations[_type][_version];
    }

    /// @dev Returns the latest implementation given a contract type.
    function getLatestImplementation(bytes32 _type) external view override returns (address) {
        return implementations[_type][currentVersion[_type]];
    }

    /*///////////////////////////////////////////////////////////////
                    Internal + Low-level functions
    //////////////////////////////////////////////////////////////*/

    function _msgSender() internal view virtual override(Context, ERC2771Context) returns (address sender) {
        return ERC2771Context._msgSender();
    }

    function _msgData() internal view virtual override(Context, ERC2771Context) returns (bytes calldata) {
        return ERC2771Context._msgData();
    }
}
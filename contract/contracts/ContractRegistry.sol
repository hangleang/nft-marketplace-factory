// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

//  ==========  External imports    ==========

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Multicall.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";

//  ==========  Internal imports    ==========

import "./interfaces/IContractRegistry.sol";

/**
 * @dev ContractRegistry contract definition
 * IContractRegistry: ContractRegistry contract interface which contains data structs, event definitions, functions signature
 * ERC2771Context: support for meta transactions, useful for onboarding new users mint, list NFT without upfront gas
 * Multicall: batch together multiple calls in a single external call
 * AccessControlEnumerable: implement role-based access control mechanisms, more robust than Ownable
 */
contract ContractRegistry is IContractRegistry, ERC2771Context, Multicall, AccessControlEnumerable {
    using EnumerableSet for EnumerableSet.AddressSet;

    /*///////////////////////////////////////////////////////////////
                            State variables
    //////////////////////////////////////////////////////////////*/

    /// @dev Only REGISTRAR_ROLE holders can add/remove deployments of the proxy contract.
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");

    /// @dev Deployer address => List of deployment addresses
    mapping(address => EnumerableSet.AddressSet) private _deployments;

    /*///////////////////////////////////////////////////////////////
                    Constructor 
    //////////////////////////////////////////////////////////////*/

    constructor(address _trustForwarder) ERC2771Context(_trustForwarder) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(REGISTRAR_ROLE, _msgSender());
    }

    /*///////////////////////////////////////////////////////////////
                    External Functions 
    //////////////////////////////////////////////////////////////*/

    function add(
        address _deployer,
        address _deployment
    ) external override {
        require(hasRole(REGISTRAR_ROLE, _msgSender()) || _deployer == _msgSender(), "!REGISTRAR");

        bool added = _deployments[_deployer].add(_deployment);
        require(added, "FAILED");

        emit Added(_deployer, _deployment);
    }

    function remove(
        address _deployer,
        address _deployment
    ) external override {
        require(hasRole(REGISTRAR_ROLE, _msgSender()) || _deployer == _msgSender(), "!REGISTRAR");

        bool removed = _deployments[_deployer].remove(_deployment);
        require(removed, "FAILED");

        emit Deleted(_deployer, _deployment);
    }

    /*///////////////////////////////////////////////////////////////
                    Getter Functions 
    //////////////////////////////////////////////////////////////*/

    function getDeployments(address _deployer) external view override returns (address[] memory deployments) {
        return _deployments[_deployer].values();
    }

    function count(address _deployer) external view override returns (uint256 deploymentCount) {
        return _deployments[_deployer].length();
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
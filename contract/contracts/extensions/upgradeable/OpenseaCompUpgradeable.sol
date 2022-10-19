// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "../interfaces/IOpenseaComp.sol";

abstract contract OpenseaCompUpgradeable is IOpenseaComp, Initializable, AccessControlEnumerableUpgradeable {
    /// @dev Owner of the contract (purpose: OpenSea compatibility, etc.)
    address private _owner;

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    function __OpenseaComp_init(address _admin) internal onlyInitializing {
        __OpenseaComp_init_unchained(_admin);
    }

    function __OpenseaComp_init_unchained(address _admin) internal onlyInitializing {
        _setOwner(_admin);
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view override virtual returns (address) {
        return hasRole(DEFAULT_ADMIN_ROLE, _owner) ? _owner : address(0);
    }

    /**
     * @dev Lets a module admin set a new owner for the contract. The new owner must be a module admin.
     * Can only be called by the module owner.
     */
    function setOwner(address _newOwner) public override virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _setOwner(_newOwner);
    }

    /**
     * @dev Lets a module admin set a new owner for the contract. The new owner must be a module admin.
     * Internal function without access restriction.
     */
    function _setOwner(address _newOwner) internal virtual {
        require(hasRole(DEFAULT_ADMIN_ROLE, _newOwner), "!ADMIN_ROLE");
        address _prevOwner = _owner;
        _owner = _newOwner;

        emit OwnerUpdated(_prevOwner, _newOwner);
    }
}
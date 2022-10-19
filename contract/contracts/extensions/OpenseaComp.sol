// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

import "./interfaces/IOpenseaComp.sol";

abstract contract OpenseaComp is IOpenseaComp, AccessControlEnumerable {
    /// @dev Owner of the contract (purpose: OpenSea compatibility, etc.)
    address private _owner;

    constructor(address _admin) {
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
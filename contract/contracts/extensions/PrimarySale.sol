// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

import "./interfaces/IPrimarySale.sol";

abstract contract PrimarySale is IPrimarySale, AccessControlEnumerable {
    /// @dev The adress that receives all primary sales value.
    address private _primarySaleRecipient;
    
    constructor(address _saleRecipient) {
        _setPrimarySaleRecipient(_saleRecipient);
    }

    /**
     * @dev Returns the address of the primary sale recipient.
     */
    function primarySaleRecipient() public view override virtual returns (address) {
        return _primarySaleRecipient;
    }

    /**
     * @dev Lets a module admin set the default recipient of all primary sales.
     * Can only be called by the module owner.
     */
    function setPrimarySaleRecipient(address _saleRecipient) public override virtual onlyRole(DEFAULT_ADMIN_ROLE) {
        _setPrimarySaleRecipient(_saleRecipient);
    }

    /**
     * @dev Lets a module admin set the default recipient of all primary sales.
     * Internal function without access restriction.
     */
    function _setPrimarySaleRecipient(address _saleRecipient) internal virtual {
        _primarySaleRecipient = _saleRecipient;
        emit PrimarySaleRecipientUpdated(_saleRecipient);
    }
}
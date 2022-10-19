// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "../interfaces/IPrimarySale.sol";

abstract contract PrimarySaleUpgradeable is IPrimarySale, Initializable, AccessControlEnumerableUpgradeable {
    /// @dev The adress that receives all primary sales value.
    address private _primarySaleRecipient;

    /**
     * @dev Initializes the contract setting the given address as primarySaleRecipient.
     */
    function __PrimarySale_init(address _saleRecipient) internal onlyInitializing {
        __PrimarySale_init_unchained(_saleRecipient);
    }

    function __PrimarySale_init_unchained(address _saleRecipient) internal onlyInitializing {
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
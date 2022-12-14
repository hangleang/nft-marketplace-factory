// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

import "../interfaces/IPlatformFee.sol";

abstract contract PlatformFeeUpgradeable is IPlatformFee, Initializable, AccessControlEnumerableUpgradeable {
    /// @dev Max BPS
    uint256 private constant MAX_BPS = 10_000;

    /// @dev The adress that receives all primary sales value.
    address private _platformFeeRecipient;

    /// @dev The % of primary sales collected by the contract as fees.
    uint128 private _platformFeeBps;


    /*///////////////////////////////////////////////////////////////
                    Modifiers
    //////////////////////////////////////////////////////////////*/

    modifier isValidBPS(uint256 _bps) virtual {
        require(_bps <= MAX_BPS, ">MAX_BPS");
        _;
    }

    /**
     * @dev Initializes the contract setting the given args as platform fee info.
     */
    function __PlatformFee_init(address _recipient, uint128 _bps) internal onlyInitializing {
        __PlatformFee_init_unchained(_recipient, _bps);
    }

    function __PlatformFee_init_unchained(address _recipient, uint128 _bps) internal onlyInitializing {
        _setPlatformFeeInfo(_recipient, _bps);
    }

    /**
     * @dev Returns the address of the platform fee recipient.
     */
    function platformFeeRecipient() public view virtual returns (address) {
        return _platformFeeRecipient;
    }

    /**
     * @dev Returns the % of platform fee collected by the contract as fees.
     */
    function platformFeeBps() public view virtual returns (uint128) {
        return _platformFeeBps;
    }

    /// @dev Returns the platform fee bps and recipient.
    function getPlatformFeeInfo() external view override virtual returns (address, uint16) {
        return (_platformFeeRecipient, uint16(_platformFeeBps));
    }

    /// @dev Lets a module admin update the fees on primary sales.
    function setPlatformFeeInfo(address _recipient, uint256 _bps) 
        external override virtual 
        onlyRole(DEFAULT_ADMIN_ROLE) 
    {
        _setPlatformFeeInfo(_recipient, uint128(_bps));
    }

    function _setPlatformFeeInfo(address _recipient, uint128 _bps) 
        internal virtual
        isValidBPS(_platformFeeBps)
    {
        _platformFeeBps = uint64(_bps);
        _platformFeeRecipient = _recipient;

        emit PlatformFeeInfoUpdated(_platformFeeRecipient, _platformFeeBps);
    }
}
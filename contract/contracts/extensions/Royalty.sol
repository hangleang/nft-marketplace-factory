// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

// Helper interfaces
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

import "./interfaces/IRoyalty.sol";

abstract contract Royalty is IRoyalty, AccessControlEnumerable {
    /// @dev Max BPS
    uint256 private constant MAX_BPS = 10_000;

    /// @dev The recipient of who gets the royalty.
    address private royaltyRecipient;

    /// @dev The percentage of royalty how much royalty in basis points.
    uint128 private royaltyBps;

    /// @dev Token ID => royalty recipient and bps for token
    mapping(uint256 => RoyaltyInfo) private royaltyInfoForToken;
    
    /*///////////////////////////////////////////////////////////////
                    Modifiers
    //////////////////////////////////////////////////////////////*/

    modifier isValidBPS(uint256 _bps) virtual {
        require(_bps <= MAX_BPS, ">MAX_BPS");
        _;
    }

    constructor(address _royaltyRecipient, uint128 _royaltyBps) {
        _setDefaultRoyaltyInfo(_royaltyRecipient, _royaltyBps);
    }

    /*///////////////////////////////////////////////////////////////
                        Setter functions
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Lets a module admin update the royalty bps and recipient.
     * Can only be called by the module owner.
     */
    function setDefaultRoyaltyInfo(address _royaltyRecipient, uint256 _royaltyBps)
        external
        override
        virtual
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _setDefaultRoyaltyInfo(_royaltyRecipient, _royaltyBps);
    }

    /// @dev Lets a module admin set the royalty recipient for a particular token Id.
    function setRoyaltyInfoForToken(
        uint256 _tokenId,
        address _recipient,
        uint256 _bps
    ) public override virtual onlyRole(DEFAULT_ADMIN_ROLE) isValidBPS(_bps) {
        royaltyInfoForToken[_tokenId] = RoyaltyInfo({ recipient: _recipient, bps: _bps });

        emit RoyaltyForToken(_tokenId, _recipient, _bps);
    }

    /*///////////////////////////////////////////////////////////////
                        Getter functions
    //////////////////////////////////////////////////////////////*/

    /// @dev Returns the platform fee bps and recipient.
    function getDefaultRoyaltyInfo() public view override virtual returns (address, uint16) {
        return (royaltyRecipient, uint16(royaltyBps));
    }

    /// @dev Returns the royalty recipient for a particular token Id.
    function getRoyaltyInfoForToken(uint256 _tokenId) public view override virtual returns (address, uint16) {
        RoyaltyInfo memory royaltyForToken = royaltyInfoForToken[_tokenId];

        return
            royaltyForToken.recipient == address(0)
                ? (royaltyRecipient, uint16(royaltyBps))
                : (royaltyForToken.recipient, uint16(royaltyForToken.bps));
    }

    /// @dev See EIP-2981
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        override
        virtual
        returns (address receiver, uint256 royaltyAmount)
    {
        (address recipient, uint256 bps) = getRoyaltyInfoForToken(tokenId);
        receiver = recipient;
        royaltyAmount = (salePrice * bps) / MAX_BPS;
    }

    /**
     * @dev Lets a module admin update the royalty bps and recipient.
     * Internal function without access restriction.
     */
    function _setDefaultRoyaltyInfo(address _royaltyRecipient, uint256 _royaltyBps) internal virtual isValidBPS(_royaltyBps) {
        royaltyRecipient = _royaltyRecipient;
        royaltyBps = uint128(_royaltyBps);

        emit DefaultRoyalty(_royaltyRecipient, _royaltyBps);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlEnumerable, IERC165)
        returns (bool)
    {
        return
            super.supportsInterface(interfaceId) ||
            interfaceId == type(IERC2981).interfaceId;
    }
}
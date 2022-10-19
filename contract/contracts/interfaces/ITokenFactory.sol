// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../extensions/interfaces/IPlatformFee.sol";

interface ITokenFactory is IPlatformFee {
    enum TokenType {
        ERC721Token,
        ERC1155Token,
        ERC721Drop,
        ERC1155Drop
    }

    event TokenCreated(TokenType tokenType, address token);

    function newToken(
        TokenType tokenType, 
        address _defaultAdmin,
        string memory _name,
        string memory _symbol,
        string memory _contractURI,
        address _primarySaleRecipient,
        address _royaltyRecipient,
        uint128 _royaltyBps
    ) external returns (address token);

    function newToken(TokenType tokenType, bytes calldata data) external returns (address token);
}
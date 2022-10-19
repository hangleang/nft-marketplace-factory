// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.0;

import './BatchMintMetadata.sol';
import './interfaces/ILazyMint.sol';

abstract contract LazyMint is ILazyMint, BatchMintMetadata {
    /// @notice The tokenId assigned to the next new NFT to be lazy minted.
    uint256 internal nextTokenIdToLazyMint;

    function lazyMint(
        uint256 _amount,
        string calldata _baseURIForTokens,
        bytes calldata _extraData
    ) public virtual override returns (uint256 batchId) {
        require(_canLazyMint(), "!AUTH");
        require(_amount != 0, "!AMOUNT");

        uint256 startId = nextTokenIdToLazyMint;
        (nextTokenIdToLazyMint, batchId) = _batchMintMetadata(startId, _amount, _baseURIForTokens);

        emit TokensLazyMinted(startId, startId + _amount - 1, _baseURIForTokens, _extraData);
        return batchId;
    }

    /// @dev Returns whether lazy minting can be performed in the given execution context.
    function _canLazyMint() internal view virtual returns (bool);
}
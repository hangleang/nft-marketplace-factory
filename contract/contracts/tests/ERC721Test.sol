// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

contract ERC721Test is ERC721Burnable {
    uint256 public nextTokenIdToMint;

    constructor() ERC721("ERC721Test", "TEST721") {}

    function mint(address _receiver, uint256 _amount) external {
        uint256 tokenId = nextTokenIdToMint;
        nextTokenIdToMint += _amount;

        for (uint256 i = 0; i < _amount; i += 1) {
            _mint(_receiver, tokenId);
            tokenId += 1;
        }
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
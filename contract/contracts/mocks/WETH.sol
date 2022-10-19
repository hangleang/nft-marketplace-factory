// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WETH is ERC20 {
    event Deposit(address indexed account, uint256 amount);
    event Withdrawal(address indexed account, uint256 amount);

    constructor() ERC20("Wrapped Ether", "WETH, 18") {}

    receive() external payable {
      deposit();
    }
    
    function deposit() public payable {
      _mint(msg.sender, msg.value);
      emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 _amount) public {
      _burn(msg.sender, _amount);
      // solhint-disable-next-line avoid-low-level-calls
      (bool success,) = msg.sender.call{value: _amount}("");
      require(success, "transfer failed");
      emit Withdrawal(msg.sender, _amount);
    }
}
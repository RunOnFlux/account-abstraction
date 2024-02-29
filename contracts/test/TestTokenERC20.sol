// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestTokenERC20 is ERC20 {
    constructor(string memory name_, string memory symbol_, uint256 amount_) ERC20(name_, symbol_) {
        _mint(msg.sender, amount_);
    }
}

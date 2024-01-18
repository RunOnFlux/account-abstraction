// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract MultiOwnable {
    // Events
    event OwnershipGranted(address newOwner);
    event OwnershipRevoked(address revokedOwner);

    mapping(address account => bool) public owners;

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    function _onlyOwner() internal view virtual {
        require(owners[msg.sender], "only owner");
    }

    function grantOwnership(address newOwner) public onlyOwner {
        owners[newOwner] = true;

        emit OwnershipGranted(newOwner);
    }

    function revokeOwnership(address owner) public onlyOwner {
        owners[owner] = false;

        emit OwnershipRevoked(owner);
    }
}

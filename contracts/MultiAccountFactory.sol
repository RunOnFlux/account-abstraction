// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

import {MultiAccount} from "./MultiAccount.sol";

contract MultiAccountFactory {
    MultiAccount public immutable accountImplementation;
    event AccountCreated(address indexed account, address indexed owner, uint salt);

    constructor(address entryPointAddress, address[] memory combinedPubKeys) {
        accountImplementation = new MultiAccount(entryPointAddress, combinedPubKeys);
    }

    function createAccount(address owner, uint256 salt) public returns (MultiAccount ret) {
        address addr = getAddress(owner, salt);
        uint codeSize = addr.code.length;
        if (codeSize > 0) {
            return MultiAccount(payable(addr));
        }
        ret = MultiAccount(
            payable(
                new ERC1967Proxy{salt: bytes32(salt)}(
                    address(accountImplementation),
                    abi.encodeCall(MultiAccount.initialize, (owner))
                )
            )
        );
        emit AccountCreated(address(ret), owner, salt);
    }

    /**
     * calculate the address of this account as it would be returned by createAccount()
     */
    function getAddress(address owner, uint256 salt) public view returns (address) {
        return
            Create2.computeAddress(
                bytes32(salt),
                keccak256(
                    abi.encodePacked(
                        type(ERC1967Proxy).creationCode,
                        abi.encode(address(accountImplementation), abi.encodeCall(MultiAccount.initialize, (owner)))
                    )
                )
            );
    }
}

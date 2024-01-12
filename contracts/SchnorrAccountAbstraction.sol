// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import {Schnorr} from "./Schnorr.sol";

contract SchnorrAccountAbstraction is Schnorr {
    bytes4 internal constant ERC1271_MAGICVALUE_BYTES32 = 0x1626ba7e;

    mapping(address => bytes32) public signers;

    // add the combined multisig key on deploy
    constructor(address[] memory addrs) {
        uint len = addrs.length;
        for (uint i = 0; i < len; i++) {
            signers[addrs[i]] = bytes32(uint(1));
        }
    }

    function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4) {
        if (signers[_verifySchnorr(hash, signature)] != bytes32(0)) {
            return ERC1271_MAGICVALUE_BYTES32;
        } else {
            return 0xffffffff;
        }
    }
}

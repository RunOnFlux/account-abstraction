// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {MultiOwnable} from "./MultiOwnable.sol";
import {Schnorr} from "./Schnorr.sol";

contract MultiAccount is MultiOwnable, Schnorr, Initializable {
    bytes4 internal constant ERC1271_MAGICVALUE_BYTES32 = 0x1626ba7e;

    address private immutable _entryPoint; //TODO replace address with IEntryPoint
    mapping(address => bytes32) public signers;

    // add the combined multisig key on deploy
    constructor(address entryPointAddress, address[] memory combinedPubKeys) {
        _entryPoint = entryPointAddress;
        // schnorr signature signers
        uint len = combinedPubKeys.length;
        for (uint i = 0; i < len; i++) {
            signers[combinedPubKeys[i]] = bytes32(uint(1));
        }
    }

    /**
     * @dev The _entryPoint member is immutable, to reduce gas consumption.
     * To upgrade EntryPoint a new implementation of SimpleAccount must be deployed with the new EntryPoint address, then upgrading
     * the implementation by calling `upgradeTo()`
     */
    function initialize(address anOwner) public virtual initializer {
        _initialize(anOwner);
    }

    function _initialize(address anOwner) internal virtual {
        owners[anOwner] = true;
    }

    function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4) {
        if (signers[_verifySchnorr(hash, signature)] != bytes32(0)) {
            return ERC1271_MAGICVALUE_BYTES32;
        } else {
            return 0xffffffff;
        }
    }
}

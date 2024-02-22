// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import {IEntryPoint} from "../erc4337/interfaces/IEntryPoint.sol";
import {UserOperation} from "../erc4337/core/UserOperation.sol";

interface IMultiSigSmartAccount {
    event TestUserOp(UserOperation op);
    event TestHash(bytes32 userOpHash, bytes32 _hash);
    event TestRecovered(bool signer, address recovered);
    event TestSignature(bytes opSignature);
    event SimpleAccountInitialized(IEntryPoint indexed entryPoint, address indexed owner);
}

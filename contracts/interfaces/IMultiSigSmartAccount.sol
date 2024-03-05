// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import {IEntryPoint} from "../erc4337/interfaces/IEntryPoint.sol";
import {UserOperation} from "../erc4337/core/UserOperation.sol";

interface IMultiSigSmartAccount {
    error MsgSenderNotThisAccount(address msgSender);
    error NeitherOwnerNorEntryPoint(address msgSender);
    error OwnerNotDefined();

    event MultiSigAccountInitialized(IEntryPoint entryPoint, uint256 pubKeysCounter);
}

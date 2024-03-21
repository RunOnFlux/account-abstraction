// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import {Create2} from "@openzeppelin/contracts/utils/Create2.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {MultiSigSmartAccount} from "./MultiSigSmartAccount.sol";
import {IEntryPoint} from "./erc4337/interfaces/IEntryPoint.sol";
import {IMultiSigSmartAccountFactory} from "./interfaces/IMultiSigSmartAccountFactory.sol";

/**
 * @title MultiSigSmartAccountFactory
 * @notice The Factory contract for MultiSigSmartAccount.
 * An UserOperations "initCode" holds the address of the factory and a method call (to `createAccount`).
 * The factory's `createAccount` returns the target account address even if it is already deployed.
 * This way the entryPoint.getSenderAddress() can be called either before or after the account is created.
 */
contract MultiSigSmartAccountFactory is IMultiSigSmartAccountFactory {
    MultiSigSmartAccount public immutable accountImplementation;

    /**
     * @dev account implemetation address is deterministic
     * see: https://docs.soliditylang.org/en/develop/control-structures.html#salted-contract-creations-create2
     */
    constructor(IEntryPoint _entryPoint, bytes32 _salt) {
        accountImplementation = new MultiSigSmartAccount{salt: bytes32(_salt)}(_entryPoint);
    }

    /**
     * Create an account and return its address.
     * Returns the address even if the account is already deployed.
     * @dev Note that during UserOperation execution, this method is called only if the account is not deployed.
     * This method returns an existing account address so that entryPoint.getSenderAddress() would work even after account creation
     *
     * @param combinedAddress combined Schnorr signers' public addresses used as contract owners
     * @param salt salt
     */
    function createAccount(address[] memory combinedAddress, bytes32 salt) public returns (MultiSigSmartAccount ret) {
        address addr = getAccountAddress(combinedAddress, salt);
        uint codeSize = addr.code.length;
        if (codeSize > 0) {
            return MultiSigSmartAccount(payable(addr));
        }
        ret = MultiSigSmartAccount(
            payable(
                new ERC1967Proxy{salt: salt}(
                    address(accountImplementation),
                    abi.encodeCall(MultiSigSmartAccount.initialize, (combinedAddress))
                )
            )
        );
        emit MultiSigSmartAccountCreated(addr);
    }

    /**
     * Calculate the counterfactual address of this account as it would be returned by createAccount()
     * @param combinedAddress combined schnorr signers' public addresses
     * @param salt salt
     */
    function getAccountAddress(address[] memory combinedAddress, bytes32 salt) public view returns (address) {
        return
            Create2.computeAddress(
                salt,
                keccak256(
                    abi.encodePacked(
                        type(ERC1967Proxy).creationCode,
                        abi.encode(
                            address(accountImplementation),
                            abi.encodeCall(MultiSigSmartAccount.initialize, (combinedAddress))
                        )
                    )
                )
            );
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import {IERC1271} from "@openzeppelin/contracts/interfaces/IERC1271.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

import {IEntryPoint} from "./erc4337/interfaces/IEntryPoint.sol";
import {BaseAccount} from "./erc4337/core/BaseAccount.sol";
import {UserOperation, UserOperationLib} from "./erc4337/core/UserOperation.sol";
import {TokenCallbackHandler} from "./erc4337/utils/TokenCallbackHandler.sol";
import {Schnorr} from "./schnorr/Schnorr.sol";
import {IMultiSigSmartAccount} from "./interfaces/IMultiSigSmartAccount.sol";

/**
 * MultiSigSmartAccount
 * this contract was designed to integrate implementations of:
 * - ERC4337 Account Abstraction
 * - Schnorr signature verifications for multisig
 */
contract MultiSigSmartAccount is
    IMultiSigSmartAccount,
    BaseAccount,
    TokenCallbackHandler,
    UUPSUpgradeable,
    Initializable,
    AccessControl,
    Schnorr,
    IERC1271
{
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    bytes4 internal constant ERC1271_MAGICVALUE_BYTES32 = 0x1626ba7e;

    // AccessControl contract roles
    bytes32 public constant OWNER_ROLE = keccak256("OWNER_ROLE");
    bytes32 public constant SIGNER_ROLE = keccak256("SIGNER_ROLE");

    IEntryPoint private immutable _entryPoint;

    // solhint-disable-next-line no-empty-blocks
    receive() external payable {}

    constructor(IEntryPoint EntryPoint) {
        _entryPoint = EntryPoint;
        _disableInitializers();
    }

    /**
     * @dev The _entryPoint member is immutable, to reduce gas consumption.
     * To upgrade EntryPoint a new implementation of SimpleAccount must be deployed with the new EntryPoint address,
     * then upgrading the implementation by calling `upgradeTo()`
     */
    function initialize(address owner, address[] memory combinedPubKeys) public initializer {
        _grantRole(DEFAULT_ADMIN_ROLE, owner);
        _grantRole(OWNER_ROLE, owner);

        // grant signer role for every schnorr's combinedPubKey
        uint len = combinedPubKeys.length;
        for (uint i = 0; i < len; i++) {
            _grantRole(SIGNER_ROLE, combinedPubKeys[i]);
        }
        emit SimpleAccountInitialized(_entryPoint, owner);
    }

    /**
     * @dev execute a transaction (called directly from owner, or by entryPoint)
     *
     * @param dest destination address
     * @param value tx values
     * @param func tx data
     */
    function execute(address dest, uint256 value, bytes calldata func) external {
        _requireFromEntryPointOrOwner();
        _call(dest, value, func);
    }

    /**
     * @dev execute a sequence of transactions
     */
    function executeBatch(address[] calldata dest, bytes[] calldata func) external {
        _requireFromEntryPointOrOwner();
        require(dest.length == func.length, "wrong array lengths");
        for (uint256 i = 0; i < dest.length; i++) {
            _call(dest[i], 0, func[i]);
        }
    }

    /**
     * @dev The signature is valid if it is signed by the owner's private key
     * (if the owner is an EOA) or if it is a valid ERC-1271 signature from the
     * owner (if the owner is a contract). Note that unlike the signature
     * validation used in `validateUserOp`, this does **not** wrap the digest in
     * an "Ethereum Signed Message" envelope before checking the signature in
     * the EOA-owner case.
     * @inheritdoc IERC1271
     * @param hash hash to be signed
     * @param signature signature
     */
    function isValidSignature(bytes32 hash, bytes memory signature) public view override returns (bytes4) {
        address recovered = _verifySchnorr(hash, signature);
        if (hasRole(SIGNER_ROLE, recovered)) {
            return ERC1271_MAGICVALUE_BYTES32;
        } else {
            return 0xffffffff;
        }
    }

    /**
     * @dev Returns entryPoint
     * @inheritdoc BaseAccount
     */
    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    /**
     * withdraw value from the account's deposit
     * @param withdrawAddress target to send to
     * @param amount to withdraw
     */
    function withdrawDepositTo(address payable withdrawAddress, uint256 amount) public onlyRole(OWNER_ROLE) {
        entryPoint().withdrawTo(withdrawAddress, amount);
    }

    /**
     * deposit more funds for this account in the entryPoint
     */
    function addDeposit() public payable {
        entryPoint().depositTo{value: msg.value}(address(this));
    }

    /**
     * check current account deposit in the entryPoint
     */
    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    /**
     * Require the function call went through EntryPoint or owner
     */
    function _requireFromEntryPointOrOwner() internal view {
        require(
            msg.sender == address(entryPoint()) || hasRole(OWNER_ROLE, msg.sender),
            "account: not Owner or EntryPoint"
        );
    }

    /**
     * Validate the signature is valid for this message.
     * @inheritdoc BaseAccount
     */
    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        emit TestUserOp(userOp);

        address recovered = _verifySchnorr(userOpHash, userOp.signature);
        emit TestRecovered(hasRole(SIGNER_ROLE, recovered), recovered);
        if (!hasRole(SIGNER_ROLE, recovered)) return SIG_VALIDATION_FAILED;
        return 0;
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    /**
     * @dev See {UUPSUpgradeable}.
     * The {_authorizeUpgrade} function must be overridden to include access restriction to the upgrade mechanism.
     */
    function _authorizeUpgrade(address newImplementation) internal view override onlyRole(OWNER_ROLE) {
        (newImplementation);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     * The following functions are overrides required by Solidity.
     */
    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(AccessControl, TokenCallbackHandler) returns (bool) {
        return interfaceId == type(AccessControl).interfaceId || super.supportsInterface(interfaceId);
    }
}

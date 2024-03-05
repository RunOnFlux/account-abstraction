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
 * This contract was designed to integrate implementations of:
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
    function initialize(address[] memory combinedPubAddress) public initializer {
        // grant owner role for every schnorr's combinedPubKey
        uint256 len = combinedPubAddress.length;
        if (len == 0) revert OwnerNotDefined();
        for (uint8 i = 0; i < len; i++) {
            _grantRole(DEFAULT_ADMIN_ROLE, combinedPubAddress[i]);
            _grantRole(OWNER_ROLE, combinedPubAddress[i]);
        }
        emit MultiSigAccountInitialized(_entryPoint, combinedPubAddress.length);
    }

    /**
     * @dev execute a transaction (called directly from owner, or by entryPoint)
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
     * Withdraw value from the account's deposit
     * @param withdrawAddress target to send to
     * @param amount to withdraw
     */
    function withdrawDepositTo(address payable withdrawAddress, uint256 amount) public {
        _requireSelfCall();
        entryPoint().withdrawTo(withdrawAddress, amount);
    }

    /**
     * Deposit more funds for this account in the entryPoint
     */
    function addDeposit() public payable {
        entryPoint().depositTo{value: msg.value}(address(this));
    }

    /**
     * Check current account deposit in the entryPoint
     */
    function getDeposit() public view returns (uint256) {
        return entryPoint().balanceOf(address(this));
    }

    /**
     * @dev The signature is valid if it is signed by the owner's private key
     * (if the owner is an EOA) or if it is a valid ERC-1271 signature from the
     * owner (if the owner is a contract).
     * Note that unlike the signature validation used in `validateUserOp`, this
     * does **not** wrap the digest in an "Ethereum Signed Message" envelope
     * before checking the signature in the EOA-owner case.
     * @inheritdoc IERC1271
     * @param hash hash to be signed
     * @param signature signature
     */
    function isValidSignature(bytes32 hash, bytes memory signature) public view override returns (bytes4) {
        address recovered = _verifySchnorr(hash, signature);
        if (hasRole(OWNER_ROLE, recovered)) {
            return ERC1271_MAGICVALUE_BYTES32;
        } else {
            return 0xffffffff;
        }
    }

    /**
     * Returns entryPoint
     * @inheritdoc BaseAccount
     */
    function entryPoint() public view virtual override returns (IEntryPoint) {
        return _entryPoint;
    }

    /**
     * Validate the signature
     * @inheritdoc BaseAccount
     */
    function _validateSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) internal virtual override returns (uint256 validationData) {
        address recovered = _verifySchnorr(userOpHash, userOp.signature);
        if (!hasRole(OWNER_ROLE, recovered)) return SIG_VALIDATION_FAILED;
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
     * Require the function call is from this account
     * @dev Since there is no EOA Owner and this Account Abstraction (AA) is owned by
     * multiple Schnorr Signers (offchain ones), the only way to call functions
     * is to do it from AA address: address(this)
     */
    function _requireSelfCall() internal view {
        if (!(msg.sender == address(this))) revert MsgSenderNotThisAccount(msg.sender);
    }

    /**
     * Require the function call went through EntryPoint or owner
     */
    function _requireFromEntryPointOrOwner() internal view {
        if (!(msg.sender == address(entryPoint()) || hasRole(OWNER_ROLE, msg.sender)))
            revert NeitherOwnerNorEntryPoint(msg.sender);
    }

    /**
     * @dev The {_authorizeUpgrade} function must be overriddn to include access restriction to the upgrade mechanism.
     * @inheritdoc UUPSUpgradeable
     */
    function _authorizeUpgrade(address newImplementation) internal view override {
        _requireSelfCall();
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

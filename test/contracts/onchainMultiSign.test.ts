import { expect } from "chai"
import { ethers } from "ethers"
import { deployMultiSigSmartAccount } from "../utils/deployments"
import { MultiSigSmartAccount } from "../../src/typechain"
import { createRandomSchnorrSigner } from "../utils/helpers"
import { getAllCombinedPubAddressXofY } from "../../aa-schnorr-multisig-sdk/src/helpers/schnorr-helpers"
import { SchnorrSigner, Schnorrkel } from "../../aa-schnorr-multisig-sdk/src/signers"
import { ERC1271_MAGICVALUE_BYTES32, SIGNER_ROLE_HASH } from "../utils/config"

let contract: MultiSigSmartAccount
let combinedAddresses: string[]
let signerOne: SchnorrSigner
let signerTwo: SchnorrSigner
let signerThree: SchnorrSigner
let msg: string

describe("Multi Sign Tests", function () {
  this.beforeEach("create signers and deploy contract", async function () {
    msg = "just a test message"

    // create signers
    signerOne = createRandomSchnorrSigner()
    signerTwo = createRandomSchnorrSigner()
    signerThree = createRandomSchnorrSigner()

    // generate pubNonces
    signerOne.generatePubNonces()
    signerTwo.generatePubNonces()
    signerThree.generatePubNonces()

    // generate combined addresses for multisig 2/2
    combinedAddresses = getAllCombinedPubAddressXofY([signerOne, signerTwo], 2)

    // deploy contract with signers
    const schnorrAA = await deployMultiSigSmartAccount(combinedAddresses)
    contract = schnorrAA.schnorrAA
  })
  it("should generate a schnorr musig2 and validate it on the blockchain", async function () {
    const combinedAddress = combinedAddresses[0]
    expect(await contract.hasRole(SIGNER_ROLE_HASH, combinedAddress)).to.be.eq(true)

    const msg = "just a test message"
    const publicKeys = [signerOne.getPubKey(), signerTwo.getPubKey()]
    const publicNonces = [signerOne.getPubNonces(), signerTwo.getPubNonces()]
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const { signature: sigOne, challenge: e, finalPublicNonce } = signerOne.signMultiSigMsg(msg, publicKeys, publicNonces)
    const { signature: sigTwo } = signerTwo.signMultiSigMsg(msg, publicKeys, publicNonces)
    const sSummed = Schnorrkel.sumSigs([sigOne, sigTwo])

    // the multisig px and parity
    const px = ethers.utils.hexlify(combinedPublicKey.buffer.subarray(1, 33))
    const combinedPublicAddress = "0x" + px.slice(px.length - 40, px.length)
    const parity = combinedPublicKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new ethers.utils.AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sSummed.buffer, parity])
    const msgHash = ethers.utils.solidityKeccak256(["string"], [msg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })

  it("should generate a schnorr musig2 and validate it on the blockchain", async function () {
    const publicKeys = [signerOne.getPubKey(), signerTwo.getPubKey()]
    const publicNonces = [signerOne.getPubNonces(), signerTwo.getPubNonces()]
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const { signature: sigOne, challenge: e, finalPublicNonce } = signerOne.signMultiSigMsg(msg, publicKeys, publicNonces)
    const { signature: sigTwo } = signerTwo.signMultiSigMsg(msg, publicKeys, publicNonces)
    const sSummed = Schnorrkel.sumSigs([sigOne, sigTwo])

    // the multisig px and parity
    const px = ethers.utils.hexlify(combinedPublicKey.buffer.subarray(1, 33))
    const combinedPublicAddress = "0x" + px.slice(px.length - 40, px.length)

    const parity = combinedPublicKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new ethers.utils.AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sSummed.buffer, parity])
    const msgHash = ethers.utils.solidityKeccak256(["string"], [msg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })

  it("should fail if the signer is totally different", async function () {
    const _randomSigner = createRandomSchnorrSigner()
    _randomSigner.generatePubNonces()

    const publicKeys = [signerOne.getPubKey(), _randomSigner.getPubKey()]
    const publicNonces = [signerOne.getPubNonces(), _randomSigner.getPubNonces()]
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)

    const { signature: sigOne, challenge: e } = signerOne.signMultiSigMsg(msg, publicKeys, publicNonces)
    const { signature: sigTwo } = _randomSigner.signMultiSigMsg(msg, publicKeys, publicNonces)
    const sSummed = Schnorrkel.sumSigs([sigOne, sigTwo])

    // the multisig px and parity
    const px = combinedPublicKey.buffer.subarray(1, 33)
    const parity = combinedPublicKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new ethers.utils.AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sSummed.buffer, parity])
    const msgHash = ethers.utils.solidityKeccak256(["string"], [msg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal("0xffffffff")
  })

  it("should fail if only one signature is provided", async function () {
    const msg = "just a test message"
    const publicKeys = [signerOne.getPubKey(), signerTwo.getPubKey()]
    const publicNonces = [signerOne.getPubNonces(), signerTwo.getPubNonces()]
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const { signature: sigOne, challenge: e } = signerOne.signMultiSigMsg(msg, publicKeys, publicNonces)

    // the multisig px and parity
    const px = combinedPublicKey.buffer.subarray(1, 33)
    const parity = combinedPublicKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new ethers.utils.AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sigOne.buffer, parity])
    const msgHash = ethers.utils.solidityKeccak256(["string"], [msg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal("0xffffffff")
  })

  it("should fail if a signer tries to sign twice with the same nonce", async function () {
    const publicKeys = [signerOne.getPubKey(), signerTwo.getPubKey()]
    const publicNonces = [signerOne.getPubNonces(), signerTwo.getPubNonces()]
    const { signature: s, challenge: e } = signerOne.signMultiSigMsg(msg, publicKeys, publicNonces)
    expect(signerOne.signMultiSigMsg.bind(signerOne, msg, publicKeys, publicNonces)).to.throw("Nonces should be exchanged before signing")
  })

  it("should fail if only one signer tries to sign the transaction providing 2 messages", async function () {
    const publicKeys = [signerOne.getPubKey(), signerTwo.getPubKey()]
    const signerTwoNonces = signerTwo.getPubNonces()
    const publicNonces = [signerOne.getPubNonces(), signerTwoNonces]
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const { signature: sigOne, challenge: e } = signerOne.signMultiSigMsg(msg, publicKeys, publicNonces)

    // try to generate new signature with old signerTwo's nonces
    signerOne.generatePubNonces()
    const _invalidPublicNonces = [signerOne.getPubNonces(), signerTwoNonces]

    const { signature: sigTwo } = signerOne.signMultiSigMsg(msg, publicKeys, _invalidPublicNonces)
    const sSummed = Schnorrkel.sumSigs([sigOne, sigTwo])

    // the multisig px and parity
    const px = combinedPublicKey.buffer.subarray(1, 33)
    const parity = combinedPublicKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new ethers.utils.AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sSummed.buffer, parity])
    const msgHash = ethers.utils.solidityKeccak256(["string"], [msg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal("0xffffffff")
  })

  it("should successfully pass even if the order of the public keys is different", async function () {
    const publicKeys = [signerTwo.getPubKey(), signerOne.getPubKey()]
    const publicNonces = [signerOne.getPubNonces(), signerTwo.getPubNonces()]
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const { signature: sigOne, challenge: e } = signerOne.signMultiSigMsg(msg, publicKeys, publicNonces)
    const { signature: sigTwo } = signerTwo.signMultiSigMsg(msg, publicKeys, publicNonces)
    const sSummed = Schnorrkel.sumSigs([sigOne, sigTwo])

    // the multisig px and parity
    const px = combinedPublicKey.buffer.subarray(1, 33)
    const parity = combinedPublicKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new ethers.utils.AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sSummed.buffer, parity])
    const msgHash = ethers.utils.solidityKeccak256(["string"], [msg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })

  it("should throw error requirements for public keys when generating nonces and multi singatures", async function () {
    try {
      Schnorrkel.getCombinedPublicKey([signerTwo.getPubKey()])
    } catch (e: any) {
      expect(e.message).to.equal("At least 2 public keys should be provided")
    }
    try {
      Schnorrkel.getCombinedAddress([signerOne.getPubKey()])
    } catch (e: any) {
      expect(e.message).to.equal("At least 2 public keys should be provided")
    }

    const publicKeys = [signerOne.getPubKey()]
    const publicNonces = [signerOne.getPubNonces(), signerTwo.getPubNonces()]
    try {
      signerOne.signMultiSigMsg(msg, publicKeys, publicNonces)
    } catch (e: any) {
      expect(e.message).to.equal("At least 2 public keys should be provided")
    }
  })

  it("should successfully pass even if the order of the signatures is different", async function () {
    const publicKeys = [signerOne.getPubKey(), signerTwo.getPubKey()]
    const publicNonces = [signerOne.getPubNonces(), signerTwo.getPubNonces()]
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const { signature: sigTwo } = signerTwo.signMultiSigMsg(msg, publicKeys, publicNonces)
    const { signature: sigOne, challenge: e } = signerOne.signMultiSigMsg(msg, publicKeys, publicNonces)
    const sSummed = Schnorrkel.sumSigs([sigTwo, sigOne])

    // the multisig px and parity
    const px = combinedPublicKey.buffer.subarray(1, 33)
    const parity = combinedPublicKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new ethers.utils.AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sSummed.buffer, parity])
    const msgHash = ethers.utils.solidityKeccak256(["string"], [msg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })
})

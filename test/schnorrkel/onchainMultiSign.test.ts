import { expect } from "chai"
import { ethers } from "ethers"
import Schnorrkel from "../../src/index"
import DefaultSigner from "../../src/types/DefaultSigner"
import { _generatePk } from "../../src/core"
import { deploySchnorrAA } from "../utils/deployments"
import { generateCombinedPubAddress } from "../../src/utils/schnorrHelpers"
import { ERC1271_MAGICVALUE_BYTES32 } from "../utils/helpers"

describe("Multi Sign Tests", function () {
  it("should generate a schnorr musig2 and validate it on the blockchain", async function () {
    // deploy the contract
    const signerOne = new DefaultSigner(0)
    const signerTwo = new DefaultSigner(1)
    const combinedAddress = generateCombinedPubAddress([signerOne, signerTwo])
    const { schnorrAA: contract } = await deploySchnorrAA([combinedAddress])

    const isSigner = await contract.signers(combinedAddress)
    expect(isSigner).to.equal("0x0000000000000000000000000000000000000000000000000000000000000001")

    const msg = "just a test message"
    const publicKeys = [signerOne.getPublicKey(), signerTwo.getPublicKey()]
    const publicNonces = [signerOne.getPublicNonces(), signerTwo.getPublicNonces()]
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const { signature: sigOne, challenge: e, finalPublicNonce } = signerOne.multiSignMessage(msg, publicKeys, publicNonces)
    const { signature: sigTwo } = signerTwo.multiSignMessage(msg, publicKeys, publicNonces)
    const sSummed = Schnorrkel.sumSigs([sigOne, sigTwo])

    // the multisig px and parity
    const px = ethers.hexlify(combinedPublicKey.buffer.subarray(1, 33))
    const combinedPublicAddress = "0x" + px.slice(px.length - 40, px.length)

    const parity = combinedPublicKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new ethers.AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sSummed.buffer, parity])
    const msgHash = ethers.solidityPackedKeccak256(["string"], [msg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })

  it("should generate a schnorr musig2 and validate it on the blockchain", async function () {
    // deploy the contract
    const signerOne = new DefaultSigner(0)
    const signerTwo = new DefaultSigner(1)
    const combinedAddress = generateCombinedPubAddress([signerOne, signerTwo])
    const { schnorrAA: contract } = await deploySchnorrAA([combinedAddress])

    const msg = "just a test message"
    const publicKeys = [signerOne.getPublicKey(), signerTwo.getPublicKey()]
    const publicNonces = [signerOne.getPublicNonces(), signerTwo.getPublicNonces()]
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const { signature: sigOne, challenge: e, finalPublicNonce } = signerOne.multiSignMessage(msg, publicKeys, publicNonces)
    const { signature: sigTwo } = signerTwo.multiSignMessage(msg, publicKeys, publicNonces)
    const sSummed = Schnorrkel.sumSigs([sigOne, sigTwo])

    // the multisig px and parity
    const px = ethers.hexlify(combinedPublicKey.buffer.subarray(1, 33))
    const combinedPublicAddress = "0x" + px.slice(px.length - 40, px.length)

    const parity = combinedPublicKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new ethers.AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sSummed.buffer, parity])
    const msgHash = ethers.solidityPackedKeccak256(["string"], [msg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })

  it("should fail if the signer is totally different", async function () {
    // deploy the contract
    const signerOne = new DefaultSigner(0)
    const signerTwo = new DefaultSigner(1)
    const combinedAddress = generateCombinedPubAddress([signerOne, signerTwo])
    const { schnorrAA: contract } = await deploySchnorrAA([combinedAddress])

    const signerThree = new DefaultSigner(2)
    const msg = "just a test message"
    const publicKeys = [signerOne.getPublicKey(), signerThree.getPublicKey()]
    const publicNonces = [signerOne.getPublicNonces(), signerThree.getPublicNonces()]
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)

    const { signature: sigOne, challenge: e } = signerOne.multiSignMessage(msg, publicKeys, publicNonces)
    const { signature: sigTwo } = signerThree.multiSignMessage(msg, publicKeys, publicNonces)
    const sSummed = Schnorrkel.sumSigs([sigOne, sigTwo])

    // the multisig px and parity
    const px = combinedPublicKey.buffer.subarray(1, 33)
    const parity = combinedPublicKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new ethers.AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sSummed.buffer, parity])
    const msgHash = ethers.solidityPackedKeccak256(["string"], [msg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal("0xffffffff")
  })

  it("should fail if only one signature is provided", async function () {
    // deploy the contract
    const signerOne = new DefaultSigner(0)
    const signerTwo = new DefaultSigner(1)
    const combinedAddress = generateCombinedPubAddress([signerOne, signerTwo])
    const { schnorrAA: contract } = await deploySchnorrAA([combinedAddress])

    const msg = "just a test message"
    const publicKeys = [signerOne.getPublicKey(), signerTwo.getPublicKey()]
    const publicNonces = [signerOne.getPublicNonces(), signerTwo.getPublicNonces()]
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const { signature: sigOne, challenge: e } = signerOne.multiSignMessage(msg, publicKeys, publicNonces)

    // the multisig px and parity
    const px = combinedPublicKey.buffer.subarray(1, 33)
    const parity = combinedPublicKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new ethers.AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sigOne.buffer, parity])
    const msgHash = ethers.solidityPackedKeccak256(["string"], [msg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal("0xffffffff")
  })

  it("should fail if a signer tries to sign twice with the same nonce", async function () {
    // deploy the contract
    const signerOne = new DefaultSigner(0)
    const signerTwo = new DefaultSigner(1)
    const combinedAddress = generateCombinedPubAddress([signerOne, signerTwo])
    const { schnorrAA: contract } = await deploySchnorrAA([combinedAddress])

    const msg = "just a test message"
    const publicKeys = [signerOne.getPublicKey(), signerTwo.getPublicKey()]
    const publicNonces = [signerOne.getPublicNonces(), signerTwo.getPublicNonces()]
    const { signature: s, challenge: e } = signerOne.multiSignMessage(msg, publicKeys, publicNonces)
    expect(signerOne.multiSignMessage.bind(signerOne, msg, publicKeys, publicNonces)).to.throw("Nonces should be exchanged before signing")
  })

  it("should fail if only one signer tries to sign the transaction providing 2 messages", async function () {
    // deploy the contract
    const signerOne = new DefaultSigner(0)
    const signerTwo = new DefaultSigner(1)
    const combinedAddress = generateCombinedPubAddress([signerOne, signerTwo])
    const { schnorrAA: contract } = await deploySchnorrAA([combinedAddress])

    const msg = "just a test message"
    const publicKeys = [signerOne.getPublicKey(), signerTwo.getPublicKey()]
    const signerTwoNonces = signerTwo.getPublicNonces()
    const publicNonces = [signerOne.getPublicNonces(), signerTwoNonces]
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const { signature: sigOne, challenge: e } = signerOne.multiSignMessage(msg, publicKeys, publicNonces)
    const publicNoncesTwo = [signerOne.getPublicNonces(), signerTwoNonces]
    const { signature: sigTwo } = signerOne.multiSignMessage(msg, publicKeys, publicNoncesTwo)
    const sSummed = Schnorrkel.sumSigs([sigOne, sigTwo])

    // the multisig px and parity
    const px = combinedPublicKey.buffer.subarray(1, 33)
    const parity = combinedPublicKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new ethers.AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sSummed.buffer, parity])
    const msgHash = ethers.solidityPackedKeccak256(["string"], [msg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal("0xffffffff")
  })

  it("should successfully pass even if the order of the public keys is different", async function () {
    // deploy the contract
    const signerOne = new DefaultSigner(0)
    const signerTwo = new DefaultSigner(1)
    const combinedAddress = generateCombinedPubAddress([signerOne, signerTwo])
    const { schnorrAA: contract } = await deploySchnorrAA([combinedAddress])

    const msg = "just a test message"
    const publicKeys = [signerTwo.getPublicKey(), signerOne.getPublicKey()]
    const publicNonces = [signerOne.getPublicNonces(), signerTwo.getPublicNonces()]
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const { signature: sigOne, challenge: e } = signerOne.multiSignMessage(msg, publicKeys, publicNonces)
    const { signature: sigTwo } = signerTwo.multiSignMessage(msg, publicKeys, publicNonces)
    const sSummed = Schnorrkel.sumSigs([sigOne, sigTwo])

    // the multisig px and parity
    const px = combinedPublicKey.buffer.subarray(1, 33)
    const parity = combinedPublicKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new ethers.AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sSummed.buffer, parity])
    const msgHash = ethers.solidityPackedKeccak256(["string"], [msg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })

  it("should throw error requirements for public keys when generating nonces and multi singatures", async function () {
    // chai.Assertion.expectExpects(3)
    const signerOne = new DefaultSigner(0)
    const signerTwo = new DefaultSigner(1)

    try {
      Schnorrkel.getCombinedPublicKey([signerTwo.getPublicKey()])
    } catch (e: any) {
      expect(e.message).to.equal("At least 2 public keys should be provided")
    }
    try {
      Schnorrkel.getCombinedAddress([signerOne.getPublicKey()])
    } catch (e: any) {
      expect(e.message).to.equal("At least 2 public keys should be provided")
    }

    const msg = "just a test message"
    const publicKeys = [signerOne.getPublicKey()]
    const publicNonces = [signerOne.getPublicNonces(), signerTwo.getPublicNonces()]
    try {
      signerOne.multiSignMessage(msg, publicKeys, publicNonces)
    } catch (e: any) {
      expect(e.message).to.equal("At least 2 public keys should be provided")
    }
  })

  it("should successfully pass even if the order of the signatures is different", async function () {
    // deploy the contract
    const signerOne = new DefaultSigner(0)
    const signerTwo = new DefaultSigner(1)
    const combinedAddress = generateCombinedPubAddress([signerOne, signerTwo])
    const { schnorrAA: contract } = await deploySchnorrAA([combinedAddress])

    const msg = "just a test message"
    const publicKeys = [signerOne.getPublicKey(), signerTwo.getPublicKey()]
    const publicNonces = [signerOne.getPublicNonces(), signerTwo.getPublicNonces()]
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const { signature: sigTwo } = signerTwo.multiSignMessage(msg, publicKeys, publicNonces)
    const { signature: sigOne, challenge: e } = signerOne.multiSignMessage(msg, publicKeys, publicNonces)
    const sSummed = Schnorrkel.sumSigs([sigTwo, sigOne])

    // the multisig px and parity
    const px = combinedPublicKey.buffer.subarray(1, 33)
    const parity = combinedPublicKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new ethers.AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sSummed.buffer, parity])
    const msgHash = ethers.solidityPackedKeccak256(["string"], [msg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })
})

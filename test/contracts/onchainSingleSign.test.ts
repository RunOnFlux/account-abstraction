import { expect } from "chai"
import { AbiCoder, ethers, randomBytes } from "ethers"
import secp256k1 from "secp256k1"

import { ERC1271_INVALID_SIGNATURE, ERC1271_MAGICVALUE_BYTES32, pk1 } from "../utils/config"
import { deployMultiSigSmartAccount } from "../utils/deployments"
import { generateAddress } from "../utils/helpers"
import { Key } from "../../aa-schnorr-multisig-sdk/src/types"
import { Schnorrkel } from "../../aa-schnorr-multisig-sdk/src/signers"

describe("Onchain Single Sign Tests", function () {
  it("should generate a schnorr signature and verify onchain", async function () {
    const { address } = generateAddress(pk1)
    const salt = randomBytes(32).toString()
    const { schnorrAA: contract } = await deployMultiSigSmartAccount([address], salt)

    // sign
    const msg = "just a test message"
    const pkBuffer = new Key(Buffer.from(ethers.getBytes(pk1)))
    const sig = Schnorrkel.sign(pkBuffer, msg)

    // wrap the result
    const publicKey = secp256k1.publicKeyCreate(ethers.getBytes(pk1))
    const px = publicKey.slice(1, 33)
    const parity = publicKey[0] - 2 + 27
    const abiCoder = new AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, sig.challenge.buffer, sig.signature.buffer, parity])
    const msgHash = ethers.solidityPackedKeccak256(["string"], [msg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })
  it("should fail if msgHash is different than msg signed", async function () {
    const { address } = generateAddress(pk1)
    const salt = randomBytes(32).toString()
    const { schnorrAA: contract } = await deployMultiSigSmartAccount([address], salt)

    // sign
    const msg = "just a test message"
    const invalidMsg = "malicious msg"
    const pkBuffer = new Key(Buffer.from(ethers.getBytes(pk1)))
    const sig = Schnorrkel.sign(pkBuffer, msg)

    // wrap the result
    const publicKey = secp256k1.publicKeyCreate(ethers.getBytes(pk1))
    const px = publicKey.slice(1, 33)
    const parity = publicKey[0] - 2 + 27
    const abiCoder = new AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, sig.challenge.buffer, sig.signature.buffer, parity])

    // mshHash out of invalid msg
    const msgHash = ethers.solidityPackedKeccak256(["string"], [invalidMsg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_INVALID_SIGNATURE)
  })
})

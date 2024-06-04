import { expect } from "chai"
import { ethers } from "ethers"

import { Schnorrkel } from "../../aa-schnorr-multisig-sdk/src/signers"
import { generateRandomKeys } from "../../aa-schnorr-multisig-sdk/src/core"

describe("testing multiSigSign", () => {
  it("should generate multi signature", () => {
    const schnorrkelOne = new Schnorrkel()
    const schnorrkelTwo = new Schnorrkel()

    const keyPairOne = generateRandomKeys()
    const keyPairTwo = generateRandomKeys()
    const publicNoncesOne = schnorrkelOne.generatePublicNonces(keyPairOne.privateKey)
    const publicNoncesTwo = schnorrkelTwo.generatePublicNonces(keyPairTwo.privateKey)

    const publicNonces = [publicNoncesOne, publicNoncesTwo]
    const publicKeys = [keyPairOne.publicKey, keyPairTwo.publicKey]

    const msg = "test message"
    const signature = schnorrkelOne.multiSigSign(keyPairOne.privateKey, msg, publicKeys, publicNonces)

    expect(signature.finalPublicNonce.buffer).to.have.length(33)
    expect(signature.signature.buffer).to.have.length(32)
    expect(signature.challenge.buffer).to.have.length(32)
  })

  it("should requires two public keys or more", () => {
    const schnorrkel = new Schnorrkel()
    const keyPair = generateRandomKeys()
    const publicNonces = schnorrkel.generatePublicNonces(keyPair.privateKey)

    const msg = "test message"
    const publicKeys = [keyPair.publicKey]

    expect(() => schnorrkel.multiSigSign(keyPair.privateKey, msg, publicKeys, [publicNonces])).to.throw(
      "At least 2 public keys should be provided"
    )
  })

  it("should requires nonces", () => {
    const schnorrkel = new Schnorrkel()
    const keyPairOne = generateRandomKeys()
    const keyPairTwo = generateRandomKeys()

    const msg = "test message"
    const publicKeys = [keyPairOne.publicKey, keyPairTwo.publicKey]

    expect(() => schnorrkel.multiSigSign(keyPairOne.privateKey, msg, publicKeys, [])).to.throw("Nonces should be exchanged before signing")
  })

  it("should generate multi signature by hash", () => {
    const schnorrkelOne = new Schnorrkel()
    const schnorrkelTwo = new Schnorrkel()

    const keyPairOne = generateRandomKeys()
    const keyPairTwo = generateRandomKeys()
    const publicNoncesOne = schnorrkelOne.generatePublicNonces(keyPairOne.privateKey)
    const publicNoncesTwo = schnorrkelTwo.generatePublicNonces(keyPairTwo.privateKey)

    const publicNonces = [publicNoncesOne, publicNoncesTwo]
    const publicKeys = [keyPairOne.publicKey, keyPairTwo.publicKey]

    const msg = "test message"
    const hash = ethers.solidityPackedKeccak256(["string"], [msg])
    const signature = schnorrkelOne.multiSigSignHash(keyPairOne.privateKey, hash, publicKeys, publicNonces)

    expect(signature.finalPublicNonce.buffer).to.have.length(33)
    expect(signature.signature.buffer).to.have.length(32)
    expect(signature.challenge.buffer).to.have.length(32)
  })
})

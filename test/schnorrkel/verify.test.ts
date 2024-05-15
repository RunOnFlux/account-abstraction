import { expect } from "chai"
import { AbiCoder, ethers, SigningKey } from "ethers"

import { Schnorrkel } from "../../aa-schnorr-multisig-sdk/src/signers"
import { Key } from "../../aa-schnorr-multisig-sdk/src/types"
import { generateRandomKeys } from "../../aa-schnorr-multisig-sdk/src/core"

describe("testing verify", () => {
  it("should verify a normal schnorr signature and make sure sign does not overwrite the private key", () => {
    const privateKey = new Key(Buffer.from(ethers.randomBytes(32)))
    const signingKey = new SigningKey(privateKey.buffer)

    const msg = "test message"
    const signature = Schnorrkel.sign(privateKey, msg)

    const publicKey = ethers.getBytes(SigningKey.computePublicKey(signingKey.privateKey, true))

    expect(signature.finalPublicNonce.buffer).to.have.length(33)
    expect(signature.signature.buffer).to.have.length(32)
    expect(signature.challenge.buffer).to.have.length(32)
    const isValid = Schnorrkel.verify(signature.signature, msg, signature.finalPublicNonce, new Key(Buffer.from(publicKey)))
    expect(isValid).to.be.equal(true)

    const secondMsg = "this is another msg"
    const secondSig = Schnorrkel.sign(privateKey, secondMsg)
    const isSecondValid = Schnorrkel.verify(secondSig.signature, secondMsg, secondSig.finalPublicNonce, new Key(Buffer.from(publicKey)))
    expect(isSecondValid).to.be.equal(true)
  })
  it("should sum signatures and verify them", () => {
    const schnorrkelOne = new Schnorrkel()
    const schnorrkelTwo = new Schnorrkel()

    const keyPairOne = generateRandomKeys()
    const keyPairTwo = generateRandomKeys()
    const publicNoncesOne = schnorrkelOne.generatePublicNonces(keyPairOne.privateKey)
    const publicNoncesTwo = schnorrkelTwo.generatePublicNonces(keyPairTwo.privateKey)

    const publicNonces = [publicNoncesOne, publicNoncesTwo]
    const publicKeys = [keyPairOne.publicKey, keyPairTwo.publicKey]

    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)

    const msg = "test message"
    const signatureOne = schnorrkelOne.multiSigSign(keyPairOne.privateKey, msg, publicKeys, publicNonces)
    const signatureTwo = schnorrkelTwo.multiSigSign(keyPairTwo.privateKey, msg, publicKeys, publicNonces)

    const signatures = [signatureOne.signature, signatureTwo.signature]
    const signaturesSummed = Schnorrkel.sumSigs(signatures)
    const isValid = Schnorrkel.verify(signaturesSummed, msg, signatureTwo.finalPublicNonce, combinedPublicKey)

    expect(isValid).to.be.equal(true)
  })
  it("should make sure private keys are not overwritten during signing", () => {
    const schnorrkelOne = new Schnorrkel()
    const schnorrkelTwo = new Schnorrkel()

    const keyPairOne = generateRandomKeys()
    const keyPairTwo = generateRandomKeys()

    const publicNoncesOne = schnorrkelOne.generatePublicNonces(keyPairOne.privateKey)
    const publicNoncesTwo = schnorrkelTwo.generatePublicNonces(keyPairTwo.privateKey)

    const publicNonces = [publicNoncesOne, publicNoncesTwo]
    const publicKeys = [keyPairOne.publicKey, keyPairTwo.publicKey]

    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)

    const msg = "test message"
    const pkOneCache = new Key(Buffer.from(keyPairOne.privateKey.buffer))

    expect(pkOneCache.buffer).to.be.eql(keyPairOne.privateKey.buffer)
    const signatureOne = schnorrkelOne.multiSigSign(keyPairOne.privateKey, msg, publicKeys, publicNonces)
    expect(pkOneCache.buffer).to.be.eql(keyPairOne.privateKey.buffer)

    const pkTwoCache = new Key(Buffer.from(keyPairTwo.privateKey.buffer))
    expect(pkTwoCache.buffer).to.be.eql(keyPairTwo.privateKey.buffer)
    const signatureTwo = schnorrkelTwo.multiSigSign(keyPairTwo.privateKey, msg, publicKeys, publicNonces)
    expect(pkTwoCache.buffer).to.be.eql(keyPairTwo.privateKey.buffer)

    const signatures = [signatureOne.signature, signatureTwo.signature]
    const signaturesSummed = Schnorrkel.sumSigs(signatures)
    const isValid = Schnorrkel.verify(signaturesSummed, msg, signatureTwo.finalPublicNonce, combinedPublicKey)

    expect(isValid).to.be.equal(true)
  })
  it("should verify a schnorr signature with a custom hash function", () => {
    const privateKey = new Key(Buffer.from(ethers.randomBytes(32)))
    const signingKey = new SigningKey(privateKey.buffer)

    const abiCoder = new AbiCoder()
    const msg = abiCoder.encode(["string"], ["test message"])
    const hashFn = ethers.keccak256
    const signature = Schnorrkel.sign(privateKey, msg, hashFn)

    const publicKey = ethers.getBytes(SigningKey.computePublicKey(signingKey.privateKey, true))

    expect(signature.finalPublicNonce.buffer).to.have.length(33)
    expect(signature.signature.buffer).to.have.length(32)
    expect(signature.challenge.buffer).to.have.length(32)
    const isValid = Schnorrkel.verify(signature.signature, msg, signature.finalPublicNonce, new Key(Buffer.from(publicKey)), hashFn)
    expect(isValid).to.be.equal(true)
  })
  it("should sum the signatures and verify them using a custom hash function for the message", () => {
    const schnorrkelOne = new Schnorrkel()
    const schnorrkelTwo = new Schnorrkel()

    const keyPairOne = generateRandomKeys()
    const keyPairTwo = generateRandomKeys()
    const publicNoncesOne = schnorrkelOne.generatePublicNonces(keyPairOne.privateKey)
    const publicNoncesTwo = schnorrkelTwo.generatePublicNonces(keyPairTwo.privateKey)

    const publicNonces = [publicNoncesOne, publicNoncesTwo]
    const publicKeys = [keyPairOne.publicKey, keyPairTwo.publicKey]

    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)

    const abiCoder = new AbiCoder()
    const msg = abiCoder.encode(["string"], ["test message"])
    const hashFn = ethers.keccak256
    const signatureOne = schnorrkelOne.multiSigSign(keyPairOne.privateKey, msg, publicKeys, publicNonces, hashFn)
    const signatureTwo = schnorrkelTwo.multiSigSign(keyPairTwo.privateKey, msg, publicKeys, publicNonces, hashFn)

    const signatures = [signatureOne.signature, signatureTwo.signature]
    const signaturesSummed = Schnorrkel.sumSigs(signatures)
    const isValid = Schnorrkel.verify(signaturesSummed, msg, signatureTwo.finalPublicNonce, combinedPublicKey, hashFn)

    expect(isValid).to.be.equal(true)
  })
  it("should verify a signature hash", () => {
    const privateKey = new Key(Buffer.from(ethers.randomBytes(32)))
    const signingKey = new SigningKey(privateKey.buffer)

    const msg = "test message"
    const hash = ethers.solidityPackedKeccak256(["string"], [msg])
    const signature = Schnorrkel.signHash(privateKey, hash)

    const publicKey = ethers.getBytes(SigningKey.computePublicKey(signingKey.privateKey, true))

    expect(signature.finalPublicNonce.buffer).to.have.length(33)
    expect(signature.signature.buffer).to.have.length(32)
    expect(signature.challenge.buffer).to.have.length(32)
    const isValid = Schnorrkel.verifyHash(signature.signature, hash, signature.finalPublicNonce, new Key(Buffer.from(publicKey)))
    expect(isValid).to.be.equal(true)
  })

  it("should verify a multi signature hash", () => {
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
    const signatureTwo = schnorrkelTwo.multiSigSignHash(keyPairTwo.privateKey, hash, publicKeys, publicNonces)
    const signatures = [signature.signature, signatureTwo.signature]
    const signaturesSummed = Schnorrkel.sumSigs(signatures)

    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const isValid = Schnorrkel.verifyHash(signaturesSummed, hash, signature.finalPublicNonce, combinedPublicKey)
    expect(isValid).to.be.equal(true)
  })
})

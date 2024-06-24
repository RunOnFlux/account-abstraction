import { expect } from "chai"

import { Schnorrkel } from "../../aa-schnorr-multisig-sdk/src/signers"
import { generateRandomKeys } from "../../aa-schnorr-multisig-sdk/src/core"

describe("testing restorePublicNonces", () => {
  it("should restore public nonces", () => {
    const schnorrkel = new Schnorrkel()
    const keyPair = generateRandomKeys()
    const kPrivateKey = generateRandomKeys().privateKey
    const kTwoPrivateKey = generateRandomKeys().privateKey
    const publicNonces = schnorrkel.restorePublicNonces(keyPair.privateKey, kPrivateKey, kTwoPrivateKey)
    expect(publicNonces.kPublic.buffer).to.have.length(33)
    expect(publicNonces.kTwoPublic.buffer).to.have.length(33)
  })
})

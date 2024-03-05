import { expect } from "chai"
import { Schnorrkel } from "../../aa-schnorr-multisig-sdk/src/signers"
import { generateRandomKeys } from "../../aa-schnorr-multisig-sdk/src/core"

describe("testing generatePublicNonces", () => {
  it("should generate public nonces", () => {
    const schnorrkel = new Schnorrkel()
    const keyPair = generateRandomKeys()
    const publicNonces = schnorrkel.generatePublicNonces(keyPair.privateKey)
    expect(publicNonces.kPublic.buffer).to.have.length(33)
    expect(publicNonces.kTwoPublic.buffer).to.have.length(33)
  })
})

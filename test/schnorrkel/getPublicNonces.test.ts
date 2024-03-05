import { expect } from "chai"
import { Schnorrkel } from "../../aa-schnorr-multisig-sdk/src/signers"
import { generateRandomKeys } from "../../aa-schnorr-multisig-sdk/src/core"

describe("testing getPublicNonces", () => {
  it("should generate the public nonces and afterwards get them successfully", () => {
    const schnorrkel = new Schnorrkel()

    const keyPair = generateRandomKeys()
    const publicNonces = schnorrkel.generatePublicNonces(keyPair.privateKey)

    expect(publicNonces.kPublic.buffer).to.have.length(33)
    expect(publicNonces.kTwoPublic.buffer).to.have.length(33)

    const retrievedPublicNonces = schnorrkel.getPublicNonces(keyPair.privateKey)
    expect(retrievedPublicNonces.kPublic.buffer).to.equal(publicNonces.kPublic.buffer)
    expect(retrievedPublicNonces.kTwoPublic.buffer).to.equal(publicNonces.kTwoPublic.buffer)
  })
})

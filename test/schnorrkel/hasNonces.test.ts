import { expect } from "chai"

import { Schnorrkel } from "../../aa-schnorr-multisig-sdk/src/signers"
import { generateRandomKeys } from "../../aa-schnorr-multisig-sdk/src/core"

describe("testing hasNonces", () => {
  it("should check if there are nonces set before manipulating them", () => {
    const schnorrkel = new Schnorrkel()

    const keyPair = generateRandomKeys()
    expect(schnorrkel.hasNonce(keyPair.privateKey)).to.equal(false)
    schnorrkel.generatePublicNonces(keyPair.privateKey)
    expect(schnorrkel.hasNonce(keyPair.privateKey)).to.equal(true)
  })
})

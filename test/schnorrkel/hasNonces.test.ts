import { expect } from "chai"

import Schnorrkel from "../../src/schnorrkel"
import { _hashPrivateKey, generateRandomKeys } from "../../src/core"

describe("testing hasNonces", () => {
  it("should check if there are nonces set before manipulating them", () => {
    const schnorrkel = new Schnorrkel()

    const keyPair = generateRandomKeys()
    expect(schnorrkel.hasNonces(keyPair.privateKey)).to.equal(false)
    schnorrkel.generatePublicNonces(keyPair.privateKey)
    expect(schnorrkel.hasNonces(keyPair.privateKey)).to.equal(true)
  })
})

import { expect } from "chai"
import "@nomicfoundation/hardhat-chai-matchers"

import { _hashPrivateKey, generateRandomKeys } from "../../src/core"
import Schnorrkel from "../../src/schnorrkel"

describe("testing generatePublicNonces", () => {
  it("should generate public nonces", () => {
    const schnorrkel = new Schnorrkel()
    const keyPair = generateRandomKeys()
    const publicNonces = schnorrkel.generatePublicNonces(keyPair.privateKey)
    expect(publicNonces).to.exist
    expect(publicNonces.kPublic).to.exist
    expect(publicNonces.kTwoPublic).to.exist
    expect(publicNonces.kPublic.buffer).to.have.length(33)
    expect(publicNonces.kTwoPublic.buffer).to.have.length(33)
  })
})

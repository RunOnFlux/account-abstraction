import { expect } from "chai"

import { UnsafeSchnorrkel } from "../../src/index"
import { _hashPrivateKey, generateRandomKeys } from "../../src/core"

describe("testing generatePublicNonces", () => {
  it("should overwrite public nonces with same private key", () => {
    const schnorrkel = new UnsafeSchnorrkel()

    const keyPair = generateRandomKeys()
    const publicNoncesOne = schnorrkel.generatePublicNonces(keyPair.privateKey)
    const jsonDataOne = schnorrkel.toJson()
    const publicNoncesTwo = schnorrkel.generatePublicNonces(keyPair.privateKey)
    const jsonDataTwo = schnorrkel.toJson()

    expect(publicNoncesOne.kPublic).to.not.eql(publicNoncesTwo.kPublic)
    expect(publicNoncesOne.kTwoPublic).to.not.eql(publicNoncesTwo.kTwoPublic)

    const dataOne = JSON.parse(jsonDataOne)
    const dataTwo = JSON.parse(jsonDataTwo)

    const hash = _hashPrivateKey(keyPair.privateKey.buffer)

    expect(dataOne.nonces[hash]).to.not.eql(dataTwo.nonces[hash])
  })
})

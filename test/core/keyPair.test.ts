import { expect } from "chai"

import { _hashPrivateKey, generateRandomKeys } from "../../src/core"
import { KeyPair } from "../../src/types"

describe("testing KeyPair", () => {
  it("should load from json", () => {
    const keyPairOne = generateRandomKeys()
    const keyPairTwo = KeyPair.fromJson(keyPairOne.toJson())

    expect(keyPairOne.publicKey.buffer).to.eql(keyPairTwo.publicKey.buffer)
    expect(keyPairOne.privateKey.buffer).to.eql(keyPairTwo.privateKey.buffer)
    expect(keyPairOne.toJson()).to.eql(keyPairTwo.toJson())
  })

  it("should throw error if json is invalid", () => {
    const keyPair = generateRandomKeys()
    const jsonData = keyPair.toJson()

    const invalidJsonData = jsonData.slice(0, -1)

    expect(() => KeyPair.fromJson(invalidJsonData)).to.throw("Invalid JSON")
  })
})

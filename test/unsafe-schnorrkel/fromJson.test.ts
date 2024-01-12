import { expect } from "chai"
import { UnsafeSchnorrkel } from "../../src/index"
import { _hashPrivateKey, generateRandomKeys } from "../../src/core"

describe("testing fromJson", () => {
  it("should create Schnorrkel instance from json", () => {
    const schnorrkel = new UnsafeSchnorrkel()

    const keyPair = generateRandomKeys()
    schnorrkel.generatePublicNonces(keyPair.privateKey)
    const jsonData = schnorrkel.toJson()

    const schnorrkelFromJson = UnsafeSchnorrkel.fromJson(jsonData)
    const jsonDataFromJson = schnorrkelFromJson.toJson()

    expect(jsonData).to.eql(jsonDataFromJson)
  })

  it("should throw error if json is invalid", () => {
    const schnorrkel = new UnsafeSchnorrkel()

    const keyPair = generateRandomKeys()
    schnorrkel.generatePublicNonces(keyPair.privateKey)
    const jsonData = schnorrkel.toJson()

    const invalidJsonData = jsonData.slice(0, -1)

    expect(() => UnsafeSchnorrkel.fromJson(invalidJsonData)).to.throw("Invalid JSON")
  })
})

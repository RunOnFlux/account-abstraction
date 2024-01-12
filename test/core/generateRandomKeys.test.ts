import { expect } from "chai"
import { generateRandomKeys } from "../../src/core"

describe("generateRandomKeys", () => {
  it("should generate key pair", () => {
    const keyPair = generateRandomKeys()

    expect(keyPair).to.exist
    expect(keyPair.privateKey).to.exist
    expect(keyPair.publicKey).to.exist
    expect(keyPair.privateKey.toHex()).to.have.length(64)
    expect(keyPair.publicKey.toHex()).to.have.length(66)
    expect(keyPair.privateKey.toHex()).to.not.eql(keyPair.publicKey.toHex())
  })

  it("should generate different key pairs", () => {
    const keyPairOne = generateRandomKeys()
    const keyPairTwo = generateRandomKeys()

    expect(keyPairOne.publicKey.toHex()).to.not.eql(keyPairTwo.publicKey.toHex())
    expect(keyPairOne.privateKey.toHex()).to.not.eql(keyPairTwo.privateKey.toHex())
  })
})

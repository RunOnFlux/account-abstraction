import { expect } from "chai"

import { generateRandomKeys } from "../../aa-schnorr-multisig-sdk/src/core"
import { Schnorrkel } from "../../aa-schnorr-multisig-sdk/src/signers"

describe("testing getCombinedAddress", () => {
  it("should get combined address", () => {
    const keyPairOne = generateRandomKeys()
    const keyPairTwo = generateRandomKeys()

    const combinedAddress = Schnorrkel.getCombinedAddress([keyPairOne.publicKey, keyPairTwo.publicKey])
    expect(combinedAddress).to.exist
    expect(combinedAddress).to.be.string
  })

  it("should requires two public keys or more", () => {
    const keyPair = generateRandomKeys()

    expect(() => Schnorrkel.getCombinedAddress([keyPair.publicKey])).to.throw("At least 2 public keys should be provided")
  })
})

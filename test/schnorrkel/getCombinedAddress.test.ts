import { expect } from "chai"

import { generateRandomKeys } from "../../aa-schnorr-multisig-sdk/src/core"
import { Schnorrkel } from "../../aa-schnorr-multisig-sdk/src/signers"
import { getAllCombinedAddrFromKeys } from "../../aa-schnorr-multisig-sdk/src/helpers/schnorr-helpers"

describe("testing getCombinedAddress", () => {
  it("should get combined address", () => {
    const keyPairOne = generateRandomKeys()
    const keyPairTwo = generateRandomKeys()

    const combinedAddress = Schnorrkel.getCombinedAddress([keyPairOne.publicKey, keyPairTwo.publicKey])
    expect(typeof combinedAddress).to.be.a("string")
  })

  it("should requires two public keys or more", () => {
    const keyPair = generateRandomKeys()

    expect(() => Schnorrkel.getCombinedAddress([keyPair.publicKey])).to.throw("At least 2 public keys should be provided")
  })

  it("should get the same combined addresses from Schnorrkel and helper", () => {
    const keyPairOne = generateRandomKeys()
    const keyPairTwo = generateRandomKeys()

    const combinedAddress = Schnorrkel.getCombinedAddress([keyPairOne.publicKey, keyPairTwo.publicKey])
    const helperAddress = getAllCombinedAddrFromKeys([keyPairOne.publicKey, keyPairTwo.publicKey], 2)[0]
    expect(combinedAddress).to.be.eql(helperAddress)
  })

  it("should get combined addresses from helper", () => {
    const keyPairOne = generateRandomKeys()
    const keyPairTwo = generateRandomKeys()
    const keyPairThree = generateRandomKeys()

    let helperAddress = getAllCombinedAddrFromKeys([keyPairOne.publicKey, keyPairTwo.publicKey, keyPairThree.publicKey])
    expect(helperAddress.length).to.be.eql(7)
    helperAddress = getAllCombinedAddrFromKeys([keyPairOne.publicKey, keyPairTwo.publicKey, keyPairThree.publicKey], 2)
    expect(helperAddress.length).to.be.eql(4)
    helperAddress = getAllCombinedAddrFromKeys([keyPairOne.publicKey, keyPairTwo.publicKey, keyPairThree.publicKey], 3)
    expect(helperAddress.length).to.be.eql(1)
  })
})

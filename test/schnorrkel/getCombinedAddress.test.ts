import { expect } from "chai"

import { generateRandomKeys } from "../../aa-schnorr-multisig-sdk/src/core"
import { Schnorrkel } from "../../aa-schnorr-multisig-sdk/src/signers"
import { getAllCombinedAddrFromKeys, getAllCombinedAddrFromKeysStrict } from "../../aa-schnorr-multisig-sdk/src/helpers/schnorr-helpers"

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
    console.log("combinedAddress", combinedAddress)
    console.log("helperAddress", helperAddress)
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

  it("should get strict combined addresses (exact threshold only)", () => {
    const keyPairOne = generateRandomKeys()
    const keyPairTwo = generateRandomKeys()
    const keyPairThree = generateRandomKeys()
    const pubKeys = [keyPairOne.publicKey, keyPairTwo.publicKey, keyPairThree.publicKey]

    // 3 keys, strict x=1: only single-key combos = C(3,1) = 3
    let strictAddresses = getAllCombinedAddrFromKeysStrict(pubKeys, 1)
    expect(strictAddresses.length).to.be.eql(3)

    // 3 keys, strict x=2: only pairs = C(3,2) = 3
    strictAddresses = getAllCombinedAddrFromKeysStrict(pubKeys, 2)
    expect(strictAddresses.length).to.be.eql(3)

    // 3 keys, strict x=3: only the full group = C(3,3) = 1
    strictAddresses = getAllCombinedAddrFromKeysStrict(pubKeys, 3)
    expect(strictAddresses.length).to.be.eql(1)

    // Compare: non-strict x=2 returns 4 (C(3,2)+C(3,3)), strict x=2 returns 3 (C(3,2) only)
    const nonStrictAddresses = getAllCombinedAddrFromKeys(pubKeys, 2)
    expect(nonStrictAddresses.length).to.be.eql(4)
    expect(strictAddresses.length).to.be.lt(nonStrictAddresses.length)
  })

  it("should get strict combined addresses for 4 keys", () => {
    const keys = Array.from({ length: 4 }, () => generateRandomKeys())
    const pubKeys = keys.map((k) => k.publicKey)

    // 4 keys, strict x=2: C(4,2) = 6
    let strictAddresses = getAllCombinedAddrFromKeysStrict(pubKeys, 2)
    expect(strictAddresses.length).to.be.eql(6)

    // 4 keys, strict x=3: C(4,3) = 4
    strictAddresses = getAllCombinedAddrFromKeysStrict(pubKeys, 3)
    expect(strictAddresses.length).to.be.eql(4)

    // 4 keys, strict x=4: C(4,4) = 1
    strictAddresses = getAllCombinedAddrFromKeysStrict(pubKeys, 4)
    expect(strictAddresses.length).to.be.eql(1)

    // Compare non-strict x=2: C(4,2)+C(4,3)+C(4,4) = 6+4+1 = 11
    const nonStrictAddresses = getAllCombinedAddrFromKeys(pubKeys, 2)
    expect(nonStrictAddresses.length).to.be.eql(11)
  })

  it("strict addresses should be a subset of non-strict addresses", () => {
    const keys = Array.from({ length: 3 }, () => generateRandomKeys())
    const pubKeys = keys.map((k) => k.publicKey)

    const strictAddresses = getAllCombinedAddrFromKeysStrict(pubKeys, 2)
    const nonStrictAddresses = getAllCombinedAddrFromKeys(pubKeys, 2)

    // Every strict address should appear in the non-strict set
    for (const addr of strictAddresses) {
      expect(nonStrictAddresses).to.include(addr)
    }
  })

  it("strict and non-strict should be identical when x equals array length", () => {
    const keys = Array.from({ length: 3 }, () => generateRandomKeys())
    const pubKeys = keys.map((k) => k.publicKey)

    // When x = total keys, both return only the full group = 1 address
    const strictAddresses = getAllCombinedAddrFromKeysStrict(pubKeys, 3)
    const nonStrictAddresses = getAllCombinedAddrFromKeys(pubKeys, 3)

    expect(strictAddresses.length).to.be.eql(1)
    expect(nonStrictAddresses.length).to.be.eql(1)
    expect(strictAddresses[0]).to.be.eql(nonStrictAddresses[0])
  })
})

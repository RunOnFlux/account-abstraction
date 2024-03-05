import { expect } from "chai"
import { generateRandomKeys } from "../../aa-schnorr-multisig-sdk/src/core"
import { Schnorrkel } from "../../aa-schnorr-multisig-sdk/src/signers"
import { Key } from "../../aa-schnorr-multisig-sdk/src/types"

describe("testing getCombinedPublicKey", () => {
  it("should get combined public key", () => {
    const keyPairOne = generateRandomKeys()
    const keyPairTwo = generateRandomKeys()

    const combinedPublicKey = Schnorrkel.getCombinedPublicKey([keyPairOne.publicKey, keyPairTwo.publicKey])
    expect(combinedPublicKey).to.be.instanceOf(Key)
    expect(combinedPublicKey.toHex()).to.have.length(66)
  })

  it("should get same combined public key", () => {
    const keyPairOne = generateRandomKeys()
    const keyPairTwo = generateRandomKeys()

    const combinedPublicKey = Schnorrkel.getCombinedPublicKey([keyPairOne.publicKey, keyPairTwo.publicKey])
    const combinedPublicKeyTwo = Schnorrkel.getCombinedPublicKey([keyPairTwo.publicKey, keyPairOne.publicKey])

    expect(combinedPublicKey.toHex()).to.be.equal(combinedPublicKeyTwo.toHex())
  })

  it("should get same combined public key with different order", () => {
    const keyPairOne = generateRandomKeys()
    const keyPairTwo = generateRandomKeys()

    const combinedPublicKey = Schnorrkel.getCombinedPublicKey([keyPairOne.publicKey, keyPairTwo.publicKey])
    const combinedPublicKeyTwo = Schnorrkel.getCombinedPublicKey([keyPairTwo.publicKey, keyPairOne.publicKey])

    expect(combinedPublicKey.toHex()).to.be.equal(combinedPublicKeyTwo.toHex())
  })

  it("should get combined public key that is different from the original public keys", () => {
    const keyPairOne = generateRandomKeys()
    const keyPairTwo = generateRandomKeys()

    const combinedPublicKey = Schnorrkel.getCombinedPublicKey([keyPairOne.publicKey, keyPairTwo.publicKey])
    expect(combinedPublicKey.toHex()).not.to.be.equal(keyPairOne.publicKey.toHex())
    expect(combinedPublicKey.toHex()).not.to.be.equal(keyPairTwo.publicKey.toHex())
  })

  it("should requires two public keys or more", () => {
    const keyPair = generateRandomKeys()

    expect(() => Schnorrkel.getCombinedPublicKey([keyPair.publicKey])).to.throw("At least 2 public keys should be provided")
  })
})

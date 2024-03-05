import { expect } from "chai"

import { deployMultiSigSmartAccount } from "../utils/deployments"
import type { MultiSigSmartAccount, MultiSigSmartAccountFactory } from "../../src/typechain"
import { createRandomSchnorrSigner, getSalt } from "../utils/helpers"
import { getAllCombinedPubAddressXofY } from "../../aa-schnorr-multisig-sdk/src/helpers/schnorr-helpers"
import type { SchnorrSigner } from "../../aa-schnorr-multisig-sdk/src/signers"

let contract: MultiSigSmartAccount
let combinedAddresses: string[]
let signerOne: SchnorrSigner
let signerTwo: SchnorrSigner
let saltHash: string
let factory: MultiSigSmartAccountFactory

describe("AA Factory", function () {
  this.beforeEach("create signers and deploy contract", async function () {
    // create signers
    signerOne = createRandomSchnorrSigner()
    signerTwo = createRandomSchnorrSigner()

    // generate pubNonces
    signerOne.generatePubNonces()
    signerTwo.generatePubNonces()

    // generate combined addresses for multisig 2/2
    combinedAddresses = getAllCombinedPubAddressXofY([signerOne, signerTwo], 2)

    // deploy contract with signers
    const { salt, schnorrAA, mssaFactory } = await deployMultiSigSmartAccount(combinedAddresses)
    contract = schnorrAA
    saltHash = salt
    factory = mssaFactory
  })
  it("should generate AA with deterministic address", async function () {
    expect(await factory.getAccountAddress(combinedAddresses, saltHash)).to.be.eql(contract.address)
  })
  it("should get different address if diferent salt", async function () {
    const _salt = getSalt("shouldfail")
    expect(await factory.getAccountAddress(combinedAddresses, _salt)).to.not.be.eql(contract.address)
  })
  it("should get different address if diferent combined addresses", async function () {
    const random = createRandomSchnorrSigner()
    const _combined: string[] = [random.getAddress()]
    expect(await factory.getAccountAddress(_combined, saltHash)).to.not.be.eql(contract.address)
  })
  it("should return address without creation if account already created", async function () {
    const _salt = getSalt("random")
    const _predicted = await factory.getAccountAddress(combinedAddresses, _salt)
    expect(await factory.createAccount(combinedAddresses, _salt))
      .to.emit(factory, "SmartAccountCreated")
      .withArgs(_predicted)

    expect(await factory.createAccount(combinedAddresses, _salt)).to.not.emit(factory, "SmartAccountCreated")
  })
})

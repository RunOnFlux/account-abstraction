import { expect } from "chai"
import { ethers } from "hardhat"

import { deployMultiSigSmartAccount } from "../utils/deployments"
import { type MultiSigSmartAccount, type MultiSigSmartAccountFactory } from "../../src/typechain"
import { createRandomSchnorrSigner, getSaltHash } from "../utils/helpers"
import { getAllCombinedPubAddressXofY } from "../../aa-schnorr-multisig-sdk/src/helpers/schnorr-helpers"
import type { SchnorrSigner } from "../../aa-schnorr-multisig-sdk/src/signers"
import type { Hex } from "../../aa-schnorr-multisig-sdk/src/types/misc"
import { getAccountImplementationAddress, predictAddressOffchain, predictAddressOnchain, saltToHex } from "../../src/helpers/create2"

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
    const _salt = getSaltHash("shouldfail")
    expect(await factory.getAccountAddress(combinedAddresses, _salt)).to.not.be.eql(contract.address)
  })
  it("should get different address if diferent combined addresses", async function () {
    const random = createRandomSchnorrSigner()
    const _combined: string[] = [random.getAddress()]
    expect(await factory.getAccountAddress(_combined, saltHash)).to.not.be.eql(contract.address)
  })
  it("should return address without creation if account already created", async function () {
    const _salt = getSaltHash("random")
    const _predicted = await factory.getAccountAddress(combinedAddresses, _salt)
    expect(await factory.createAccount(combinedAddresses, _salt))
      .to.emit(factory, "SmartAccountCreated")
      .withArgs(_predicted)

    expect(await factory.createAccount(combinedAddresses, _salt)).to.not.emit(factory, "SmartAccountCreated")
  })
  it("should get account implementation address with helper", async function () {
    const factoryAddress = factory.address as Hex
    const [randomSigner] = await ethers.getSigners()
    const aaImplHelperFct = await getAccountImplementationAddress(factoryAddress, randomSigner)
    const aaImplContractCall = await factory.accountImplementation()

    expect(aaImplHelperFct).to.be.eql(aaImplContractCall)
  })
  it("should predict AA address onchain", async function () {
    const _salt = "randomSalt"
    const _saltHash = getSaltHash(_salt)
    const _predicted = await factory.getAccountAddress(combinedAddresses, _saltHash)

    // check helper function
    const _factoryAddress = factory.address as Hex
    const provider = ethers.provider.getSigner()
    const _predictedByHelper = await predictAddressOnchain(_factoryAddress, combinedAddresses, _salt, provider)

    expect(_predictedByHelper).to.be.eql(_predicted)

    expect(await factory.createAccount(combinedAddresses, _saltHash))
      .to.emit(factory, "SmartAccountCreated")
      .withArgs(_predicted)
  })
  it("should predict AA address offchain", async function () {
    const _salt = "randomSalt"
    const _saltHash = saltToHex(_salt)
    const predictedOnchain = await factory.getAccountAddress(combinedAddresses, _saltHash)
    const factoryAddress = factory.address as Hex
    const accountImplAddress = await factory.accountImplementation()

    const predictedOffchain = predictAddressOffchain(factoryAddress, accountImplAddress, combinedAddresses, _salt)

    expect(predictedOnchain).to.be.eql(predictedOffchain)
  })
})

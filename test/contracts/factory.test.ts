import { expect } from "chai"
import { ethers, deployments } from "hardhat"
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers"

import { deployMultiSigSmartAccount } from "../utils/deployments"
import { type MultiSigSmartAccount, type MultiSigSmartAccountFactory } from "../../src/typechain"
import { createRandomSchnorrSigner, getSaltHash } from "../utils/helpers"
import { getAllCombinedAddrFromSigners } from "../../aa-schnorr-multisig-sdk/src/helpers/schnorr-helpers"
import type { SchnorrSigner } from "../../aa-schnorr-multisig-sdk/src/signers"
import type { Hex } from "../../aa-schnorr-multisig-sdk/src/types/misc"
import {
  getAccountImplementationAddress,
  predictAccountAddrOffchain,
  predictAccountAddrOnchain,
  predictAccountImplementationAddrOffchain,
  predictFactoryAddrOffchain,
  saltToHex,
} from "../../aa-schnorr-multisig-sdk/src/helpers/create2"
import { getEntryPointByChainId } from "../../deploy/helpers/const"

let contract: MultiSigSmartAccount
let combinedAddresses: string[]
let signerOne: SchnorrSigner
let signerTwo: SchnorrSigner
let saltHash: string
let factory: MultiSigSmartAccountFactory
let deployer: SignerWithAddress

describe("Account Factory", function () {
  this.beforeEach("create signers and deploy contract", async function () {
    // get deployer address
    const signers = await ethers.getSigners()
    deployer = signers[0]
    // create signers
    signerOne = createRandomSchnorrSigner()
    signerTwo = createRandomSchnorrSigner()

    // generate pubNonces
    signerOne.generatePubNonces()
    signerTwo.generatePubNonces()

    // generate combined addresses for multisig 2/2
    combinedAddresses = getAllCombinedAddrFromSigners([signerOne, signerTwo], 2)

    // deploy contract with signers
    const { salt, schnorrAA, mssaFactory } = await deployMultiSigSmartAccount(combinedAddresses, undefined, deployer)
    contract = schnorrAA
    saltHash = salt
    factory = mssaFactory
  })
  it("should deploy Factory with deterministic address", async function () {
    const ENTRY_POINT_ADDRESS = getEntryPointByChainId("1337")
    const saltFactory = getSaltHash("aafactorysalt")
    const { deterministic } = deployments
    const { address: deployedAddress } = await deterministic("MultiSigSmartAccountFactory", {
      from: deployer.address,
      args: [ENTRY_POINT_ADDRESS, saltFactory],
      salt: saltFactory,
    })

    const predictedAddr = predictFactoryAddrOffchain(saltFactory)
    expect(predictedAddr).to.be.eql(deployedAddress)
  })
  it("should deploy Factory with deterministic account implemetation address", async function () {
    const ENTRY_POINT_ADDRESS = getEntryPointByChainId("1337")
    const saltFactory = getSaltHash("aafactorysalt")
    const { deterministic } = deployments
    const { address: deployedAddress } = await deterministic("MultiSigSmartAccountFactory", {
      from: deployer.address,
      args: [ENTRY_POINT_ADDRESS, saltFactory],
      salt: saltFactory,
    })

    const Factory = await ethers.getContractFactory("MultiSigSmartAccountFactory")
    const _factory = Factory.attach(deployedAddress)
    const predictedAddrWithParams = predictAccountImplementationAddrOffchain(saltFactory, undefined, ENTRY_POINT_ADDRESS)
    const predictedAddrWithFactoryAddr = predictAccountImplementationAddrOffchain(saltFactory, _factory.address)

    expect(await _factory.accountImplementation()).to.be.eql(predictedAddrWithParams)
    expect(await _factory.accountImplementation()).to.be.eql(predictedAddrWithFactoryAddr)
  })
  it("should generate AA with deterministic address", async function () {
    expect(await factory.getAccountAddress(combinedAddresses, saltHash)).to.be.eql(contract.target)
  })
  it("should get different address if diferent salt", async function () {
    const _salt = getSaltHash("shouldfail")
    expect(await factory.getAccountAddress(combinedAddresses, _salt)).to.not.be.eql(contract.target)
  })
  it("should get different address if diferent combined addresses", async function () {
    const random = createRandomSchnorrSigner()
    const _combined: string[] = [random.getAddress()]
    expect(await factory.getAccountAddress(_combined, saltHash)).to.not.be.eql(contract.target)
  })
  it("should return address without creation if account already created", async function () {
    const _salt = getSaltHash("aasaltdifferent")
    const _predicted = await factory.getAccountAddress(combinedAddresses, _salt)
    const tx = factory.createAccount(combinedAddresses, _salt)
    await expect(tx).to.emit(factory, "MultiSigSmartAccountCreated").withArgs(_predicted)
    const tx2 = factory.createAccount(combinedAddresses, _salt)
    await expect(tx2).to.not.emit(factory, "MultiSigSmartAccountCreated")
  })
  it("should get account implementation address with helper", async function () {
    console.log(factory.target)
    const factoryAddress = factory.target as Hex
    const [randomSigner] = await ethers.getSigners()
    const aaImplHelperFct = await getAccountImplementationAddress(factoryAddress, randomSigner)
    const aaImplContractCall = await factory.accountImplementation()

    expect(aaImplHelperFct).to.be.eql(aaImplContractCall)
  })
  it("should predict AA address onchain", async function () {
    const _salt = "aasaltdifferent"
    const _saltHash = getSaltHash(_salt)
    const _predicted = await factory.getAccountAddress(combinedAddresses, _saltHash)

    // check helper function
    const _factoryAddress = factory.target as Hex
    const provider = await ethers.provider.getSigner()
    const _predictedByHelper = await predictAccountAddrOnchain(_factoryAddress, combinedAddresses, _salt, provider)
    expect(_predictedByHelper).to.be.eql(_predicted)

    const tx = factory.createAccount(combinedAddresses, _saltHash)
    await expect(tx).to.emit(factory, "MultiSigSmartAccountCreated").withArgs(_predicted)
  })
  it("should predict AA address offchain", async function () {
    const _salt = "aasalt"
    const _saltHash = saltToHex(_salt)
    const predictedOnchain = await factory.getAccountAddress(combinedAddresses, _saltHash)
    const factoryAddress = factory.target as Hex
    const accountImplAddress = await factory.accountImplementation()

    const predictedOffchain = predictAccountAddrOffchain(factoryAddress, accountImplAddress, combinedAddresses, _salt)

    expect(predictedOnchain).to.be.eql(predictedOffchain)
  })
})

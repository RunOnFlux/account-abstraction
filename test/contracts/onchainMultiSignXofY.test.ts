import { expect } from "chai"
import { deployMultiSigSmartAccount } from "../utils/deployments"
import { ERC1271_INVALID_SIGNATURE, ERC1271_MAGICVALUE_BYTES32, SIGNER_ROLE_HASH, pk1, pk2, pk3 } from "../utils/config"
import { ethers } from "ethers"
import { MultiSigSmartAccount } from "../../src/typechain"
import { SchnorrSigner } from "../../aa-schnorr-multisig-sdk/src/signers"
import { createRandomSchnorrSigner } from "../utils/helpers"
import {
  createSchnorrSigner,
  generateCombinedPubAddress,
  generateCombinedSigDataAndHash,
  generateSingleSigDataAndHash,
  getAllCombinedPubAddressXofY,
  hashMsgKeccak256,
} from "../../aa-schnorr-multisig-sdk/src/helpers/schnorr-helpers"
import { Key } from "../../aa-schnorr-multisig-sdk/src/types"

let contract: MultiSigSmartAccount
let combinedAdd12: string
let combinedAdd13: string
let combinedAdd23: string
let combinedAdd123: string
let combinedAddresses: string[]
let signerOne: SchnorrSigner
let signerTwo: SchnorrSigner
let signerThree: SchnorrSigner
let msg: string

describe("Multi Sign Tests: 3 out of 3 signers", function () {
  this.beforeEach("create signers and deploy contract", async function () {
    msg = "just a test message"

    // create signers
    signerOne = createRandomSchnorrSigner()
    signerTwo = createRandomSchnorrSigner()
    signerThree = createRandomSchnorrSigner()

    // generate pubNonces
    signerOne.generatePubNonces()
    signerTwo.generatePubNonces()
    signerThree.generatePubNonces()

    // generate combined addresses for multisig 3/3
    combinedAddresses = getAllCombinedPubAddressXofY([signerOne, signerTwo, signerThree], 3)

    // deploy contract with signers
    const schnorrAA = await deployMultiSigSmartAccount(combinedAddresses)
    contract = schnorrAA.schnorrAA
  })
  it("should generate only one combined address and set as signer (3/3)", async function () {
    ;[combinedAdd123, combinedAdd23, combinedAdd13, combinedAdd12] = combinedAddresses

    // check if combined addresses are undefined
    expect(combinedAdd12).to.be.undefined
    expect(combinedAdd13).to.be.undefined
    expect(combinedAdd23).to.be.undefined

    expect(await contract.hasRole(SIGNER_ROLE_HASH, combinedAdd123)).to.be.eq(true)
  })
  it("should generate a schnorr musig and validate onchain: 3/3", async function () {
    // 3 of 3
    const { sigData, msgHash } = await generateCombinedSigDataAndHash([signerOne, signerTwo, signerThree], msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })
  it("should FAIL if generate a schnorr musig (signer 1 and 2) and validate onchain: 2/3", async function () {
    // 2 of 3: signer1 and signer2
    const { sigData, msgHash } = await generateCombinedSigDataAndHash([signerOne, signerTwo], msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_INVALID_SIGNATURE)
  })
  it("should FAIL if generate a schnorr musig (signer 1 and 3) and validate onchain: 2/3", async function () {
    // 2 of 3: signer2 and signer3
    const { sigData, msgHash } = await generateCombinedSigDataAndHash([signerOne, signerThree], msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_INVALID_SIGNATURE)
  })
  it("should FAIL if generate a schnorr musig (signer 2 and 3) and validate onchain: 2/3", async function () {
    // 2 of 3: signer2 and signer3
    const { sigData, msgHash } = await generateCombinedSigDataAndHash([signerTwo, signerThree], msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_INVALID_SIGNATURE)
  })
  it("should FAIL if generate a schnorr single sig: 1/3", async function () {
    // 2 of 3: signer2 and signer3
    const { sigData, msgHash } = await generateSingleSigDataAndHash(signerOne, msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_INVALID_SIGNATURE)
  })
  it("should FAIL if msgHash is different than msg signed", async function () {
    // 3 of 3
    const invalidMsgHash = hashMsgKeccak256("malicious msg")
    const { sigData, msgHash } = await generateCombinedSigDataAndHash([signerOne, signerTwo, signerThree], msg)
    expect(invalidMsgHash).to.be.not.equal(msgHash)
    const result = await contract.isValidSignature(invalidMsgHash, sigData)
    expect(result).to.equal(ERC1271_INVALID_SIGNATURE)
  })
})

describe("Multi Sign Tests: 2 out of 3 signers", function () {
  this.beforeEach("create signers and deploy contract", async function () {
    msg = "just a test message"

    // create signers
    signerOne = createSchnorrSigner(new Key(Buffer.from(ethers.utils.arrayify(pk1))).buffer)
    signerTwo = createSchnorrSigner(new Key(Buffer.from(ethers.utils.arrayify(pk2))).buffer)
    signerThree = createSchnorrSigner(new Key(Buffer.from(ethers.utils.arrayify(pk3))).buffer)

    // generate pubNonces
    signerOne.generatePubNonces()
    signerTwo.generatePubNonces()
    signerThree.generatePubNonces()

    // generate combined addresses for multisig 2/3
    // instead of generating all combines (as below) - generate specified pairs to check signatures
    // combinedAddresses = getAllCombinedPubAddressXofY([signerOne, signerTwo, signerThree], 2)
    combinedAdd123 = generateCombinedPubAddress([signerOne, signerTwo, signerThree])
    combinedAdd12 = generateCombinedPubAddress([signerOne, signerTwo])
    combinedAdd13 = generateCombinedPubAddress([signerOne, signerThree])
    combinedAdd23 = generateCombinedPubAddress([signerTwo, signerThree])

    // deploy contract with signers - COMBINED SIGNER 'combinedAdd23' NOT INVOLVED
    const schnorrAA = await deployMultiSigSmartAccount([combinedAdd123, combinedAdd12, combinedAdd13])
    contract = schnorrAA.schnorrAA
  })
  it("should generate different combined addresses and set as signers", async function () {
    // check if combined addresses differ
    expect(combinedAdd123).not.eqls(combinedAdd12)
    expect(combinedAdd12).not.eqls(combinedAdd23)
    expect(combinedAdd12).not.eqls(combinedAdd13)

    expect(await contract.hasRole(SIGNER_ROLE_HASH, combinedAdd123)).to.be.eq(true)
    expect(await contract.hasRole(SIGNER_ROLE_HASH, combinedAdd12)).to.be.eq(true)
    expect(await contract.hasRole(SIGNER_ROLE_HASH, combinedAdd13)).to.be.eq(true)
  })
  it("should generate a schnorr musig and validate onchain: 3/3", async function () {
    // 3 of 3
    const { sigData, msgHash } = await generateCombinedSigDataAndHash([signerOne, signerTwo, signerThree], msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })
  it("should generate a schnorr musig (signer 1 and 2) and validate onchain: 2/3", async function () {
    // 2 of 3: signer1 and signer2
    const { sigData, msgHash } = await generateCombinedSigDataAndHash([signerOne, signerTwo], msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })
  it("should generate a schnorr musig (signer 1 and 3) and validate onchain: 2/3", async function () {
    // 2 of 3: signer2 and signer3
    const { sigData, msgHash } = await generateCombinedSigDataAndHash([signerOne, signerThree], msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })
  it("should FAIL if signer not set in contract", async function () {
    expect(await contract.hasRole(SIGNER_ROLE_HASH, combinedAdd23)).to.be.eq(false)
  })
  it("should FAIL if generate a schnorr musig out of not valid signer address", async function () {
    // 2 of 3: signer2 and signer3
    const { sigData, msgHash } = await generateCombinedSigDataAndHash([signerTwo, signerThree], msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_INVALID_SIGNATURE)
  })
  it("should FAIL if generate a schnorr single sig: 1/3", async function () {
    // 2 of 3: signer2 and signer3
    const { sigData, msgHash } = await generateSingleSigDataAndHash(signerOne, msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_INVALID_SIGNATURE)
  })
})

describe("Multi Sign Tests: 1 out of 3 signers", function () {
  this.beforeEach("create signers and deploy contract", async function () {
    msg = "just a test message"

    // create signers
    signerOne = createRandomSchnorrSigner()
    signerTwo = createRandomSchnorrSigner()
    signerThree = createRandomSchnorrSigner()

    // generate pubNonces
    signerOne.generatePubNonces()
    signerTwo.generatePubNonces()
    signerThree.generatePubNonces()

    // generate combined addresses for multisig 3/3
    combinedAddresses = getAllCombinedPubAddressXofY([signerOne, signerTwo, signerThree], 1)

    // deploy contract with signers
    const schnorrAA = await deployMultiSigSmartAccount(combinedAddresses)
    contract = schnorrAA.schnorrAA
  })

  it("should generate a schnorr musig and validate onchain: 3/3", async function () {
    // 3 of 3
    const { sigData, msgHash } = await generateCombinedSigDataAndHash([signerOne, signerTwo, signerThree], msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })
  it("should generate a schnorr musig (signer 1 and 2) and validate onchain: 2/3", async function () {
    // 2 of 3: signer1 and signer2
    const { sigData, msgHash } = await generateCombinedSigDataAndHash([signerOne, signerTwo], msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })
  it("should generate a schnorr musig (signer 1): 1/3", async function () {
    // 2 of 3: signer2 and signer3
    const { sigData, msgHash } = await generateSingleSigDataAndHash(signerOne, msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })
  it("should generate a schnorr musig (signer 2): 1/3", async function () {
    // 2 of 3: signer2 and signer3
    const { sigData, msgHash } = await generateSingleSigDataAndHash(signerTwo, msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })
})

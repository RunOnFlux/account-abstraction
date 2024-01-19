import { expect } from "chai"
import { ethers, hashMessage } from "ethers"
import Schnorrkel from "../../src/index"
import DefaultSigner from "../../utils/DefaultSigner"
import { _generatePk } from "../../src/core"
import { deploySchnorrAA } from "../deployments"
import {
  generateCombinedPubAddress,
  generateCombinedSigDataAndHash,
  generateSingleSigDataAndHash,
  getAllCombinedPubAddressXofY,
} from "../../src/utils/schnorr-helpers"
import { SchnorrAccountAbstraction } from "../../typechain-types"

const ERC1271_MAGICVALUE_BYTES32 = "0x1626ba7e"
const ERC1271_INVALID_SIGNATURE = "0xffffffff"
const HEX_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000"
const HEX_ONE = "0x0000000000000000000000000000000000000000000000000000000000000001"

let contract: SchnorrAccountAbstraction
let combinedAdd12: string
let combinedAdd13: string
let combinedAdd23: string
let combinedAdd123: string
let combinedAddresses: string[]
let signerOne: DefaultSigner
let signerTwo: DefaultSigner
let signerThree: DefaultSigner
let msg: string

describe("Multi Sign Tests: 3 out of 3 signers", function () {
  before("create signers and deploy contract", async function () {
    msg = "just a test message"

    // create signers
    signerOne = new DefaultSigner(1)
    signerTwo = new DefaultSigner(2)
    signerThree = new DefaultSigner(3)

    // generate combined addresses for multisig 3/3
    combinedAddresses = getAllCombinedPubAddressXofY([signerOne, signerTwo, signerThree], 2)

    // deploy contract with signers
    const schnorrAA = await deploySchnorrAA(combinedAddresses)
    contract = schnorrAA.schnorrAA
  })
  it("should generate different combined addresses and set as signers", async function () {
    ;[combinedAdd123, combinedAdd23, combinedAdd13, combinedAdd12] = combinedAddresses

    // check if combined addresses differ
    expect(combinedAdd123).not.eqls(combinedAdd12)
    expect(combinedAdd12).not.eqls(combinedAdd23)
    expect(combinedAdd12).not.eqls(combinedAdd13)

    let isSigner = await contract.signers(combinedAdd123)
    expect(isSigner).to.equal(HEX_ONE)
    isSigner = await contract.signers(combinedAdd12)
    expect(isSigner).to.equal(HEX_ONE)
    isSigner = await contract.signers(combinedAdd13)
    expect(isSigner).to.equal(HEX_ONE)
    isSigner = await contract.signers(combinedAdd23)
    expect(isSigner).to.equal(HEX_ONE)
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
  it("should generate a schnorr musig (signer 2 and 3) and validate onchain: 2/3", async function () {
    // 2 of 3: signer2 and signer3
    const { sigData, msgHash } = await generateCombinedSigDataAndHash([signerTwo, signerThree], msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })
  it("should fail if generate a schnorr single sig: 1/3", async function () {
    // 2 of 3: signer2 and signer3
    const { sigData, msgHash } = await generateSingleSigDataAndHash(signerOne, msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_INVALID_SIGNATURE)
  })
  it("should fail if msgHash is different than msg signed", async function () {
    // 3 of 3
    const invalidMsgHash = hashMessage("malicious msg")
    const { sigData, msgHash } = await generateCombinedSigDataAndHash([signerOne, signerTwo, signerThree], msg)
    expect(msgHash).to.not.eqls(invalidMsgHash)
    const result = await contract.isValidSignature(invalidMsgHash, sigData)
    expect(result).to.equal(ERC1271_INVALID_SIGNATURE)
  })
})

describe("Multi Sign Tests: 2 out of 3 signers", function () {
  before("create signers and deploy contract", async function () {
    msg = "just a test message"

    // create signers
    signerOne = new DefaultSigner(1)
    signerTwo = new DefaultSigner(2)
    signerThree = new DefaultSigner(3)

    // generate combined addresses for multisig 2/3
    // instead of generating all combines (as below) - generate specified pairs to check signatures
    // combinedAddresses = getAllCombinedPubAddressXofY([signerOne, signerTwo, signerThree], 2)
    combinedAdd123 = generateCombinedPubAddress([signerOne, signerTwo, signerThree])
    combinedAdd12 = generateCombinedPubAddress([signerOne, signerTwo])
    combinedAdd13 = generateCombinedPubAddress([signerOne, signerThree])
    combinedAdd23 = generateCombinedPubAddress([signerTwo, signerThree])

    // deploy contract with signers - COMBINED SIGNER 'combinedAdd23' NOT INVOLVED
    const schnorrAA = await deploySchnorrAA([combinedAdd123, combinedAdd12, combinedAdd13])
    contract = schnorrAA.schnorrAA
  })
  it("should generate different combined addresses and set as signers", async function () {
    // check if combined addresses differ
    expect(combinedAdd123).not.eqls(combinedAdd12)
    expect(combinedAdd12).not.eqls(combinedAdd23)
    expect(combinedAdd12).not.eqls(combinedAdd13)

    let isSigner = await contract.signers(combinedAdd123)
    expect(isSigner).to.equal(HEX_ONE)
    isSigner = await contract.signers(combinedAdd12)
    expect(isSigner).to.equal(HEX_ONE)
    isSigner = await contract.signers(combinedAdd13)
    expect(isSigner).to.equal(HEX_ONE)
  })
  it("should fail if signer not set in contract", async function () {
    let isSigner = await contract.signers(combinedAdd23)
    expect(isSigner).to.equal(HEX_ZERO)
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
  it("should fail if generate a schnorr musig out of not valid signer address", async function () {
    // 2 of 3: signer2 and signer3
    const { sigData, msgHash } = await generateCombinedSigDataAndHash([signerTwo, signerThree], msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_INVALID_SIGNATURE)
  })
  it("should fail if generate a schnorr single sig: 1/3", async function () {
    // 2 of 3: signer2 and signer3
    const { sigData, msgHash } = await generateSingleSigDataAndHash(signerOne, msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_INVALID_SIGNATURE)
  })
})

describe("Multi Sign Tests: 1 out of 3 signers", function () {
  before("create signers and deploy contract", async function () {
    msg = "just a test message"

    // create signers
    signerOne = new DefaultSigner(1)
    signerTwo = new DefaultSigner(2)
    signerThree = new DefaultSigner(3)

    // generate combined addresses for multisig 1/3
    combinedAddresses = getAllCombinedPubAddressXofY([signerOne, signerTwo, signerThree], 1)

    // deploy contract with signers - COMBINED SIGNER 'combinedAdd23' NOT INVOLVED
    const schnorrAA = await deploySchnorrAA(combinedAddresses)
    contract = schnorrAA.schnorrAA
  })
  it("should fail if signer not set in contract", async function () {
    let isSigner = await contract.signers(combinedAdd23)
    expect(isSigner).to.equal(HEX_ZERO)
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

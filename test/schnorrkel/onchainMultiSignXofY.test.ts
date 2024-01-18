import { expect } from "chai"
import { ethers } from "ethers"
import Schnorrkel from "../../src/index"
import DefaultSigner from "../../utils/DefaultSigner"
import { _generatePk } from "../../src/core"
import { deploySchnorrAA } from "../deployments"
import { generateCombinedPubAddress, generateCombinedSigDataAndHash, getAllCombinedPubAddressXofY } from "../../src/utils/schnorr-helpers"

const ERC1271_MAGICVALUE_BYTES32 = "0x1626ba7e"
const ERC1271_INVALID_SIGNATURE = "0xffffffff"
const HEX_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000"
const HEX_ONE = "0x0000000000000000000000000000000000000000000000000000000000000001"

describe("Multi Sign Tests: X of Y signers", function () {
  it("should generate a schnorr musig2 and validate it on the blockchain", async function () {
    // deploy the contract
    const signerOne = new DefaultSigner(0)
    const signerTwo = new DefaultSigner(1)
    const combinedAddress = generateCombinedPubAddress([signerOne, signerTwo])
    const { schnorrAA: contract } = await deploySchnorrAA([combinedAddress])

    const isSigner = await contract.signers(combinedAddress)
    expect(isSigner).to.equal(HEX_ONE)

    const msg = "just a test message"
    const publicKeys = [signerOne.getPublicKey(), signerTwo.getPublicKey()]
    const publicNonces = [signerOne.getPublicNonces(), signerTwo.getPublicNonces()]
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const { signature: sigOne, challenge: e, finalPublicNonce } = signerOne.multiSignMessage(msg, publicKeys, publicNonces)
    const { signature: sigTwo } = signerTwo.multiSignMessage(msg, publicKeys, publicNonces)
    const sSummed = Schnorrkel.sumSigs([sigOne, sigTwo])

    // the multisig px and parity
    const px = ethers.hexlify(combinedPublicKey.buffer.subarray(1, 33))
    const combinedPublicAddress = "0x" + px.slice(px.length - 40, px.length)

    const parity = combinedPublicKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new ethers.AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sSummed.buffer, parity])
    const msgHash = ethers.solidityPackedKeccak256(["string"], [msg])
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })
  it("should generate a schnorr musig2 X of Y and validate onchain", async function () {
    const msg = "just a test message"
    // create signers
    const signerOne = new DefaultSigner(1)
    const signerTwo = new DefaultSigner(2)
    const signerThree = new DefaultSigner(3)

    const combinedAddress = generateCombinedPubAddress([signerOne, signerTwo, signerThree])
    const combinedAdd12 = generateCombinedPubAddress([signerOne, signerTwo])
    const combinedAdd13 = generateCombinedPubAddress([signerOne, signerThree])
    const combinedAdd23 = generateCombinedPubAddress([signerTwo, signerThree])

    // check if combined addresses differ
    expect(combinedAddress).not.eqls(combinedAdd12)
    expect(combinedAddress).not.eqls(combinedAdd23)
    expect(combinedAddress).not.eqls(combinedAdd13)

    // deploy contract with signers: 3/3 or signer1+signer2
    const { schnorrAA: contract } = await deploySchnorrAA([combinedAdd12, combinedAddress])

    let isSigner = await contract.signers(combinedAddress)
    expect(isSigner).to.equal(HEX_ONE)
    isSigner = await contract.signers(combinedAdd12)
    expect(isSigner).to.equal(HEX_ONE)
    isSigner = await contract.signers(combinedAdd13)
    expect(isSigner).to.equal(HEX_ZERO)
    isSigner = await contract.signers(combinedAdd23)
    expect(isSigner).to.equal(HEX_ZERO)

    // 3 of 3
    const { sigData, msgHash } = await generateCombinedSigDataAndHash([signerOne, signerTwo, signerThree], msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)

    // ----------------- X of Y -----------------
    // 2 of 3: signer1 and signer2
    const { sigData: sigData12, msgHash: msgHash12 } = await generateCombinedSigDataAndHash([signerOne, signerTwo], msg)
    const result12 = await contract.isValidSignature(msgHash12, sigData12)
    expect(result12).to.equal(ERC1271_MAGICVALUE_BYTES32)

    // 2 of 3: signer2 and signer3
    // combined pub keys NOT passed as signer
    const { sigData: sigData23, msgHash: msgHash23 } = await generateCombinedSigDataAndHash([signerTwo, signerThree], msg)
    const result23 = await contract.isValidSignature(msgHash23, sigData23)
    expect(result23).to.equal(ERC1271_INVALID_SIGNATURE)

    // 2 of 3: signer1 and signer3
    // combined pub keys NOT passed as signer
    const { sigData: sigData13, msgHash: msgHash13 } = await generateCombinedSigDataAndHash([signerOne, signerThree], msg)
    const result13 = await contract.isValidSignature(msgHash13, sigData13)
    expect(result13).to.equal(ERC1271_INVALID_SIGNATURE)
  })
  it("should generate X of Y signatures and validate onchain", async function () {
    const msg = "just a test message"
    // create signers
    const signerOne = new DefaultSigner(1)
    const signerTwo = new DefaultSigner(2)
    const signerThree = new DefaultSigner(3)

    // get all combined addresses for 2/3 multisig
    const combinedAddresses = getAllCombinedPubAddressXofY([signerOne, signerTwo, signerThree], 2)

    // deploy contract with signers: 2/3
    const { schnorrAA: contract } = await deploySchnorrAA(combinedAddresses)

    let isSigner = await contract.signers(combinedAddresses[0])
    expect(isSigner).to.equal(HEX_ONE)
    isSigner = await contract.signers(combinedAddresses[1])
    expect(isSigner).to.equal(HEX_ONE)
    isSigner = await contract.signers(combinedAddresses[2])
    expect(isSigner).to.equal(HEX_ONE)
    isSigner = await contract.signers(combinedAddresses[3])
    expect(isSigner).to.equal(HEX_ONE)

    // 3 of 3
    const { sigData, msgHash } = await generateCombinedSigDataAndHash([signerOne, signerTwo, signerThree], msg)
    const result = await contract.isValidSignature(msgHash, sigData)
    expect(result).to.equal(ERC1271_MAGICVALUE_BYTES32)

    // ----------------- X of Y -----------------
    // 2 of 3: signer1 and signer2
    const { sigData: sigData12, msgHash: msgHash12 } = await generateCombinedSigDataAndHash([signerOne, signerTwo], msg)
    const result12 = await contract.isValidSignature(msgHash12, sigData12)
    expect(result12).to.equal(ERC1271_MAGICVALUE_BYTES32)

    // 2 of 3: signer2 and signer3
    // combined pub keys NOT passed as signer
    const { sigData: sigData23, msgHash: msgHash23 } = await generateCombinedSigDataAndHash([signerTwo, signerThree], msg)
    const result23 = await contract.isValidSignature(msgHash23, sigData23)
    expect(result23).to.equal(ERC1271_MAGICVALUE_BYTES32)
  })
})

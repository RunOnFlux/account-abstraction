import { ethers } from "ethers"
import Schnorrkel from "../schnorrkel"
import DefaultSigner from "../types/DefaultSigner"
import { Challenge, Key, PublicNonces, Signature, SignatureOutput } from "../types"
import { _generatePk } from "../core"

export function generateCombinedPubAddress(signers: any[]) {
  // get the public key
  const pubKeys = signers.map((signer) => signer.getPublicKey())

  const combinedPublicKey = Schnorrkel.getCombinedPublicKey(pubKeys)
  const px = ethers.hexlify(combinedPublicKey.buffer.subarray(1, 33))
  const combinedAddress = "0x" + px.slice(px.length - 40, px.length)

  return combinedAddress
}

export async function generateSingleSigDataAndHash(signer: DefaultSigner, msg: string) {
  // generate signature for a signer
  const signatureOutput: SignatureOutput = signer.signMessage(msg)

  // the multisig px and parity
  const pk = signer.getPublicKey().buffer
  const px = ethers.hexlify(pk.subarray(1, 33))
  const parity = pk[0] - 2 + 27
  const { challenge: e, signature } = signatureOutput

  // wrap the result
  const abiCoder = new ethers.AbiCoder()
  const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, signature.buffer, parity])
  const msgHash = ethers.solidityPackedKeccak256(["string"], [msg])

  return { sigData, msgHash }
}

export async function generateCombinedSigDataAndHash(signers: DefaultSigner[], msg: string) {
  const publicKeys: Key[] = signers.map((signer) => signer.getPublicKey())
  const publicNonces: PublicNonces[] = signers.map((signer) => signer.getPublicNonces())
  const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)

  // generate signature for every signer
  const signatureOutputs: SignatureOutput[] = signers.map((signer) => signer.multiSignMessage(msg, publicKeys, publicNonces))
  const signatures: Signature[] = signatureOutputs.map((sig) => sig.signature)
  const challenges: Challenge[] = signatureOutputs.map((sig) => sig.challenge)
  const e = challenges[0] // challenge for every signer is the same

  // sum signatures
  const sSummed = Schnorrkel.sumSigs(signatures)

  // the multisig px and parity
  const px = ethers.hexlify(combinedPublicKey.buffer.subarray(1, 33))
  const parity = combinedPublicKey.buffer[0] - 2 + 27

  // wrap the result
  const abiCoder = new ethers.AbiCoder()
  const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sSummed.buffer, parity])
  const msgHash = ethers.solidityPackedKeccak256(["string"], [msg])

  return { sigData, msgHash }
}

export function getAllCombinedPubAddressXofY(signers: DefaultSigner[], x: number) {
  // example X of Y signers defined as [A, B, C]
  // 3 of 3: [ABC]
  // 2 of 3: [AB, AC, BC, ABC]
  // 1 of 3: [A, B, C, AB, AC, BC, ABC]

  // create array of possible signers combinations limited by given X out of Y multisignature
  const allSignersCombos: DefaultSigner[][] = getAllCombos(signers).filter((combo) => combo.length >= x)
  const allCombinedAddresses = allSignersCombos.map((signersCombo) =>
    signersCombo.length > 1 ? generateCombinedPubAddress(signersCombo) : _generatePk(signersCombo[0].getPublicKey().buffer)
  )

  return allCombinedAddresses
}

export function getAllCombos(arr: any[]): any[] {
  if (arr[0] === undefined) return [arr]
  return getAllCombos(arr.slice(1)).flatMap((el) => [el.concat(arr[0]), el])
}

export const hashMsgKeccak256 = (message: string): string => {
  return ethers.solidityPackedKeccak256(["string"], [message])
}

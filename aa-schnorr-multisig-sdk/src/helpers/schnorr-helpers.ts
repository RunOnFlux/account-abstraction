/* eslint-disable @typescript-eslint/no-explicit-any */
import { ethers } from "ethers"

import { Key } from "../types"
import { _generatePk } from "../core"
import { SchnorrSigner, Schnorrkel } from "../signers"
import type { Challenge, PublicNonces, SchnorrSignature, SignatureOutput } from "../types"

export function createSchnorrSigner(_privKey: Uint8Array): SchnorrSigner {
  return new SchnorrSigner(_privKey)
}

export function sumSchnorrSigs(signatures: SchnorrSignature[]): SchnorrSignature {
  return Schnorrkel.sumSigs(signatures)
}

export function pubKey2Address(publicKey: Key): string {
  const px = ethers.utils.hexlify(publicKey.buffer.subarray(1, 33))
  const address = `0x${px.slice(-40, px.length)}`
  return address
}

export function pKeyString2Key(pK: string): Key {
  return new Key(Buffer.from(ethers.utils.arrayify(pK)))
}

function _getCombos(arr: any[]): any[] {
  if (arr[0] === undefined) return [arr]
  return _getCombos(arr.slice(1)).flatMap((element) => [element.concat(arr[0]), element])
}

/**
 * create array of possible combinations, optionally limited by given X (out of Y)
 * example X of Y array defined as [A, B, C]
 * 3 of 3: [ABC]
 * 2 of 3: [AB, AC, BC, ABC]
 * 1 of 3: [A, B, C, AB, AC, BC, ABC]
 */
export function getAllCombos(arr: any[], x: number = 1): any[] {
  const allCombos = _getCombos(arr)
  return allCombos.filter((combo) => combo.length >= x)
}

/**
 * generate combined public address out of all given Schnorr signers' addresses
 */
export function generateCombinedPubAddress(signers: SchnorrSigner[]): string {
  // get the public key
  const pubKeys = signers.map((signer) => signer.getPubKey())

  const combinedPublicKey = Schnorrkel.getCombinedPublicKey(pubKeys)
  const px = ethers.utils.hexlify(combinedPublicKey.buffer.subarray(1, 33))
  const combinedAddress = `0x${px.slice(-40, px.length)}`

  return combinedAddress
}

/**
 * generate single signature data
 * can be used only if 1 single is defined for Schnorr signature
 */
export function generateSingleSigDataAndHash(signer: SchnorrSigner, msg: string): { sigData: string; msgHash: string } {
  // generate signature for a signer
  const signatureOutput: SignatureOutput = signer.signMessage(msg)

  // the multisig px and parity
  const pk = signer.getPubKey().buffer
  const px = ethers.utils.hexlify(pk.subarray(1, 33))
  const parity = pk[0] - 2 + 27
  const { challenge, signature } = signatureOutput

  // wrap the result
  const abiCoder = new ethers.utils.AbiCoder()
  const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, challenge.buffer, signature.buffer, parity])
  const msgHash = ethers.utils.solidityKeccak256(["string"], [msg])

  return { sigData, msgHash }
}

/**
 * generate combined signature data
 * FOR TESTING PURPOSE ONLY!
 * it's not possible to sign msg by every signer at once within single function
 */
export function generateCombinedSigDataAndHash(signers: SchnorrSigner[], msg: string): { sigData: string; msgHash: string } {
  const publicKeys: Key[] = signers.map((signer) => signer.getPubKey())
  const publicNonces: PublicNonces[] = signers.map((signer) => signer.getPubNonces())
  const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)

  // generate signature for every signer
  const signatureOutputs: SignatureOutput[] = signers.map((signer) => signer.signMultiSigMsg(msg, publicKeys, publicNonces))
  const signatures: SchnorrSignature[] = signatureOutputs.map((sig) => sig.signature)
  const challenges: Challenge[] = signatureOutputs.map((sig) => sig.challenge)
  const challenge = challenges[0] // challenge for every signer is the same

  // sum signatures
  const sSummed = Schnorrkel.sumSigs(signatures)

  // the multisig px and parity
  const px = ethers.utils.hexlify(combinedPublicKey.buffer.subarray(1, 33))
  const parity = combinedPublicKey.buffer[0] - 2 + 27

  // wrap the result
  const abiCoder = new ethers.utils.AbiCoder()
  const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, challenge.buffer, sSummed.buffer, parity])
  const msgHash = ethers.utils.solidityKeccak256(["string"], [msg])
  return { sigData, msgHash }
}

/**
 * create array of possible Schnorr combined public addresses combinations
 * optionally limited by given X (out of Y)
 */
export function getAllCombinedPubAddressXofY(signers: SchnorrSigner[], x?: number): string[] {
  const allSignersCombos: SchnorrSigner[][] = getAllCombos(signers, x)
  const allCombinedAddresses = allSignersCombos.map((signersCombo) =>
    signersCombo.length > 1 ? generateCombinedPubAddress(signersCombo) : _generatePk(signersCombo[0].getPubKey().buffer)
  )

  return allCombinedAddresses
}

/**
 * create array of possible Schnorr combined public keys combinations
 * optionally limited by given X (out of Y)
 */
export function getAllCombinedPubKeysXofY(signers: SchnorrSigner[], x?: number): Key[] {
  if (signers.length < 2) throw new Error("At least 2 signers should be provided")

  const allSignersCombos: SchnorrSigner[][] = getAllCombos(signers, x)
  const publicKeysCombos: Key[][] = allSignersCombos.map((s) => s.map((signer) => signer.getPubKey()))
  const allCombinedPubKeys = publicKeysCombos.map((publicKeys) => Schnorrkel.getCombinedPublicKey(publicKeys))

  return allCombinedPubKeys
}

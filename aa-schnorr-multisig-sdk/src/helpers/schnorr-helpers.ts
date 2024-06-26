/* eslint-disable @typescript-eslint/no-explicit-any */
import { AbiCoder, ethers } from "ethers"

import { Key } from "../types"
import { _generatePk } from "../core"
import { SchnorrSigner, Schnorrkel } from "../signers"
import type { Challenge, PublicNonces, SchnorrSignature, SignatureOutput } from "../types"
import type { Hex } from "../types/misc"

/**
 * Creates new Schnorr Signer from given private key.
 * @param privKey private key hexadecimal value
 * @returns Schnorr Signer
 */
export function createSchnorrSigner(privKey: Hex): SchnorrSigner {
  const privKeyBuffer = new Key(Buffer.from(ethers.getBytes(privKey))).buffer
  return new SchnorrSigner(privKeyBuffer)
}

/**
 * Creates the summed signature from all given Schnorr signatures.
 * @param signatures array of Schnorr signatures
 * @returns summed signature
 */
export function sumSchnorrSigs(signatures: SchnorrSignature[]): SchnorrSignature {
  return Schnorrkel.sumSigs(signatures)
}

/**
 * Internal function to create all combinations from given array of objects.
 * @param arr array of any given objects (array length = Y)
 * @returns all possible combinatyions
 */
function _getCombos(arr: any[]): any[] {
  // eslint-disable-next-line no-undefined
  if (arr[0] === undefined) return [arr]
  return _getCombos(arr.slice(1)).flatMap((element) => [element.concat(arr[0]), element])
}

/**
 * Creates an array of possible combinations. Optionally limited by given X (out of Y).
 *
 * @param arr array of any given objects (array length = Y)
 * @param x minimum combination length for X of Y (default = 1)
 * @returns all possible combinations limited by given x
 *
 * @example
 * X of Y array defined as [A, B, C]
 * 3 of 3: [ABC]
 * 2 of 3: [AB, AC, BC, ABC]
 * 1 of 3: [A, B, C, AB, AC, BC, ABC]
 *
 */
export function getAllCombos(arr: any[], x: number = 1): any[] {
  const allCombos = _getCombos(arr)
  return allCombos.filter((combo) => combo.length >= x)
}

/**
 * Generates combined public address out of all given Schnorr signers' addresses.
 *
 * @param signers array of Schnorr signers
 * @returns combined address
 */
export function getCombinedAddrFromSigners(signers: SchnorrSigner[]): string {
  // get the public key
  const pubKeys = signers.map((signer) => signer.getPubKey())
  return getCombinedAddrFromKeys(pubKeys)
}

/**
 * Generates combined public address out of all given Schnorr signers' public keys.
 *
 * @param pubKeys array of signers' public keys
 * @returns combined address
 */
export function getCombinedAddrFromKeys(pubKeys: Key[]): Hex {
  const combinedPublicKey = Schnorrkel.getCombinedPublicKey(pubKeys)
  const px = ethers.hexlify(combinedPublicKey.buffer.subarray(1, 33))
  const combinedAddress = `0x${px.slice(-40, px.length)}` as Hex

  return combinedAddress
}

/**
 * generate single signature data
 * can be used only if 1 single is defined for Schnorr signature
 */

/**
 * Generates a single signature data for single Schnorr signer.
 *
 * @param signer Schnorr signer which signs the message
 * @param msg message to be signed
 * @returns sigData and msgHash
 */
export function generateSingleSigDataAndHash(signer: SchnorrSigner, msg: string): { sigData: string; msgHash: string } {
  // generate signature for a signer
  const signatureOutput: SignatureOutput = signer.signMessage(msg)

  // the multisig px and parity
  const pk = signer.getPubKey().buffer
  const px = ethers.hexlify(pk.subarray(1, 33))
  const parity = pk[0] - 2 + 27
  const { challenge, signature } = signatureOutput

  // wrap the result
  const abiCoder = new AbiCoder()
  const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, challenge.buffer, signature.buffer, parity])
  const msgHash = ethers.solidityPackedKeccak256(["string"], [msg])

  return { sigData, msgHash }
}

/**
 * Creates an array of possible Schnorr combined addresses from signers.
 * Optionally limited by given X (out of Y)
 *
 * @param signers array of Schnorr signers
 * @param x minimum combination length for X of Y (default = 1)
 * @returns
 *
 * @example
 * X of Y array defined as [A, B, C]
 * 3 of 3: [ABC]
 * 2 of 3: [AB, AC, BC, ABC]
 * 1 of 3: [A, B, C, AB, AC, BC, ABC]
 */
export function getAllCombinedAddrFromSigners(signers: SchnorrSigner[], x?: number): string[] {
  const allSignersCombos: SchnorrSigner[][] = getAllCombos(signers, x)
  const allCombinedAddresses = allSignersCombos.map((signersCombo) =>
    signersCombo.length > 1 ? getCombinedAddrFromSigners(signersCombo) : _generatePk(signersCombo[0].getPubKey().buffer)
  )

  return allCombinedAddresses
}

/**
 * Creates an array of possible Schnorr combined addresses from public keys.
 * Optionally limited by given X (out of Y).
 *
 * @param signers array of Schnorr signers
 * @param x minimum combination length for X of Y (default = 1)
 * @returns
 *
 * @example
 * X of Y array defined as [A, B, C]
 * 3 of 3: [ABC]
 * 2 of 3: [AB, AC, BC, ABC]
 * 1 of 3: [A, B, C, AB, AC, BC, ABC]
 */
export function getAllCombinedAddrFromKeys(pubKeys: Key[], x?: number): Hex[] {
  const allPubKeysCombos: Key[][] = getAllCombos(pubKeys, x)
  const allCombinedAddresses = allPubKeysCombos.map((pubKeysCombo) =>
    pubKeysCombo.length > 1 ? getCombinedAddrFromKeys(pubKeysCombo) : _generatePk(pubKeysCombo[0].buffer)
  )

  return allCombinedAddresses
}

/**
 * Creates an array of possible Schnorr combined public keys from signers.
 * Optionally limited by given X (out of Y).
 *
 * @param signers array of Schnorr signers
 * @param x minimum combination length for X of Y (default = 1)
 * @returns
 *
 * @example
 * X of Y array defined as [A, B, C]
 * 3 of 3: [ABC]
 * 2 of 3: [AB, AC, BC, ABC]
 * 1 of 3: [A, B, C, AB, AC, BC, ABC]
 */
export function getAllCombinedPubKeysFromSigners(signers: SchnorrSigner[], x?: number): Key[] {
  if (signers.length < 2) throw new Error("At least 2 signers should be provided")

  const allSignersCombos: SchnorrSigner[][] = getAllCombos(signers, x)
  const publicKeysCombos: Key[][] = allSignersCombos.map((s) => s.map((signer) => signer.getPubKey()))
  const allCombinedPubKeys = publicKeysCombos.map((publicKeys) => Schnorrkel.getCombinedPublicKey(publicKeys))

  return allCombinedPubKeys
}

/**
 * Generates a single signature data for multiple Schnorr signer.
 *
 * @WARNING FOR TESTING PURPOSE ONLY!
 * @dev it's not possible to sign msg by every signer at once within single function
 * @param signer Schnorr signer which signs the message
 * @param msg message to be signed
 * @returns sigData and msgHash
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
  const px = ethers.hexlify(combinedPublicKey.buffer.subarray(1, 33))
  const parity = combinedPublicKey.buffer[0] - 2 + 27

  // wrap the result
  const abiCoder = new AbiCoder()
  const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, challenge.buffer, sSummed.buffer, parity])
  const msgHash = ethers.solidityPackedKeccak256(["string"], [msg])
  return { sigData, msgHash }
}

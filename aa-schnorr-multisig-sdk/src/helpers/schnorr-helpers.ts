import { ethers } from "ethers"
import { Challenge, Key, PublicNonces, SchnorrSignature, SignatureOutput } from "../types"
import { _generatePk } from "../core"
import { SchnorrSigner, Schnorrkel } from "../signers"

export function createSchnorrSigner(_privKey: Uint8Array): SchnorrSigner {
  return new SchnorrSigner(_privKey)
}

export function sumSchnorrSigs(signatures: SchnorrSignature[]): SchnorrSignature {
  return Schnorrkel.sumSigs(signatures)
}

export function generateCombinedPublicAddress(signerOne: any, signerTwo: any): string {
  // get the public key
  const combinedPublicKey = Schnorrkel.getCombinedPublicKey([signerOne.getPubKey(), signerTwo.getPubKey()])
  const px = ethers.utils.hexlify(combinedPublicKey.buffer.subarray(1, 33))
  const combinedAddress = "0x" + px.slice(px.length - 40, px.length)

  return combinedAddress
}

export function generateCombinedPubAddress(signers: SchnorrSigner[]): string {
  // get the public key
  const pubKeys = signers.map((signer) => signer.getPubKey())

  const combinedPublicKey = Schnorrkel.getCombinedPublicKey(pubKeys)
  const px = ethers.utils.hexlify(combinedPublicKey.buffer.subarray(1, 33))
  const combinedAddress = "0x" + px.slice(px.length - 40, px.length)

  return combinedAddress
}

export function pubKey2Address(publicKey: Key): string {
  const px = ethers.utils.hexlify(publicKey.buffer.subarray(1, 33))
  const address = "0x" + px.slice(px.length - 40, px.length)
  return address
}

export function pKeyString2Key(pK: string): Key {
  return new Key(Buffer.from(ethers.utils.arrayify(pK)))
}

export async function generateSingleSigDataAndHash(signer: SchnorrSigner, msg: string): Promise<{ sigData: string; msgHash: string }> {
  // generate signature for a signer
  const signatureOutput: SignatureOutput = signer.signMessage(msg)

  // the multisig px and parity
  const pk = signer.getPubKey().buffer
  const px = ethers.utils.hexlify(pk.subarray(1, 33))
  const parity = pk[0] - 2 + 27
  const { challenge: e, signature } = signatureOutput

  // wrap the result
  const abiCoder = new ethers.utils.AbiCoder()
  const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, signature.buffer, parity])
  const msgHash = ethers.utils.solidityKeccak256(["string"], [msg])

  return { sigData, msgHash }
}

export async function generateCombinedSigDataAndHash(signers: SchnorrSigner[], msg: string): Promise<{ sigData: string; msgHash: string }> {
  const publicKeys: Key[] = signers.map((signer) => signer.getPubKey())
  const publicNonces: PublicNonces[] = signers.map((signer) => signer.getPubNonces())
  const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)

  // generate signature for every signer
  const signatureOutputs: SignatureOutput[] = signers.map((signer) => signer.signMultiSigMsg(msg, publicKeys, publicNonces))
  const signatures: SchnorrSignature[] = signatureOutputs.map((sig) => sig.signature)
  const challenges: Challenge[] = signatureOutputs.map((sig) => sig.challenge)
  const e = challenges[0] // channelge for every signer is the same

  // sum signatures
  const sSummed = Schnorrkel.sumSigs(signatures)

  // the multisig px and parity
  const px = ethers.utils.hexlify(combinedPublicKey.buffer.subarray(1, 33))
  const parity = combinedPublicKey.buffer[0] - 2 + 27

  // wrap the result
  const abiCoder = new ethers.utils.AbiCoder()
  const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, sSummed.buffer, parity])
  const msgHash = ethers.utils.solidityKeccak256(["string"], [msg])
  return { sigData, msgHash }
}

export function getAllCombinedPubAddressXofY(signers: SchnorrSigner[], x: number): string[] {
  const allSignersCombos: SchnorrSigner[][] = getAllCombos(signers, x)
  const allCombinedAddresses = allSignersCombos.map((signersCombo) =>
    signersCombo.length > 1 ? generateCombinedPubAddress(signersCombo) : _generatePk(signersCombo[0].getPubKey().buffer)
  )

  return allCombinedAddresses
}

export function getAllCombinedPubKeysXofY(signers: SchnorrSigner[], x: number): Key[] {
  if (signers.length < 2) {
    throw Error("At least 2 signers should be provided")
  }
  const allSignersCombos: SchnorrSigner[][] = getAllCombos(signers, x)
  const publicKeysCombos: Key[][] = allSignersCombos.map((signers) => signers.map((signer) => signer.getPubKey()))
  const allCombinedPubKeys = publicKeysCombos.map((publicKeys) => Schnorrkel.getCombinedPublicKey(publicKeys))

  return allCombinedPubKeys
}

export const hashMsgKeccak256 = (message: string): string => {
  return ethers.utils.solidityKeccak256(["string"], [message])
}

export function getAllCombos(arr: any[], x: number = 1): any[] {
  /**
   * create array of possible combinations, optionally limited by given X (out of Y)
   * example X of Y array defined as [A, B, C]
   * 3 of 3: [ABC]
   * 2 of 3: [AB, AC, BC, ABC]
   * 1 of 3: [A, B, C, AB, AC, BC, ABC]
   */
  const allCombos = _getCombos(arr)
  return allCombos.filter((combo) => combo.length >= x)
}

function _getCombos(arr: any[]): any[] {
  if (arr[0] === undefined) return [arr]
  return _getCombos(arr.slice(1)).flatMap((el) => [el.concat(arr[0]), el])
}

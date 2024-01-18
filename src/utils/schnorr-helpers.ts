import { ethers } from "ethers"
import Schnorrkel from "../schnorrkel"
import DefaultSigner from "../../utils/DefaultSigner"
import { Challenge, Key, PublicNonces, Signature, SignatureOutput } from "../types"

export async function generateCombinedPubAddress(signers: any[]) {
  // get the public key
  const pubKeys = signers.map((signer) => signer.getPublicKey())

  const combinedPublicKey = Schnorrkel.getCombinedPublicKey(pubKeys)
  const px = ethers.hexlify(combinedPublicKey.buffer.subarray(1, 33))
  const combinedAddress = "0x" + px.slice(px.length - 40, px.length)

  return { combinedAddress }
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

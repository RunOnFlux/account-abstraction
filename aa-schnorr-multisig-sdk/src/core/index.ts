import { ethers } from "ethers"
import secp256k1 from "secp256k1"
import ecurve from "ecurve"
import elliptic from "elliptic"
import bigi from "bigi"
import { BN } from "bn.js"

import { KeyPair } from "../types"
import type { Hex } from "../accountAbstraction"

import type { HashFunction, InternalNoncePairs, InternalNonces, InternalPublicNonces, InternalSignature } from "./types"

const curve = ecurve.getCurveByName("secp256k1")
const n = curve?.n
const EC = elliptic.ec
const ec = new EC("secp256k1")
const generatorPoint = ec.g

/**
 * Generate a pair of nonces (k and kTwo) needed for `internalMultiSigSign`.
 * Schnorr signature scheme is linear where `k` and `kTwo` are function parameters.
 *
 * @returns InternalNoncePairs
 */
export const _generateNonce = (): InternalNoncePairs => {
  const k = Buffer.from(ethers.randomBytes(32))
  const kTwo = Buffer.from(ethers.randomBytes(32))
  const kPublic = Buffer.from(secp256k1.publicKeyCreate(k))
  const kTwoPublic = Buffer.from(secp256k1.publicKeyCreate(kTwo))

  return {
    k,
    kTwo,
    kPublic,
    kTwoPublic,
  }
}

/**
 * Restore a pair of nonces (k and kTwo) needed for `internalMultiSigSign` given privateKeys
 * Schnorr signature scheme is linear where `k` and `kTwo` are function parameters.
 *
 * @returns InternalNoncePairs
 */
const _restoreNonce = (kPrivateKey: Buffer, kTwoPrivateKey: Buffer): InternalNoncePairs => {
  const k = kPrivateKey
  const kTwo = kTwoPrivateKey
  const kPublic = Buffer.from(secp256k1.publicKeyCreate(k))
  const kTwoPublic = Buffer.from(secp256k1.publicKeyCreate(kTwo))

  return {
    k,
    kTwo,
    kPublic,
    kTwoPublic,
  }
}

const _bCoefficient = (combinedPublicKey: Buffer, msgHash: string, publicNonces: InternalPublicNonces[]): Buffer => {
  type KeyOf = keyof InternalPublicNonces
  const arrayColumn = (arr: InternalPublicNonces[], nonces: KeyOf) => arr.map((x) => x[nonces])
  const kPublicNonces = secp256k1.publicKeyCombine(arrayColumn(publicNonces, "kPublic"))
  const kTwoPublicNonces = secp256k1.publicKeyCombine(arrayColumn(publicNonces, "kTwoPublic"))

  return Buffer.from(
    ethers.getBytes(
      ethers.solidityPackedKeccak256(["bytes", "bytes32", "bytes", "bytes"], [combinedPublicKey, msgHash, kPublicNonces, kTwoPublicNonces])
    )
  )
}

const areBuffersSame = (buf1: Buffer, buf2: Buffer): boolean => {
  if (buf1.byteLength !== buf2.byteLength) return false

  const dv1 = Buffer.from(buf1)
  const dv2 = Buffer.from(buf2)
  for (let index = 0; index !== buf1.byteLength; index++) if (dv1[index] !== dv2[index]) return false

  return true
}

const challenge = (R: Buffer, msgHash: string, publicKey: Buffer): Buffer => {
  // convert R to address
  const R_uncomp = secp256k1.publicKeyConvert(R, false)
  const R_addr = ethers.getBytes(ethers.keccak256(R_uncomp.slice(1, 65))).slice(12, 32)

  // e = keccak256(address(R) || compressed publicKey || msgHash)
  return Buffer.from(
    ethers.getBytes(
      ethers.solidityPackedKeccak256(
        ["address", "uint8", "bytes32", "bytes32"],
        [ethers.hexlify(R_addr), publicKey[0] + 27 - 2, publicKey.slice(1, 33), msgHash]
      )
    )
  )
}

/**
 * Sign the given hash by the private key
 *
 * @param Buffer privateKey
 * @param string hash
 * @returns InternalSignature
 */
const internalSign = (privateKey: Buffer, hash: string): InternalSignature => {
  const localPk = Buffer.from(privateKey)
  const publicKey = Buffer.from(secp256k1.publicKeyCreate(localPk))

  // R = G * k
  const k = ethers.randomBytes(32)
  const R = Buffer.from(secp256k1.publicKeyCreate(k))

  // e = h(address(R) || compressed pubkey || m)
  const e = challenge(R, hash, publicKey)

  // xe = x * e
  const xe = secp256k1.privateKeyTweakMul(localPk, e)

  // s = k + xe mod(n)
  let s = Buffer.from(secp256k1.privateKeyTweakAdd(k, xe))
  s = bigi.fromBuffer(s).mod(n).toBuffer(32)

  return {
    finalPublicNonce: R,
    challenge: e,
    signature: s,
  }
}

const internalMultiSigSign = (
  nonces: InternalNonces,
  combinedPublicKey: Buffer,
  privateKey: Buffer,
  hash: string,
  publicKeys: Buffer[],
  publicNonces: InternalPublicNonces[]
): InternalSignature => {
  if (publicKeys.length < 2) throw new Error("At least 2 public keys should be provided")

  const localPk = Buffer.from(privateKey)
  const xHashed = _hashPrivateKey(localPk)

  if (!(xHashed in nonces) || Object.keys(nonces[xHashed]).length === 0) throw new Error("Nonces should be exchanged before signing")

  const publicKey = Buffer.from(secp256k1.publicKeyCreate(localPk))
  const L = _generateL(publicKeys)
  const a = _aCoefficient(publicKey, L)
  const b = _bCoefficient(combinedPublicKey, hash, publicNonces)

  const effectiveNonces = publicNonces.map((batch) => {
    return Buffer.from(secp256k1.publicKeyCombine([batch.kPublic, secp256k1.publicKeyTweakMul(batch.kTwoPublic, b)]))
  })

  const signerEffectiveNonce = Buffer.from(
    secp256k1.publicKeyCombine([nonces[xHashed].kPublic, secp256k1.publicKeyTweakMul(nonces[xHashed].kTwoPublic, b)])
  )
  const isInArray = effectiveNonces.some((nonce) => areBuffersSame(nonce, signerEffectiveNonce))
  if (!isInArray) throw new Error("Passed nonces are invalid")

  const R = Buffer.from(secp256k1.publicKeyCombine(effectiveNonces))
  const e = challenge(R, hash, combinedPublicKey)

  const { k, kTwo } = nonces[xHashed]

  // xe = x * e
  const xe = secp256k1.privateKeyTweakMul(localPk, e)

  // xea = a * xe
  const xea = secp256k1.privateKeyTweakMul(xe, a)

  // k + xea
  const kPlusxea = secp256k1.privateKeyTweakAdd(xea, k)

  // kTwo * b
  const kTwoMulB = secp256k1.privateKeyTweakMul(kTwo, b)

  // k + kTwoMulB + xea
  const final = secp256k1.privateKeyTweakAdd(kPlusxea, kTwoMulB)

  return {
    // s = k + xea mod(n)
    signature: bigi.fromBuffer(final).mod(n).toBuffer(32),
    challenge: e,
    finalPublicNonce: R,
  }
}

/**
 * Verify a signature for the given hash, public nonce and public key
 *
 * @param Buffer s
 * @param string hash
 * @param Buffer R
 * @param Buffer publicKey
 * @returns boolean
 */
const internalVerify = (s: Buffer, hash: string, R: Buffer, publicKey: Buffer): boolean => {
  const eC = challenge(R, hash, publicKey)
  const sG = generatorPoint.mul(ethers.getBytes(s))
  const P = ec.keyFromPublic(publicKey).getPublic()
  const bnEC = new BN(Buffer.from(eC).toString("hex"), "hex")
  const Pe = P.mul(bnEC)
  const toPublicR = ec.keyFromPublic(R).getPublic()
  const RplusPe = toPublicR.add(Pe)
  return sG.eq(RplusPe)
}

export const _concatTypedArrays = (publicKeys: Buffer[]): Buffer => {
  const c: Buffer = Buffer.alloc(publicKeys.reduce((partialSum, publicKey) => partialSum + publicKey.length, 0))
  publicKeys.map((publicKey, index) => c.set(publicKey, index * publicKey.length))
  return Buffer.from(c.buffer)
}

export const _generateL = (publicKeys: Buffer[]) => {
  return ethers.keccak256(_concatTypedArrays(publicKeys.sort(Buffer.compare)))
}
export const _aCoefficient = (publicKey: Buffer, L: string): Buffer => {
  return Buffer.from(ethers.getBytes(ethers.solidityPackedKeccak256(["bytes", "bytes"], [L, publicKey])))
}

export const generateRandomKeys = () => {
  let privKeyBytes: Buffer
  do privKeyBytes = Buffer.from(ethers.randomBytes(32))
  while (!secp256k1.privateKeyVerify(privKeyBytes))

  const pubKey = Buffer.from(secp256k1.publicKeyCreate(privKeyBytes))

  const data = {
    publicKey: pubKey,
    privateKey: privKeyBytes,
  }

  return new KeyPair(data)
}

export const _hashPrivateKey = (privateKey: Buffer): string => {
  return ethers.keccak256(privateKey)
}

export const _hashMessage = (message: string): string => {
  return ethers.solidityPackedKeccak256(["string"], [message])
}

export const _generatePublicNonces = (
  privateKey: Buffer
): {
  privateNonceData: Pick<InternalNoncePairs, "k" | "kTwo">
  publicNonceData: InternalPublicNonces
  hash: string
} => {
  const hash = _hashPrivateKey(privateKey)
  const nonce = _generateNonce()

  return {
    hash,
    privateNonceData: {
      k: nonce.k,
      kTwo: nonce.kTwo,
    },
    publicNonceData: {
      kPublic: nonce.kPublic,
      kTwoPublic: nonce.kTwoPublic,
    },
  }
}

export const _restorePublicNonces = (
  privateKey: Buffer,
  kPrivateKey: Buffer,
  kTwoPrivateKey: Buffer
): {
  privateNonceData: Pick<InternalNoncePairs, "k" | "kTwo">
  publicNonceData: InternalPublicNonces
  hash: string
} => {
  const hash = _hashPrivateKey(privateKey)
  const nonce = _restoreNonce(kPrivateKey, kTwoPrivateKey)

  return {
    hash,
    privateNonceData: {
      k: nonce.k,
      kTwo: nonce.kTwo,
    },
    publicNonceData: {
      kPublic: nonce.kPublic,
      kTwoPublic: nonce.kTwoPublic,
    },
  }
}

export const _multiSigSign = (
  nonces: InternalNonces,
  combinedPublicKey: Buffer,
  privateKey: Buffer,
  msg: string,
  publicKeys: Buffer[],
  publicNonces: InternalPublicNonces[],
  hashFn: HashFunction | null = null
): InternalSignature => {
  const hashMsg = hashFn ? hashFn : _hashMessage
  const hash = hashMsg(msg)
  return internalMultiSigSign(nonces, combinedPublicKey, privateKey, hash, publicKeys, publicNonces)
}

export const _multiSigSignHash = (
  nonces: InternalNonces,
  combinedPublicKey: Buffer,
  privateKey: Buffer,
  hash: string,
  publicKeys: Buffer[],
  publicNonces: InternalPublicNonces[]
): InternalSignature => {
  return internalMultiSigSign(nonces, combinedPublicKey, privateKey, hash, publicKeys, publicNonces)
}

export const _sumSigs = (signatures: Buffer[]): Buffer => {
  let combined = bigi.fromBuffer(signatures[0])
  signatures.shift()
  signatures.forEach((sig) => {
    combined = combined.add(bigi.fromBuffer(sig))
  })
  return combined.mod(n).toBuffer(32)
}

export const _verify = (s: Buffer, msg: string, R: Buffer, publicKey: Buffer, hashFn: HashFunction | null = null): boolean => {
  const hashMsg = hashFn ? hashFn : _hashMessage
  const hash = hashMsg(msg)
  return internalVerify(s, hash, R, publicKey)
}

export const _verifyHash = (s: Buffer, hash: string, R: Buffer, publicKey: Buffer): boolean => {
  return internalVerify(s, hash, R, publicKey)
}

export const _generatePk = (combinedPublicKey: Buffer): Hex => {
  const px = ethers.hexlify(combinedPublicKey.subarray(1, 33))
  return `0x${px.slice(-40, px.length)}`
}

export const _sign = (privateKey: Buffer, msg: string, hashFn: HashFunction | null = null): InternalSignature => {
  const hashMsg = hashFn ? hashFn : _hashMessage
  const hash = hashMsg(msg)
  return internalSign(privateKey, hash)
}

export const _signHash = (privateKey: Buffer, hash: string): InternalSignature => {
  return internalSign(privateKey, hash)
}

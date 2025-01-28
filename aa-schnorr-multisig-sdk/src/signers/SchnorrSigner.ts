import { privateKeyVerify, publicKeyCreate } from "secp256k1"

import type { Key, PublicNonces, SignatureOutput } from "../types"
import { pubKey2Address } from "../helpers/converters"
import type { HashFunction } from "../core/types"
import { _hashMessage } from "../core"
import { KeyPair } from "../types"

import { Schnorrkel } from "./Schnorrkel"

export class SchnorrSigner extends Schnorrkel {
  #privateKey: Key
  #publicKey: Key
  #address: `${string}`

  constructor(_privKey: Uint8Array) {
    super()

    const privKey = Buffer.from(_privKey)
    if (!privateKeyVerify(privKey)) throw new Error("Invalid private key")

    const pubKey = Buffer.from(publicKeyCreate(privKey))

    const data = {
      publicKey: pubKey,
      privateKey: privKey,
    }

    const pubKeyUncompressed = Buffer.from(publicKeyCreate(privKey, false))
    const address = pubKey2Address(pubKeyUncompressed)

    const keys = new KeyPair(data)
    this.#privateKey = keys.privateKey
    this.#publicKey = keys.publicKey
    this.#address = address
  }

  getAddress(): string {
    return this.#address
  }

  getPubKey(): Key {
    return this.#publicKey
  }

  getPubNonces(): PublicNonces {
    return this.getPublicNonces(this.#privateKey)
  }

  generatePubNonces(): PublicNonces {
    return this.generatePublicNonces(this.#privateKey)
  }

  restorePubNonces(kPrivateKey: Key, kTwoPrivateKey: Key): PublicNonces {
    return this.restorePublicNonces(this.#privateKey, kPrivateKey, kTwoPrivateKey)
  }

  hasNonces(): boolean {
    return this.hasNonce(this.#publicKey)
  }

  signMultiSigMsg(msg: string, publicKeys: Key[], publicNonces: PublicNonces[]): SignatureOutput {
    return this.multiSigSign(this.#privateKey, msg, publicKeys, publicNonces)
  }

  signMultiSigHash(hash: string, publicKeys: Key[], publicNonces: PublicNonces[]): SignatureOutput {
    return this.multiSigSignHash(this.#privateKey, hash, publicKeys, publicNonces)
  }

  signMessage(msg: string, hashFn: HashFunction = _hashMessage): SignatureOutput {
    return Schnorrkel.sign(this.#privateKey, msg, hashFn)
  }

  signHash(hash: string): SignatureOutput {
    return Schnorrkel.signHash(this.#privateKey, hash)
  }
}

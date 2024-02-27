import { privateKeyVerify, publicKeyCreate } from "secp256k1"
import { pubKey2Address } from "../helpers/schnorr-helpers"
import { Key, KeyPair, PublicNonces, SignatureOutput } from "../types"
import { Schnorrkel } from "./Schnorrkel"

export class SchnorrSigner extends Schnorrkel {
  #privateKey: Key
  #publicKey: Key

  constructor(_privKey: Uint8Array) {
    super()
    let privKeyBytes: Buffer

    do {
      privKeyBytes = Buffer.from(_privKey)
    } while (!privateKeyVerify(privKeyBytes))

    const pubKey = Buffer.from(publicKeyCreate(privKeyBytes))

    const data = {
      publicKey: pubKey,
      privateKey: privKeyBytes,
    }

    const keys = new KeyPair(data)
    this.#privateKey = keys.privateKey
    this.#publicKey = keys.publicKey
  }

  getAddress(): string {
    return pubKey2Address(this.#publicKey)
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

  hasNonces(): boolean {
    return this.hasNonce(this.#publicKey)
  }

  signMultiSigMsg(msg: string, publicKeys: Key[], publicNonces: PublicNonces[]): SignatureOutput {
    return this.multiSigSign(this.#privateKey, msg, publicKeys, publicNonces)
  }

  signMultiSigHash(hash: string, publicKeys: Key[], publicNonces: PublicNonces[]): SignatureOutput {
    return this.multiSigSignHash(this.#privateKey, hash, publicKeys, publicNonces)
  }

  signMessage(msg: string, hashFn: Function | null = null): SignatureOutput {
    return Schnorrkel.sign(this.#privateKey, msg, hashFn)
  }

  signHash(hash: string): SignatureOutput {
    return Schnorrkel.signHash(this.#privateKey, hash)
  }
}

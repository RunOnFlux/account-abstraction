import secp256k1 from "secp256k1"

import type { Nonces, PublicNonces, NoncePairs } from "../types"
import { Key, SchnorrSignature } from "../types"
import {
  _generateL,
  _aCoefficient,
  _generatePublicNonces,
  _multiSigSign,
  _hashPrivateKey,
  _sumSigs,
  _verify,
  _generatePk,
  _sign,
  _signHash,
  _verifyHash,
  _multiSigSignHash,
  _restorePublicNonces,
  _hashMessage,
} from "../core"
import type { HashFunction, InternalNonces, InternalPublicNonces, InternalSignature } from "../core/types"
import type { SignatureOutput } from "../types/signature"
import { Challenge, FinalPublicNonce } from "../types/signature"

export class Schnorrkel {
  #nonces: Nonces = {}
  #usedNonces: Set<string> = new Set()

  private markNonceAsUsed(privateKey: Key): void {
    const x = privateKey.buffer
    const hash = _hashPrivateKey(x)

    this.#usedNonces.add(hash)
  }

  private isNonceUsed(hash: string): boolean {
    return this.#usedNonces.has(hash)
  }

  private _setNonce(privateKey: Buffer): string {
    const { publicNonceData, privateNonceData, hash } = _generatePublicNonces(privateKey)

    if (this.isNonceUsed(hash)) throw new Error("Nonce has already been used and cannot be reused.")

    const mappedPublicNonce: PublicNonces = {
      kPublic: new Key(Buffer.from(publicNonceData.kPublic)),
      kTwoPublic: new Key(Buffer.from(publicNonceData.kTwoPublic)),
    }

    const mappedPrivateNonce: Pick<NoncePairs, "k" | "kTwo"> = {
      k: new Key(Buffer.from(privateNonceData.k)),
      kTwo: new Key(Buffer.from(privateNonceData.kTwo)),
    }

    this.#nonces[hash] = { ...mappedPrivateNonce, ...mappedPublicNonce }
    return hash
  }

  private _restoreNonce(privateKey: Buffer, kPrivateKey, kTwoPrivateKey): string {
    const { publicNonceData, privateNonceData, hash } = _restorePublicNonces(privateKey, kPrivateKey, kTwoPrivateKey)

    if (this.isNonceUsed(hash)) throw new Error("Nonce has already been used and cannot be reused.")

    const mappedPublicNonce: PublicNonces = {
      kPublic: new Key(Buffer.from(publicNonceData.kPublic)),
      kTwoPublic: new Key(Buffer.from(publicNonceData.kTwoPublic)),
    }

    const mappedPrivateNonce: Pick<NoncePairs, "k" | "kTwo"> = {
      k: new Key(Buffer.from(privateNonceData.k)),
      kTwo: new Key(Buffer.from(privateNonceData.kTwo)),
    }

    this.#nonces[hash] = { ...mappedPrivateNonce, ...mappedPublicNonce }
    return hash
  }

  private clearNonces(privateKey: Key): void {
    const x = privateKey.buffer
    const hash = _hashPrivateKey(x)

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete this.#nonces[hash]
  }

  private getMappedPublicNonces(publicNonces: PublicNonces[]): InternalPublicNonces[] {
    return publicNonces.map((publicNonce) => {
      return {
        kPublic: publicNonce.kPublic.buffer,
        kTwoPublic: publicNonce.kTwoPublic.buffer,
      }
    })
  }

  private getMappedNonces(): InternalNonces {
    return Object.fromEntries(
      Object.entries(this.#nonces).map(([hash, nonce]) => {
        return [
          hash,
          {
            k: nonce.k.buffer,
            kTwo: nonce.kTwo.buffer,
            kPublic: nonce.kPublic.buffer,
            kTwoPublic: nonce.kTwoPublic.buffer,
          },
        ]
      })
    )
  }

  private getMultisigOutput(multiSig: InternalSignature): SignatureOutput {
    return {
      signature: new SchnorrSignature(Buffer.from(multiSig.signature)),
      finalPublicNonce: new FinalPublicNonce(Buffer.from(multiSig.finalPublicNonce)),
      challenge: new Challenge(Buffer.from(multiSig.challenge)),
    }
  }

  static getCombinedPublicKey(publicKeys: Key[]): Key {
    if (publicKeys.length < 2) throw new Error("At least 2 public keys should be provided")

    const bufferPublicKeys = publicKeys.map((publicKey) => publicKey.buffer)
    const L = _generateL(bufferPublicKeys)

    const modifiedKeys = bufferPublicKeys.map((publicKey) => {
      return secp256k1.publicKeyTweakMul(publicKey, _aCoefficient(publicKey, L))
    })

    return new Key(Buffer.from(secp256k1.publicKeyCombine(modifiedKeys)))
  }

  static getCombinedAddress(publicKeys: Key[]): string {
    if (publicKeys.length < 2) throw new Error("At least 2 public keys should be provided")

    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const px = _generatePk(combinedPublicKey.buffer)
    return px
  }

  generatePublicNonces(privateKey: Key): PublicNonces {
    const hash = this._setNonce(privateKey.buffer)
    const nonce = this.#nonces[hash]

    return {
      kPublic: nonce.kPublic,
      kTwoPublic: nonce.kTwoPublic,
    }
  }

  // bucket system for nonces as signers may share nonces between each other before transaction construction
  restorePublicNonces(privateKey: Key, kPrivateKey: Key, kTwoPrivateKey: Key): PublicNonces {
    const hash = this._restoreNonce(privateKey.buffer, kPrivateKey.buffer, kTwoPrivateKey.buffer)
    const nonce = this.#nonces[hash]

    return {
      kPublic: nonce.kPublic,
      kTwoPublic: nonce.kTwoPublic,
    }
  }

  getPublicNonces(privateKey: Key): PublicNonces {
    const hash = _hashPrivateKey(privateKey.buffer)
    const nonce = this.#nonces[hash]

    return {
      kPublic: nonce.kPublic,
      kTwoPublic: nonce.kTwoPublic,
    }
  }

  hasNonce(privateKey: Key): boolean {
    const hash = _hashPrivateKey(privateKey.buffer)
    return hash in this.#nonces
  }

  multiSigSign(
    privateKey: Key,
    msg: string,
    publicKeys: Key[],
    publicNonces: PublicNonces[],
    hashFn: HashFunction = _hashMessage
  ): SignatureOutput {
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const mappedPublicNonce = this.getMappedPublicNonces(publicNonces)
    const mappedNonces = this.getMappedNonces()

    try {
      const musigData = _multiSigSign(
        mappedNonces,
        combinedPublicKey.buffer,
        privateKey.buffer,
        msg,
        publicKeys.map((key) => key.buffer),
        mappedPublicNonce,
        hashFn
      )

      // absolutely crucial to delete the nonces once a signature has been crafted with them.
      // nonce reuse will lead to private key leakage!
      this.clearNonces(privateKey)

      return this.getMultisigOutput(musigData)
    } finally {
      // absolutely crucial to delete the nonces once a signature has been crafted with them.
      // nonce reuse will lead to private key leakage!
      this.clearNonces(privateKey)
      // Ensure nonces are marked as used and cleared regardless of success or failure
      this.markNonceAsUsed(privateKey)
    }
  }

  multiSigSignHash(privateKey: Key, hash: string, publicKeys: Key[], publicNonces: PublicNonces[]): SignatureOutput {
    const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
    const mappedPublicNonce = this.getMappedPublicNonces(publicNonces)
    const mappedNonces = this.getMappedNonces()

    try {
      const musigData = _multiSigSignHash(
        mappedNonces,
        combinedPublicKey.buffer,
        privateKey.buffer,
        hash,
        publicKeys.map((key) => key.buffer),
        mappedPublicNonce
      )

      // absolutely crucial to delete the nonces once a signature has been crafted with them.
      // nonce reuse will lead to private key leakage!
      this.clearNonces(privateKey)

      return this.getMultisigOutput(musigData)
    } finally {
      // absolutely crucial to delete the nonces once a signature has been crafted with them.
      // nonce reuse will lead to private key leakage!
      this.clearNonces(privateKey)
      // Ensure nonces are marked as used and cleared regardless of success or failure
      this.markNonceAsUsed(privateKey)
    }
  }

  static sign(privateKey: Key, msg: string, hashFn: HashFunction = _hashMessage): SignatureOutput {
    const output = _sign(privateKey.buffer, msg, hashFn)

    return {
      signature: new SchnorrSignature(Buffer.from(output.signature)),
      finalPublicNonce: new FinalPublicNonce(Buffer.from(output.finalPublicNonce)),
      challenge: new Challenge(Buffer.from(output.challenge)),
    }
  }

  static signHash(privateKey: Key, hash: string): SignatureOutput {
    const output = _signHash(privateKey.buffer, hash)

    return {
      signature: new SchnorrSignature(Buffer.from(output.signature)),
      finalPublicNonce: new FinalPublicNonce(Buffer.from(output.finalPublicNonce)),
      challenge: new Challenge(Buffer.from(output.challenge)),
    }
  }

  static sumSigs(signatures: SchnorrSignature[]): SchnorrSignature {
    const mappedSignatures = signatures.map((signature) => signature.buffer)
    const sum = _sumSigs(mappedSignatures)
    return new SchnorrSignature(Buffer.from(sum))
  }

  static verify(
    signature: SchnorrSignature,
    msg: string,
    finalPublicNonce: FinalPublicNonce,
    publicKey: Key,
    hashFn: HashFunction = _hashMessage
  ): boolean {
    return _verify(signature.buffer, msg, finalPublicNonce.buffer, publicKey.buffer, hashFn)
  }

  static verifyHash(signature: SchnorrSignature, hash: string, finalPublicNonce: FinalPublicNonce, publicKey: Key): boolean {
    return _verifyHash(signature.buffer, hash, finalPublicNonce.buffer, publicKey.buffer)
  }
}

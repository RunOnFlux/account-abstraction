import secp256k1 from "secp256k1"

import type { Nonces, PublicNonces, NoncePairs } from "../types"
import { Key, SchnorrSignature } from "../types"
import {
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
  _combinePublicKeys,
  _verifyPartialSignature,
} from "../core"
import type { HashFunction, InternalNonces, InternalPublicNonces, InternalSignature } from "../core/types"
import type { SignatureOutput } from "../types/signature"
import { Challenge, FinalPublicNonce } from "../types/signature"

/**
 * Persistent burned-nonce ledger supplied by the application (AA-7 / EVM-10).
 *
 * A nonce pair is identified by its public `kPublic` (33-byte compressed, hex).
 * Signing with the same pair three times (with fresh co-signer nonces) leaks
 * the private key, so a pair must never sign twice — across restarts too,
 * which the SDK's in-memory guard alone cannot ensure.
 *
 * - `isNonceBurned` is consulted before a nonce pair is restored or used.
 * - `markNonceBurned` is awaited BEFORE the partial signature is computed, so
 *   a signature never leaves the device for a pair that is not durably burned.
 *   It must resolve only once the burn is persisted; if it rejects, nothing is
 *   signed.
 */
export interface NonceBurnStore {
  isNonceBurned(kPublicHex: string): Promise<boolean>
  markNonceBurned(kPublicHex: string): Promise<void>
}

export interface SchnorrkelOptions {
  /**
   * Optional persistent burned-nonce ledger. When set, the synchronous
   * multiSigSign / multiSigSignHash refuse to run: use the async variants,
   * which consult the store.
   */
  nonceStore?: NonceBurnStore
}

type SignCompute = (nonces: InternalNonces, combinedPublicKey: Buffer, mappedPublicNonces: InternalPublicNonces[]) => InternalSignature

const NONCE_REUSE_ERROR = "Nonce has already been used and cannot be reused."

// In-process guard: public nonces (hex) of nonce pairs that have already
// produced a partial signature. Keyed by the PUBLIC NONCE ONLY — not by
// hash(private key) — so the same pair cannot be replayed under a different
// signing key (e.g. a relay-chosen addressIndex/vaultIndex, EVM-10). Lost on
// restart: persist burns with a NonceBurnStore (AA-7).
const burnedPublicNonces: Set<string> = new Set()

const isPairBurnedInMemory = (pair: { kPublic: Buffer; kTwoPublic: Buffer }): boolean =>
  burnedPublicNonces.has(pair.kPublic.toString("hex")) || burnedPublicNonces.has(pair.kTwoPublic.toString("hex"))

const burnPairInMemory = (pair: { kPublic: Buffer; kTwoPublic: Buffer }): void => {
  burnedPublicNonces.add(pair.kPublic.toString("hex"))
  burnedPublicNonces.add(pair.kTwoPublic.toString("hex"))
}

export class Schnorrkel {
  #nonces: Nonces = {}

  readonly #nonceStore?: NonceBurnStore

  constructor(options?: SchnorrkelOptions) {
    this.#nonceStore = options?.nonceStore
  }

  /** true when a persistent NonceBurnStore was supplied (async signing required). */
  hasNonceStore(): boolean {
    return Boolean(this.#nonceStore)
  }

  /**
   * Clears the IN-MEMORY burned-nonce guard of this process (simulates a
   * restart; meant for tests). Burns persisted in a NonceBurnStore are
   * unaffected.
   */
  resetUsedNonces(): void {
    burnedPublicNonces.clear()
  }

  private _storeNonce(hash: string, publicNonceData: InternalPublicNonces, privateNonceData: { k: Buffer; kTwo: Buffer }): void {
    const mappedPublicNonce: PublicNonces = {
      kPublic: new Key(Buffer.from(publicNonceData.kPublic)),
      kTwoPublic: new Key(Buffer.from(publicNonceData.kTwoPublic)),
    }

    const mappedPrivateNonce: Pick<NoncePairs, "k" | "kTwo"> = {
      k: new Key(Buffer.from(privateNonceData.k)),
      kTwo: new Key(Buffer.from(privateNonceData.kTwo)),
    }

    this.#nonces[hash] = { ...mappedPrivateNonce, ...mappedPublicNonce }
  }

  private _setNonce(privateKey: Buffer): string {
    const { publicNonceData, privateNonceData, hash } = _generatePublicNonces(privateKey)
    if (isPairBurnedInMemory(publicNonceData)) throw new Error(NONCE_REUSE_ERROR)
    this._storeNonce(hash, publicNonceData, privateNonceData)
    return hash
  }

  private _restoreNonce(privateKey: Buffer, kPrivateKey: Buffer, kTwoPrivateKey: Buffer): string {
    const { publicNonceData, privateNonceData, hash } = _restorePublicNonces(privateKey, kPrivateKey, kTwoPrivateKey)
    if (isPairBurnedInMemory(publicNonceData)) throw new Error(NONCE_REUSE_ERROR)
    this._storeNonce(hash, publicNonceData, privateNonceData)
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

  /**
   * The signer's own pending nonce pair, or throws. When there is none (e.g.
   * it was consumed by a previous signature) and the provided nonces contain a
   * burned one, the reuse error is reported.
   */
  private getOwnNonce(privateKey: Key, publicNonces: PublicNonces[]): NoncePairs {
    const own = this.#nonces[_hashPrivateKey(privateKey.buffer)]
    if (!own) {
      const isReplay = publicNonces.some((nonce) =>
        isPairBurnedInMemory({ kPublic: nonce.kPublic.buffer, kTwoPublic: nonce.kTwoPublic.buffer })
      )
      throw new Error(isReplay ? NONCE_REUSE_ERROR : "Nonces should be exchanged before signing")
    }
    return own
  }

  private static pairBuffers(own: NoncePairs): { kPublic: Buffer; kTwoPublic: Buffer } {
    return { kPublic: own.kPublic.buffer, kTwoPublic: own.kTwoPublic.buffer }
  }

  /**
   * Shared signing core: refuses a burned own pair, burns it (in memory)
   * BEFORE computing, and always clears the pending nonces afterwards.
   */
  private _signWithOwnNonce(privateKey: Key, publicKeys: Key[], publicNonces: PublicNonces[], compute: SignCompute): SignatureOutput {
    try {
      const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
      const ownPair = Schnorrkel.pairBuffers(this.getOwnNonce(privateKey, publicNonces))
      if (isPairBurnedInMemory(ownPair)) throw new Error(NONCE_REUSE_ERROR)
      const mappedPublicNonce = this.getMappedPublicNonces(publicNonces)
      const mappedNonces = this.getMappedNonces()
      // Burn first: a partial signature must never exist for an unburned pair.
      burnPairInMemory(ownPair)
      return this.getMultisigOutput(compute(mappedNonces, combinedPublicKey.buffer, mappedPublicNonce))
    } finally {
      // absolutely crucial to delete the nonces once a signature has been crafted with them.
      // nonce reuse will lead to private key leakage!
      this.clearNonces(privateKey)
    }
  }

  /**
   * Async counterpart: additionally consults and updates the persistent
   * NonceBurnStore (when configured) before the partial signature is computed.
   */
  private async _signWithOwnNonceAsync(
    privateKey: Key,
    publicKeys: Key[],
    publicNonces: PublicNonces[],
    compute: SignCompute
  ): Promise<SignatureOutput> {
    const store = this.#nonceStore
    let own: NoncePairs
    try {
      Schnorrkel.getCombinedPublicKey(publicKeys)
      own = this.getOwnNonce(privateKey, publicNonces)
      const ownPair = Schnorrkel.pairBuffers(own)
      if (isPairBurnedInMemory(ownPair)) throw new Error(NONCE_REUSE_ERROR)
      // Burn in memory before the first await so a concurrent call in this
      // process cannot use the same pair while the store is consulted.
      burnPairInMemory(ownPair)
      if (store) {
        const kPublicHex = own.kPublic.toHex()
        if (await store.isNonceBurned(kPublicHex)) throw new Error(NONCE_REUSE_ERROR)
        await store.markNonceBurned(kPublicHex)
      }
    } catch (error) {
      this.clearNonces(privateKey)
      throw error
    }
    try {
      // Sign with exactly the pair that was burned (another call may have
      // replaced the pending pair while the store was awaited).
      this.#nonces[_hashPrivateKey(privateKey.buffer)] = own
      const combinedPublicKey = Schnorrkel.getCombinedPublicKey(publicKeys)
      return this.getMultisigOutput(compute(this.getMappedNonces(), combinedPublicKey.buffer, this.getMappedPublicNonces(publicNonces)))
    } finally {
      this.clearNonces(privateKey)
    }
  }

  private assertNoNonceStore(method: string): void {
    if (this.#nonceStore) {
      throw new Error(
        `A persistent nonce store is configured: use ${method}Async so burned nonces are checked and persisted before signing`
      )
    }
  }

  static getCombinedPublicKey(publicKeys: Key[]): Key {
    if (publicKeys.length < 2) throw new Error("At least 2 public keys should be provided")

    // validate that public keys are valid points on the secp256k1 curve
    publicKeys.forEach((publicKey) => {
      if (!secp256k1.publicKeyVerify(publicKey.buffer)) throw new Error("Invalid public key provided")
    })

    // keys are normalised to their compressed form inside the aggregation
    return new Key(_combinePublicKeys(publicKeys.map((publicKey) => publicKey.buffer)))
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

  /**
   * restorePublicNonces that also refuses a pair recorded as burned in the
   * persistent NonceBurnStore (when configured).
   */
  async restorePublicNoncesAsync(privateKey: Key, kPrivateKey: Key, kTwoPrivateKey: Key): Promise<PublicNonces> {
    if (this.#nonceStore) {
      const kPublicHex = Buffer.from(secp256k1.publicKeyCreate(kPrivateKey.buffer)).toString("hex")
      if (await this.#nonceStore.isNonceBurned(kPublicHex)) throw new Error(NONCE_REUSE_ERROR)
    }
    return this.restorePublicNonces(privateKey, kPrivateKey, kTwoPrivateKey)
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
    this.assertNoNonceStore("multiSigSign")
    return this._signWithOwnNonce(privateKey, publicKeys, publicNonces, (nonces, combined, mappedPublicNonces) =>
      _multiSigSign(
        nonces,
        combined,
        privateKey.buffer,
        msg,
        publicKeys.map((key) => key.buffer),
        mappedPublicNonces,
        hashFn
      )
    )
  }

  multiSigSignHash(privateKey: Key, hash: string, publicKeys: Key[], publicNonces: PublicNonces[]): SignatureOutput {
    this.assertNoNonceStore("multiSigSignHash")
    return this._signWithOwnNonce(privateKey, publicKeys, publicNonces, (nonces, combined, mappedPublicNonces) =>
      _multiSigSignHash(
        nonces,
        combined,
        privateKey.buffer,
        hash,
        publicKeys.map((key) => key.buffer),
        mappedPublicNonces
      )
    )
  }

  /** multiSigSign that consults and updates the persistent NonceBurnStore (if configured). */
  async multiSigSignAsync(
    privateKey: Key,
    msg: string,
    publicKeys: Key[],
    publicNonces: PublicNonces[],
    hashFn: HashFunction = _hashMessage
  ): Promise<SignatureOutput> {
    return this._signWithOwnNonceAsync(privateKey, publicKeys, publicNonces, (nonces, combined, mappedPublicNonces) =>
      _multiSigSign(
        nonces,
        combined,
        privateKey.buffer,
        msg,
        publicKeys.map((key) => key.buffer),
        mappedPublicNonces,
        hashFn
      )
    )
  }

  /** multiSigSignHash that consults and updates the persistent NonceBurnStore (if configured). */
  async multiSigSignHashAsync(privateKey: Key, hash: string, publicKeys: Key[], publicNonces: PublicNonces[]): Promise<SignatureOutput> {
    return this._signWithOwnNonceAsync(privateKey, publicKeys, publicNonces, (nonces, combined, mappedPublicNonces) =>
      _multiSigSignHash(
        nonces,
        combined,
        privateKey.buffer,
        hash,
        publicKeys.map((key) => key.buffer),
        mappedPublicNonces
      )
    )
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

  /**
   * Verify one signer's partial signature over `hash` (as produced by
   * multiSigSignHash) before it is summed (AA-6).
   *
   * @param partial the signer's partial signature
   * @param hash the signed 32-byte hash (hex)
   * @param signerPublicKey the signer's public key
   * @param signerPublicNonces the signer's public nonce pair
   * @param publicKeys all signers' public keys (as used for signing)
   * @param publicNonces all signers' public nonce pairs (as used for signing)
   */
  static verifyPartialSignatureHash(
    partial: SchnorrSignature,
    hash: string,
    signerPublicKey: Key,
    signerPublicNonces: PublicNonces,
    publicKeys: Key[],
    publicNonces: PublicNonces[]
  ): boolean {
    return _verifyPartialSignature(
      partial.buffer,
      hash,
      signerPublicKey.buffer,
      { kPublic: signerPublicNonces.kPublic.buffer, kTwoPublic: signerPublicNonces.kTwoPublic.buffer },
      publicKeys.map((key) => key.buffer),
      publicNonces.map((nonce) => ({ kPublic: nonce.kPublic.buffer, kTwoPublic: nonce.kTwoPublic.buffer }))
    )
  }

  /**
   * Verify every partial signature, then sum them. Throws naming the first
   * signer whose contribution is invalid (an attributable failure instead of
   * an invalid aggregate signature).
   */
  static sumVerifiedSigsHash(
    hash: string,
    publicKeys: Key[],
    publicNonces: PublicNonces[],
    partials: Array<{ publicKey: Key; publicNonces: PublicNonces; signature: SchnorrSignature }>
  ): SchnorrSignature {
    if (partials.length === 0) throw new Error("No partial signatures provided")
    partials.forEach((partial) => {
      const isValid = Schnorrkel.verifyPartialSignatureHash(
        partial.signature,
        hash,
        partial.publicKey,
        partial.publicNonces,
        publicKeys,
        publicNonces
      )
      if (!isValid) throw new Error(`Invalid partial signature from signer ${partial.publicKey.toHex()}`)
    })
    return Schnorrkel.sumSigs(partials.map((partial) => partial.signature))
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

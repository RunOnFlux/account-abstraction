import { ethers } from "ethers"

import type { Challenge, Key, PublicNonces, SchnorrSignature, SignatureOutput } from "../types"
import type { Hex } from "../types/misc"
import { sumSchnorrSigs } from "../helpers/schnorr-helpers"
import type { SchnorrSigner } from "../signers"
import { Schnorrkel } from "../signers"
import type { SignersNonces, SignersPubKeys, SignersSignatures } from "../types/multiSigTx"
import type { UserOperationRequest } from "../accountAbstraction"

export class SchnorrMultiSigTx {
  readonly signers: SchnorrSigner[]
  readonly opHash: Hex
  readonly userOpRequest: UserOperationRequest
  combinedPubKey: Key
  publicNonces: SignersNonces = {}
  publicKeys: SignersPubKeys = {}
  signatures: SignersSignatures = {}

  constructor(signers: SchnorrSigner[], opHash: Hex, userOpRequest: UserOperationRequest) {
    if (signers.length < 2) throw new Error("At least 2 signers should be provided")

    this.signers = signers
    this.opHash = opHash
    this.userOpRequest = userOpRequest

    const _publicKeys = signers.map((signer) => {
      const _address = signer.getAddress()

      // generate and get public nonces
      if (signer.hasNonces()) throw new Error("Signer already has nonces")

      this.publicNonces[_address] = signer.generatePubNonces()

      // get public keys
      const _pk = signer.getPubKey()
      this.publicKeys[_address] = _pk
      return _pk
    })

    // get combined public key created from all signers' public keys
    this.combinedPubKey = Schnorrkel.getCombinedPublicKey(_publicKeys)
  }

  getOpHash(): string {
    return this.opHash
  }

  signMultiSigHash(signer: SchnorrSigner) {
    const op = this.opHash
    const pk = this._getPublicKeys()
    const pn = this._getPublicNonces()

    const _signatureOutput = signer.signMultiSigHash(op, pk, pn)
    this.signatures[signer.getAddress()] = _signatureOutput
    return _signatureOutput
  }

  getSummedSigData(): string {
    if (!this.combinedPubKey || !this.signatures || this.signers.length < 2) throw new Error("Summed signature input data is missing")

    const _signatureOutputs = this._getSignatures()
    const _sigs: SchnorrSignature[] = _signatureOutputs.map((sig) => sig.signature)
    const _challenges: Challenge[] = _signatureOutputs.map((sig) => sig.challenge)

    // sum all signers signatures
    const _summed = sumSchnorrSigs(_sigs)

    // challenge for every signature must be the same - check and if so, assign first one
    const isEveryChallengeEqual = _challenges.every((e) => {
      if (e.toHex() === _challenges[0].toHex()) return true
    })
    if (!isEveryChallengeEqual) throw new Error("Challenges for all signers should be the same")

    const e = _challenges[0]

    // the multisig px and parity
    const px = ethers.utils.hexlify(this.combinedPubKey.buffer.subarray(1, 33))
    const parity = this.combinedPubKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new ethers.utils.AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, _summed.buffer, parity])
    return sigData
  }

  _getSignatures(): SignatureOutput[] {
    return Object.entries(this.signatures).map(([, sig]) => {
      return sig
    })
  }

  _getPublicNonces(): PublicNonces[] {
    return Object.entries(this.publicNonces).map(([, nonce]) => {
      return nonce
    })
  }

  _getPublicKeys(): Key[] {
    return Object.entries(this.publicKeys).map(([, pk]) => {
      return pk
    })
  }
}

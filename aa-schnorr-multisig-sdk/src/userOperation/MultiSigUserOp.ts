import {AbiCoder, ethers} from "ethers"

import { publicKeyConvert } from "secp256k1"
import type { Challenge, Key, PublicNonces, SchnorrSignature, SignatureOutput } from "../types"
import type { Hex } from "../types/misc"
import { sumSchnorrSigs } from "../helpers/schnorr-helpers"
import type { SchnorrSigner } from "../signers"
import { Schnorrkel } from "../signers"
import type { SignersNonces, SignersPubKeys, SignersSignatures } from "../types"
import { pubKey2Address } from "../helpers/converters"
import {UserOperationStruct} from "@alchemy/aa-core";

export class MultiSigUserOp {
  readonly id: string
  readonly opHash: Hex
  readonly userOpRequest: UserOperationStruct
  combinedPubKey: Key
  publicNonces: SignersNonces = {}
  publicKeys: SignersPubKeys = {}
  signatures: SignersSignatures = {}

  constructor(publicKeys: Key[], publicNonces: PublicNonces[], opHash: Hex, userOpRequest: UserOperationStruct) {
    if (publicKeys.length < 2) throw new Error("At least 2 signers should be provided")

    this.opHash = opHash
    this.userOpRequest = userOpRequest

    // map public keys and public nonces
    const _publicKeys = publicKeys.map((pk, index) => {
      const _address = pubKey2Address(Buffer.from(publicKeyConvert(pk.buffer, false)))
      this.publicNonces[_address] = publicNonces[index]
      this.publicKeys[_address] = pk
      return pk
    })

    // get combined public key created from all signers' public keys
    const _combinedPubKey = Schnorrkel.getCombinedPublicKey(_publicKeys)
    this.combinedPubKey = _combinedPubKey

    // create unique tx id
    const _salt = Buffer.from(ethers.randomBytes(32))
    const coder = new AbiCoder()
    const encodedParams = coder.encode(["bytes", "bytes", "bytes"], [_combinedPubKey.buffer, opHash, _salt])
    this.id = ethers.keccak256(encodedParams)
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

  getSummedSigData(): Hex {
    if (!this.combinedPubKey || !this.signatures) throw new Error("Summed signature input data is missing")

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
    const px = ethers.hexlify(this.combinedPubKey.buffer.subarray(1, 33))
    const parity = this.combinedPubKey.buffer[0] - 2 + 27

    // wrap the result
    const abiCoder = new AbiCoder()
    const sigData = abiCoder.encode(["bytes32", "bytes32", "bytes32", "uint8"], [px, e.buffer, _summed.buffer, parity])
    return sigData as Hex
  }

  getAddressSignature(signerAddress: string): SignatureOutput {
    return this._getSignatures()[signerAddress]
  }

  getAddressPublicNonces(signerAddress: string): PublicNonces {
    return this._getPublicNonces()[signerAddress]
  }

  getAddressPubKeys(signerAddress: string): Key {
    return this._getPublicKeys()[signerAddress]
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

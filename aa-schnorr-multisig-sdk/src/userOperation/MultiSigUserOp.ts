import Ajv from "ajv"

import { UserOperationStruct_v6 } from "@alchemy/aa-core"
import { AbiCoder, ethers } from "ethers"

import { Challenge, Key, PublicNonces, SchnorrSignature, SignatureOutput } from "../types"
import type { SignersNonces, SignersPubKeys, SignersSignatures } from "../types"
import type { Hex } from "../types/misc"
import { BigNumberSerializer } from "../serializers"
import { sumSchnorrSigs } from "../helpers/schnorr-helpers"
import { pubKey2Address } from "../helpers/converters"
import { Schnorrkel } from "../signers"
import type { SchnorrSigner } from "../signers"
import { ValidationError } from "../errors"

interface SerializedMultiSigOp {
  id: string
  opHash: string
  userOpRequest: {
    sender: string
    nonce: string
    initCode: string
    callData: string
    callGasLimit: string
    verificationGasLimit: string
    preVerificationGas: string
    maxFeePerGas: string
    maxPriorityFeePerGas: string
    paymasterAndData: string
    signature: string
  }
  combinedPubKey: string
  publicNonces: Record<string, {
    kPublic: string
    kTwoPublic: string
  }>
  publicKeys: Record<string, string>
  signatures: Record<string, {
    finalPublicNonce: string
    challenge: string
    signature: string
  }>
}

export class MultiSigUserOp {
  readonly id: string
  readonly opHash: Hex
  readonly userOpRequest: UserOperationStruct_v6
  combinedPubKey: Key
  publicNonces: SignersNonces = {}
  publicKeys: SignersPubKeys = {}
  signatures: SignersSignatures = {}

  constructor(publicKeys: Key[], publicNonces: PublicNonces[], opHash: Hex, userOpRequest: UserOperationStruct_v6) {
    if (publicKeys.length < 2) throw new Error("At least 2 signers should be provided")

    this.opHash = opHash
    this.userOpRequest = userOpRequest

    // map public keys and public nonces
    const _publicKeys = publicKeys.map((pk, index) => {
      const _address = pubKey2Address(pk.buffer)
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

  toJson(): SerializedMultiSigOp {
    return {
      id: this.id,
      opHash: this.opHash,
      userOpRequest: {
        sender: this.userOpRequest.sender,
        nonce: new BigNumberSerializer(this.userOpRequest.nonce).toString(),
        initCode: this.userOpRequest.initCode.toString(),
        callData: this.userOpRequest.callData.toString(),
        callGasLimit: new BigNumberSerializer(this.userOpRequest.callGasLimit).toString(),
        verificationGasLimit: new BigNumberSerializer(this.userOpRequest.verificationGasLimit).toString(),
        preVerificationGas: new BigNumberSerializer(this.userOpRequest.preVerificationGas).toString(),
        maxFeePerGas: new BigNumberSerializer(this.userOpRequest.maxFeePerGas).toString(),
        maxPriorityFeePerGas: new BigNumberSerializer(this.userOpRequest.maxPriorityFeePerGas).toString(),
        paymasterAndData: this.userOpRequest.paymasterAndData.toString(),
        signature: this.userOpRequest.signature.toString(),
      },
      combinedPubKey: this.combinedPubKey.toHex(),
      publicKeys: Object.fromEntries(
        Object.entries(this.publicKeys).map(([address, key]) => [
          address,
          key.toHex()
        ])
      ),
      publicNonces: Object.fromEntries(
        Object.entries(this.publicNonces).map(([address, nonces]) => [
          address,
          {
            kPublic: nonces.kPublic.toHex(),
            kTwoPublic: nonces.kTwoPublic.toHex()
          }
        ])
      ),
      signatures: Object.fromEntries(
        Object.entries(this.signatures).map(([address, output]) => [
          address,
          {
            finalPublicNonce: output.finalPublicNonce.toHex(),
            challenge: output.challenge.toHex(),
            signature: output.signature.toHex()
          }
        ])
      ),
    }
  }

  static fromJson = (serialized: any) => {
    const schema = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        opHash: { type: 'string' },
        userOpRequest: {
          type: 'object',
          properties: {
            sender: { type: 'string' },
            nonce: { type: 'string' },
            initCode: { type: 'string' },
            callData: { type: 'string' },
            callGasLimit: { type: 'string' },
            verificationGasLimit: { type: 'string' },
            preVerificationGas: { type: 'string' },
            maxFeePerGas: { type: 'string' },
            maxPriorityFeePerGas: { type: 'string' },
            paymasterAndData: { type: 'string' },
            signature: { type: 'string' }
          },
          required: ['sender', 'nonce', 'initCode', 'callData', 'callGasLimit', 'verificationGasLimit', 'preVerificationGas', 'maxFeePerGas', 'maxPriorityFeePerGas', 'paymasterAndData', 'signature']
        },
        combinedPubKey: { type: 'string' },
        publicNonces: {
          type: 'object',
          patternProperties: {
            '.*': {
              type: 'object',
              properties: {
                kPublic: { type: 'string' },
                kTwoPublic: { type: 'string' }
              },
              required: ['kPublic', 'kTwoPublic']
            }
          }
        },
        publicKeys: {
          type: 'object',
          patternProperties: {
            '.*': { type: 'string' }
          }
        },
        signatures: {
          type: 'object',
          patternProperties: {
            '.*': {
              type: 'object',
              properties: {
                finalPublicNonce: { type: 'string' },
                challenge: { type: 'string' },
                signature: { type: 'string' }
              },
              required: ['finalPublicNonce', 'challenge', 'signature']
            }
          }
        }
      }
    }

    const ajv = new Ajv()

    const validate = ajv.compile<SerializedMultiSigOp>(schema)
    const valid = validate(serialized)

    if (!valid) {
      throw new ValidationError('[MultiSigUserOP]: Invalid JSON format', validate.errors)
    }

    const id = serialized.id

    const opHash = serialized.opHash

    const userOpRequest = {
      sender: serialized.userOpRequest.sender,
      nonce: BigNumberSerializer.fromString(serialized.userOpRequest.nonce).number,
      initCode: serialized.userOpRequest.initCode,
      callData: serialized.userOpRequest.callData,
      callGasLimit: serialized.userOpRequest.callGasLimit,
      verificationGasLimit: serialized.userOpRequest.verificationGasLimit,
      preVerificationGas: BigNumberSerializer.fromString(serialized.userOpRequest.preVerificationGas).number,
      maxFeePerGas: BigNumberSerializer.fromString(serialized.userOpRequest.maxFeePerGas).number,
      maxPriorityFeePerGas: BigNumberSerializer.fromString(serialized.userOpRequest.maxPriorityFeePerGas).number,
      paymasterAndData: serialized.userOpRequest.paymasterAndData,
      signature: serialized.userOpRequest.signature,
    }

    const combinedPubKey = Key.fromHex(serialized.combinedPubKey)

    const publicNonces = Object.fromEntries(
      Object.entries(serialized.publicNonces).map(([address, nonces]) => [
        address,
        {
          kPublic: Key.fromHex(nonces.kPublic),
          kTwoPublic: Key.fromHex(nonces.kTwoPublic)
        }
      ])
    )

    const publicKeys = Object.fromEntries(
      Object.entries(serialized.publicKeys).map(([address, key]) => [
        address,
        Key.fromHex(key)
      ])
    )

    const signatures = Object.fromEntries(
      Object.entries(serialized.signatures).map(([address, output]) => [
        address,
        {
          finalPublicNonce: Key.fromHex(output.finalPublicNonce),
          challenge: Key.fromHex(output.challenge),
          signature: Key.fromHex(output.signature)
        }
      ])
    )

    const instance = Object.create(MultiSigUserOp.prototype)
    return Object.assign(instance, {
      id,
      opHash,
      userOpRequest,
      combinedPubKey,
      publicNonces,
      publicKeys,
      signatures,
    })
  }
}

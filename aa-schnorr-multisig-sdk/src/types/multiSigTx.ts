import type { SchnorrSigner } from "../signers"

import type { Key, PublicNonces, SignatureOutput } from "."

export interface MultiSigTx {
  signers: SchnorrSigner[]
  combinedPubKey: Key
  signatures: SignatureOutput[]
}

// signer address: SignatureOutput
export type SignersSignatures = Record<string, SignatureOutput>

// signer address: PublicNonces
export type SignersNonces = Record<string, PublicNonces>

// signer address: Key
export type SignersPubKeys = Record<string, Key>

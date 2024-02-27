import { SchnorrSigner } from "../signers"
import { Key, PublicNonces, SignatureOutput } from "."

export interface MultiSigTx {
  signers: SchnorrSigner[]
  combinedPubKey: Key
  signatures: SignatureOutput[]
}

export type SignersSignatures = {
  [signerAddress: string]: SignatureOutput
}

export type SignersNonces = {
  [signerAddress: string]: PublicNonces
}

export type SignersPubKeys = {
  [signerAddress: string]: Key
}
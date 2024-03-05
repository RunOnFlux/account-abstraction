export interface InternalNoncePairs {
  readonly k: Buffer
  readonly kTwo: Buffer
  readonly kPublic: Buffer
  readonly kTwoPublic: Buffer
}

export interface InternalPublicNonces {
  readonly kPublic: Buffer
  readonly kTwoPublic: Buffer
}

export interface InternalSignature {
  finalPublicNonce: Buffer // the final public nonce
  challenge: Buffer // the schnorr challenge
  signature: Buffer // the signature
}

export type InternalNonces = Record<string, InternalNoncePairs>

export interface HashFunction {
  (message: string): string
}

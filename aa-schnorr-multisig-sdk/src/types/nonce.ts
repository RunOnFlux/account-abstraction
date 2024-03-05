import type { Key } from "./key"

export interface NoncePairs {
  readonly k: Key
  readonly kTwo: Key
  readonly kPublic: Key
  readonly kTwoPublic: Key
}

export interface PublicNonces {
  readonly kPublic: Key
  readonly kTwoPublic: Key
}

// private key: NoncePairs
export type Nonces = Record<string, NoncePairs>

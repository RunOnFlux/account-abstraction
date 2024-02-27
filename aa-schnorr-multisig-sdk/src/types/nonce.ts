import { Key } from './key'

export interface NoncePairs {
  readonly k: Key,
  readonly kTwo: Key,
  readonly kPublic: Key,
  readonly kTwoPublic: Key,
}

export interface PublicNonces {
  readonly kPublic: Key,
  readonly kTwoPublic: Key,
}


export type Nonces = {
  [privateKey: string]: NoncePairs
}
import { generateRandomKeys } from "../core"
import Schnorrkel from "../schnorrkel"
import { Key } from "./Key"
import { PublicNonces } from "./nonce"
const schnorrkel = new Schnorrkel()

export default class DefaultSigner {
  #privateKey: Key
  #publicKey: Key

  constructor(index: number) {
    const keys = generateRandomKeys()
    this.#privateKey = keys.privateKey
    this.#publicKey = keys.publicKey
  }

  getPublicKey(): Key {
    return this.#publicKey
  }

  getPublicNonces(): PublicNonces {
    return schnorrkel.generatePublicNonces(this.#privateKey)
  }

  multiSignMessage(msg: string, publicKeys: Key[], publicNonces: PublicNonces[]) {
    return schnorrkel.multiSigSign(this.#privateKey, msg, publicKeys, publicNonces)
  }

  signMessage(msg: string) {
    return Schnorrkel.sign(this.#privateKey, msg)
  }
}

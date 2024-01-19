import Schnorrkel, { Key, PublicNonces } from "../src/index"
import { generateRandomKeys } from "../src/core"
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

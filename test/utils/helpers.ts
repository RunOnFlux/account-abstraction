import type { TransactionReceipt, BaseContract } from "ethers"
import { ethers } from "ethers"
import secp256k1 from "secp256k1"

import { SchnorrSigner } from "../../aa-schnorr-multisig-sdk/src/signers"
import { generateRandomKeys } from "../../aa-schnorr-multisig-sdk/src/core"

export function generateAddress(pk: string) {
  // the eth address
  const publicKey = secp256k1.publicKeyCreate(ethers.getBytes(pk))
  const px = publicKey.slice(1, 33)
  const pxGeneratedAddress = ethers.hexlify(px)
  const address = `0x${pxGeneratedAddress.slice(-40, pxGeneratedAddress.length)}`

  return { address }
}

export const getSaltHash = (saltText: string): string => ethers.id(saltText)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getEvent(txReceipt: TransactionReceipt, contract: BaseContract, eventName: string) {
  const event = contract.getEvent(eventName)

  const logs = txReceipt.logs?.filter((log) => log.topics.includes(event.fragment.topicHash)) ?? ""
  if (logs.length === 0) throw new Error(`Event ${eventName} was not emmited`)

  return contract.interface.parseLog(logs[0])
}

export function createRandomSchnorrSigner(): SchnorrSigner {
  const keys = generateRandomKeys()
  return new SchnorrSigner(keys.privateKey.buffer)
}

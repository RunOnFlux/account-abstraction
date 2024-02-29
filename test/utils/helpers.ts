import type { providers } from "ethers"
import { ethers } from "ethers"
import secp256k1 from "secp256k1"

import { SchnorrSigner } from "../../aa-schnorr-multisig-sdk/src/signers"
import { generateRandomKeys } from "../../aa-schnorr-multisig-sdk/src/core"

export function generateAddress(pk: string) {
  // the eth address
  const publicKey = secp256k1.publicKeyCreate(ethers.utils.arrayify(pk))
  const px = publicKey.slice(1, 33)
  const pxGeneratedAddress = ethers.utils.hexlify(px)
  const address = `0x${pxGeneratedAddress.slice(-40, pxGeneratedAddress.length)}`

  return { address }
}

export const getSalt = (salt: string) => ethers.utils.keccak256(ethers.utils.toUtf8Bytes(salt))

export async function getEvent(tx: providers.TransactionResponse, contract: any, eventName: string) {
  const receipt = await contract.provider.getTransactionReceipt(tx.hash)
  const eventFragment = contract.interface.getEvent(eventName)
  const topic = contract.interface.getEventTopic(eventFragment)
  const logs = receipt.logs?.filter((log) => log.topics.includes(topic)) ?? ""
  if (logs.length === 0) throw new Error(`Event ${eventName} was not emmited`)

  return contract.interface.parseLog(logs[0])
}

export function createRandomSchnorrSigner(): SchnorrSigner {
  const keys = generateRandomKeys()
  return new SchnorrSigner(keys.privateKey.buffer)
}

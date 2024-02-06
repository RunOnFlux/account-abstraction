import { ContractTransactionResponse, EventLog } from "ethers"
import { ethers } from "hardhat"
import secp256k1 from "secp256k1"

export const ERC1271_MAGICVALUE_BYTES32 = "0x1626ba7e"
export const ERC1271_INVALID_SIGNATURE = "0xffffffff"
export const HEX_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000"
export const HEX_ONE = "0x0000000000000000000000000000000000000000000000000000000000000001"
export const OWNER_ROLE_HASH = ethers.solidityPackedKeccak256(["string"], ["OWNER_ROLE"])
export const SIGNER_ROLE_HASH = ethers.solidityPackedKeccak256(["string"], ["SIGNER_ROLE"])

export async function generateAddress(pk: string) {
  // the eth address
  const publicKey = secp256k1.publicKeyCreate(ethers.getBytes(pk))
  const px = publicKey.slice(1, 33)
  const pxGeneratedAddress = ethers.hexlify(px)
  const address = "0x" + pxGeneratedAddress.slice(pxGeneratedAddress.length - 40, pxGeneratedAddress.length)

  return { address }
}

export const getSalt = (salt: string) => ethers.keccak256(ethers.toUtf8Bytes(salt))

export async function getEventLog(tx: ContractTransactionResponse, contract: any, eventName: string): Promise<EventLog> {
  const receipt = await tx.wait()
  const eventFragment = contract.interface.getEvent(eventName)
  const topic = eventFragment?.topicHash
  const logs = (receipt?.logs?.filter((log: any) => log.topics.includes(topic)) ?? "") as EventLog[]
  if (logs.length === 0) throw new Error(`Event ${eventName} was not emmited`)
  return logs[0]
}

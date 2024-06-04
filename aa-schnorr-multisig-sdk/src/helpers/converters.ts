import { ethers } from "ethers"

export function hashMsgKeccak256(message: string): string {
  return ethers.solidityPackedKeccak256(["string"], [message])
}

export function pubKey2Address(publicKeyBuffer: Buffer): string {
  const publicKeyHash = Buffer.from(ethers.getBytes(ethers.keccak256(publicKeyBuffer.subarray(1))))

  const address = `0x${publicKeyHash.subarray(-20).toString("hex")}`

  return address
}

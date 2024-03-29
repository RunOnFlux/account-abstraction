import { ethers } from "ethers"

export function hashMsgKeccak256(message: string): string {
  return ethers.utils.solidityKeccak256(["string"], [message])
}

export function pubKey2Address(publicKeyBuffer: Buffer): string {
  const px = ethers.utils.hexlify(publicKeyBuffer.subarray(1, 33))
  const address = `0x${px.slice(-40, px.length)}`
  return address
}

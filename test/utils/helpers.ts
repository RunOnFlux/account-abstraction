import { ethers } from "hardhat"
import secp256k1 from "secp256k1"

export const ERC1271_MAGICVALUE_BYTES32 = "0x1626ba7e"
export const ERC1271_INVALID_SIGNATURE = "0xffffffff"
export const HEX_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000"
export const HEX_ONE = "0x0000000000000000000000000000000000000000000000000000000000000001"

export async function generateAddress(pk: string) {
  // the eth address
  const publicKey = secp256k1.publicKeyCreate(ethers.getBytes(pk))
  const px = publicKey.slice(1, 33)
  const pxGeneratedAddress = ethers.hexlify(px)
  const address = "0x" + pxGeneratedAddress.slice(pxGeneratedAddress.length - 40, pxGeneratedAddress.length)

  return { address }
}

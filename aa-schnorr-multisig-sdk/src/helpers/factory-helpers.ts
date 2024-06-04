import type { Signer } from "ethers"
import { ethers } from "ethers"

import type { Hex } from "../types/misc"
import { MultiSigSmartAccountFactory_abi } from "../abi"

export async function predictAccountAddress(
  factoryAddress: Hex,
  signer: Signer,
  combinedPubKeys: string[],
  salt: string
): Promise<`0x${string}`> {
  const smartAccountFactory = new ethers.Contract(factoryAddress, MultiSigSmartAccountFactory_abi, signer)
  const saltHash = ethers.keccak256(ethers.toUtf8Bytes(salt))
  const predictedAccount = await smartAccountFactory.getAccountAddress(combinedPubKeys, saltHash)
  return predictedAccount as Hex
}

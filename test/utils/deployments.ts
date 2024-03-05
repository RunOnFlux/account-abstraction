import { ethers, getChainId } from "hardhat"

import type { MultiSigSmartAccount, MultiSigSmartAccountFactory } from "../../src/typechain"
import { MultiSigSmartAccountFactory__factory, MultiSigSmartAccount__factory } from "../../src/typechain"
import { getEntryPointByChainId } from "../../deploy/helpers/const"

import { getEvent, getSalt } from "./helpers"

interface MultiSigSmartAccountSet {
  mssaFactory: MultiSigSmartAccountFactory
  schnorrAA: MultiSigSmartAccount
  salt: string
}

export async function deployMultiSigSmartAccount(combinedPubKeys: string[]): Promise<MultiSigSmartAccountSet> {
  const [deployer] = await ethers.getSigners()
  const salt = getSalt("salt")
  const chainId = await getChainId()
  const ENTRY_POINT_ADDRESS = getEntryPointByChainId(chainId)
  if (!ENTRY_POINT_ADDRESS) throw new Error("Entry Point undefined")

  const mssaFactory = (await new MultiSigSmartAccountFactory__factory(deployer).deploy(ENTRY_POINT_ADDRESS)) as MultiSigSmartAccountFactory

  // create new account
  const createTx = await mssaFactory.connect(deployer).createAccount(combinedPubKeys, salt)

  const predictedAddress = await mssaFactory.getAccountAddress(combinedPubKeys, salt)
  const event = await getEvent(createTx, mssaFactory, "MultiSigSmartAccountCreated")
  const accountAddress = event.args[0]
  if (accountAddress !== predictedAddress) throw new Error(`Predicted address differs from created account's address`)

  const schnorrAA = new MultiSigSmartAccount__factory(deployer).attach(predictedAddress) as unknown as MultiSigSmartAccount

  return { mssaFactory, schnorrAA, salt }
}

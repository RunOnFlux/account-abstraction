import { ethers, getChainId } from "hardhat"
import {
  MultiSigSmartAccount,
  MultiSigSmartAccountFactory,
  MultiSigSmartAccountFactory__factory,
  MultiSigSmartAccount__factory,
} from "../../src/typechain"
import { getEvent, getSalt } from "./helpers"
import { getEntryPointByChainId } from "../../deploy/helpers/const"

interface MultiSigSmartAccountSet {
  mssaFactory: MultiSigSmartAccountFactory
  schnorrAA: MultiSigSmartAccount
}

export async function deployMultiSigSmartAccount(combinedPubKeys: string[]): Promise<MultiSigSmartAccountSet> {
  const [deployer] = await ethers.getSigners()
  const _salt = getSalt("salt")
  const chainId = await getChainId()
  const ENTRY_POINT_ADDRESS = getEntryPointByChainId(chainId)
  if (!ENTRY_POINT_ADDRESS) throw new Error("Entry Point undefined")

  const mssaFactory = (await new MultiSigSmartAccountFactory__factory(deployer).deploy(ENTRY_POINT_ADDRESS)) as MultiSigSmartAccountFactory

  // create new account
  const createTx = await mssaFactory.connect(deployer).createAccount(deployer.address, combinedPubKeys, _salt)

  const predictedAddress = await mssaFactory.getAccountAddress(deployer.address, combinedPubKeys, _salt)
  const event = await getEvent(createTx, mssaFactory, "SmartAccountCreated")
  const accountAddress = event.args[0]
  if (accountAddress != predictedAddress) throw new Error(`Predicted address differs from created account's address`)

  const schnorrAA = new MultiSigSmartAccount__factory(deployer).attach(predictedAddress) as unknown as MultiSigSmartAccount

  return { mssaFactory, schnorrAA }
}

import { ethers } from "hardhat"
import {
  MultiSigSmartAccount,
  MultiSigSmartAccountFactory,
  MultiSigSmartAccountFactory__factory,
  MultiSigSmartAccount__factory,
} from "../../typechain-types"
import { getEventLog, getSalt } from "./helpers"
import { ENTRY_POINT_ALCHEMY_ADDRESS } from "../../src/utils/constants"

interface MultiSigSmartAccountSet {
  mssaFactory: MultiSigSmartAccountFactory
  schnorrAA: MultiSigSmartAccount
}

export async function deployMultiSigSmartAccount(combinedPubKeys: string[]): Promise<MultiSigSmartAccountSet> {
  const [deployer] = await ethers.getSigners()
  const _salt = getSalt("salt")

  const mssaFactory = (await new MultiSigSmartAccountFactory__factory(deployer).deploy(
    ENTRY_POINT_ALCHEMY_ADDRESS
  )) as MultiSigSmartAccountFactory

  // create new account
  const createTx = await mssaFactory.connect(deployer).createAccount(deployer.address, combinedPubKeys, _salt)

  const predictedAddress = await mssaFactory.getAccountAddress(deployer.address, combinedPubKeys, _salt)
  const event = await getEventLog(createTx, mssaFactory, "SmartAccountCreated")
  const accountAddress = event.args[0]
  if (accountAddress != predictedAddress) throw new Error(`Predicted address differs from created account's address`)

  const schnorrAA = new MultiSigSmartAccount__factory(deployer).attach(predictedAddress) as MultiSigSmartAccount

  return { mssaFactory, schnorrAA }
}

import { ethers, getChainId, deployments } from "hardhat"
import type { Signer } from "ethers"

import type { MultiSigSmartAccount, MultiSigSmartAccountFactory } from "../../src/typechain"
import { MultiSigSmartAccount__factory, MultiSigSmartAccountFactory__factory } from "../../src/typechain"
import { getEntryPointByChainId } from "../../deploy/helpers/const"
import { saltToHex } from "../../aa-schnorr-multisig-sdk/src/helpers/create2"

import { getEvent } from "./helpers"

interface MultiSigSmartAccountSet {
  mssaFactory: MultiSigSmartAccountFactory
  schnorrAA: MultiSigSmartAccount
  salt: string
}

export async function deployMultiSigSmartAccount(
  combinedPubKeys: string[],
  salt?: string,
  signer?: Signer
): Promise<MultiSigSmartAccountSet> {
  const deployer: Signer = signer ?? (await ethers.getSigners())[0]
  const saltAccount = saltToHex(salt ?? "salt")
  const chainId = await getChainId()
  const deployerAddress = await deployer.getAddress()
  const ENTRY_POINT_ADDRESS = getEntryPointByChainId(chainId)
  if (!ENTRY_POINT_ADDRESS) throw new Error("Entry Point undefined")
  const { deterministic } = deployments
  const saltFactory = saltToHex("factoryrandomsalt")

  const { deploy } = await deterministic("MultiSigSmartAccountFactory", {
    from: deployerAddress,
    args: [ENTRY_POINT_ADDRESS, saltFactory],
    salt: saltFactory,
  })
  const deployedAddress = (await deploy()).address
  const mssaFactory = MultiSigSmartAccountFactory__factory.connect(deployedAddress, deployer)

  // create new account
  const createTx = await mssaFactory.createAccount(combinedPubKeys, saltAccount)

  const createReceipt = await createTx.wait()

  if (!createReceipt) throw new Error("SmartAccount create transaction failed")

  const predictedAddress = await mssaFactory.getAccountAddress(combinedPubKeys, saltAccount)
  const event = await getEvent(createReceipt, mssaFactory, "MultiSigSmartAccountCreated")

  const accountAddress = event?.args[0]
  if (accountAddress !== predictedAddress) throw new Error(`Predicted address differs from created account's address`)
  const schnorrAA = MultiSigSmartAccount__factory.connect(predictedAddress, deployer)

  return { mssaFactory, schnorrAA, salt: saltAccount }
}

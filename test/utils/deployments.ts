import { ethers, getChainId, deployments } from "hardhat"
import type { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

import type { MultiSigSmartAccount, MultiSigSmartAccountFactory } from "../../src/typechain"
import { MultiSigSmartAccount__factory } from "../../src/typechain"
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
  signer?: SignerWithAddress
): Promise<MultiSigSmartAccountSet> {
  const deployer: SignerWithAddress = signer ?? (await ethers.getSigners())[0]
  const saltAccount = saltToHex(salt ?? "salt")
  const chainId = await getChainId()
  const ENTRY_POINT_ADDRESS = getEntryPointByChainId(chainId)
  if (!ENTRY_POINT_ADDRESS) throw new Error("Entry Point undefined")
  const { deterministic } = deployments
  const Factory = await ethers.getContractFactory("MultiSigSmartAccountFactory")
  const saltFactory = saltToHex("factoryrandomsalt")

  const { deploy } = await deterministic("MultiSigSmartAccountFactory", {
    from: deployer.address,
    args: [ENTRY_POINT_ADDRESS, saltFactory],
    salt: saltFactory,
  })
  const deployedAddress = (await deploy()).address
  const mssaFactory = Factory.attach(deployedAddress)

  // create new account
  const createTx = await mssaFactory.connect(deployer).createAccount(combinedPubKeys, saltAccount)

  const predictedAddress = await mssaFactory.getAccountAddress(combinedPubKeys, saltAccount)
  const event = await getEvent(createTx, mssaFactory, "MultiSigSmartAccountCreated")
  const accountAddress = event.args[0]
  if (accountAddress !== predictedAddress) throw new Error(`Predicted address differs from created account's address`)
  const schnorrAA = new MultiSigSmartAccount__factory(deployer).attach(predictedAddress) as unknown as MultiSigSmartAccount

  return { mssaFactory, schnorrAA, salt: saltAccount }
}

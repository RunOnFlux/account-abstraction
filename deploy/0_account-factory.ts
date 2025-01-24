import type { DeployFunction } from "hardhat-deploy/types"
import type { HardhatRuntimeEnvironment } from "hardhat/types"

import { KNOWN_ACCOUNT } from "../config/networks"
import { saltToHex } from "../aa-schnorr-multisig-sdk/src/helpers/create2"
import { MultiSigSmartAccountFactory__factory } from "../src/typechain"

import { verifyContract } from "./helpers/verify"
import { ENTRY_POINT_ALCHEMY_ADDRESS, TAGS } from "./helpers/const"

const CONTRACT_NAME = "MultiSigSmartAccountFactory"

const deployFct: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, getChainId, ethers } = hre
  const { [KNOWN_ACCOUNT.DEPLOYER]: deployer } = await getNamedAccounts()
  const { deterministic } = deployments
  const chainId = await getChainId()
  const { provider } = ethers

  // salt can be changed to any different
  const saltHex = saltToHex("aafactorysalt")
  const args = [ENTRY_POINT_ALCHEMY_ADDRESS, saltHex]

  const { deploy } = await deterministic(CONTRACT_NAME, {
    from: deployer,
    args,
    log: true,
    waitConfirmations: 10,
    salt: saltHex,
  })

  const deployResults = await deploy()

  const deployedAddress = deployResults.address
  console.log(`---> ${CONTRACT_NAME} address: ${deployedAddress}`)
  console.log(`---> ${CONTRACT_NAME} salt used: ${saltHex}`)

  if (deployResults.receipt?.transactionHash) {
    await verifyContract(deployedAddress, hre, args)

    const Factory = MultiSigSmartAccountFactory__factory.connect(deployedAddress, await ethers.getSigner(deployer))
    const accountImplementation = await Factory.accountImplementation()
    console.log(`---> Account Implementation address: ${accountImplementation}`)
    await verifyContract(accountImplementation, hre, [ENTRY_POINT_ALCHEMY_ADDRESS])
  }
}

deployFct.tags = [TAGS.FULL, TAGS.ACCOUNT_FACTORY]
export default deployFct

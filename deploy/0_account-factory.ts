import type { DeployFunction } from "hardhat-deploy/types"
import type { HardhatRuntimeEnvironment } from "hardhat/types"

import { KNOWN_ACCOUNT } from "../config/networks"
import type { Deployment } from "../src/deployments/deploymentManager"
import { deploymentManager } from "../src/deployments/deploymentManager"
import { saltToHex } from "../aa-schnorr-multisig-sdk/src/helpers/create2"

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
    // workaround for verification error
    await provider.waitForTransaction(deployResults.receipt?.transactionHash, 10)
    await verifyContract(deployedAddress, hre, args)

    const Factory = await ethers.getContractFactory("MultiSigSmartAccountFactory")
    const mssaFactory = Factory.attach(deployedAddress)
    const accountImplAddr = await mssaFactory.accountImplementation()
    console.log(`---> Account Implementation address: ${accountImplAddr}`)
    await verifyContract(accountImplAddr, hre, [ENTRY_POINT_ALCHEMY_ADDRESS])
  }
  const deploys: Deployment = {
    MultiSigSmartAccountFactory: deployedAddress,
  }
  await deploymentManager.write(chainId, deploys)
}

deployFct.tags = [TAGS.FULL, TAGS.ACCOUNT_FACTORY]
export default deployFct

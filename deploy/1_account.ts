import type { DeployFunction } from "hardhat-deploy/types"
import type { HardhatRuntimeEnvironment } from "hardhat/types"

import { KNOWN_ACCOUNT } from "../config/networks"

import { verifyContract } from "./helpers/verify"
import { ENTRY_POINT_ALCHEMY_ADDRESS, TAGS } from "./helpers/const"

const CONTRACT_NAME = "MultiSigSmartAccount"

const deployFct: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers } = hre
  const { [KNOWN_ACCOUNT.DEPLOYER]: deployer } = await getNamedAccounts()
  const { deterministic } = deployments
  const { provider } = ethers

  const args = [ENTRY_POINT_ALCHEMY_ADDRESS]

  const { deploy } = await deterministic(CONTRACT_NAME, {
    from: deployer,
    args,
    log: true,
    waitConfirmations: 5,
  })

  const deployResults = await deploy()

  const deployedAddress = deployResults.address
  console.log(`${CONTRACT_NAME} address: ${deployedAddress}`)

  if (deployResults.receipt?.transactionHash) {
    // workaround for verification error
    await provider.waitForTransaction(deployResults.receipt?.transactionHash, 5)
    await verifyContract(deployedAddress, hre, args)
  }
}

deployFct.tags = [TAGS.FULL, TAGS.ACCOUNT]
export default deployFct

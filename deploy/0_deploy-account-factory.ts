import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { ENTRY_POINT_ALCHEMY_ADDRESS, KNOWN_ACCOUNT, TAGS } from "../src/utils/constants"
import { verifyContract } from "./helpers/verify"

const CONTRACT_NAME = "MultiSigSmartAccountFactory"

const deploy: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre
  const { [KNOWN_ACCOUNT.DEPLOYER]: deployer } = await getNamedAccounts()
  const { deterministic } = deployments
  const args = [ENTRY_POINT_ALCHEMY_ADDRESS]

  const { deploy } = await deterministic(CONTRACT_NAME, {
    from: deployer,
    args: args,
    log: true,
  })

  const deployResults = await deploy()

  const deployedAddress = deployResults.address
  console.log(`${CONTRACT_NAME} address: ${deployedAddress}`)

  if (deployResults.receipt?.transactionHash) await verifyContract(deployedAddress, hre, args)
}

deploy.tags = [TAGS.FULL, TAGS.TEST, TAGS.ACCOUNT_FACTORY]
export default deploy

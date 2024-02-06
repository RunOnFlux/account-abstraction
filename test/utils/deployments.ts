import { ethers } from "hardhat"

import type { SchnorrAccountAbstraction } from "../../typechain-types"

interface SchnorrAAFixture {
  schnorrAA: SchnorrAccountAbstraction
}

export async function deploySchnorrAA(addresses: string[]): Promise<SchnorrAAFixture> {
  const [deployer] = await ethers.getSigners()
  // contract implementation
  const SchnorrAAFactory = await ethers.getContractFactory("SchnorrAccountAbstraction")

  const schnorrAA = (await SchnorrAAFactory.connect(deployer).deploy(addresses)) as unknown as SchnorrAccountAbstraction

  return { schnorrAA }
}

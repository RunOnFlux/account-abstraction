import { ethers } from "hardhat"
import secp256k1 from "secp256k1"

import type { SchnorrAccountAbstraction } from "../typechain-types"
import { pk1 } from "./config"

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

export async function generateAddress() {
  // the eth address
  const publicKey = secp256k1.publicKeyCreate(ethers.getBytes(pk1))
  const px = publicKey.slice(1, 33)
  const pxGeneratedAddress = ethers.hexlify(px)
  const address = "0x" + pxGeneratedAddress.slice(pxGeneratedAddress.length - 40, pxGeneratedAddress.length)

  return { address }
}

import { ethers } from "hardhat"
import secp256k1 from "secp256k1"

import type { SchnorrAccountAbstraction } from "../typechain-types"
import { pk1 } from "./config"
import Schnorrkel from "../src"

interface SchnorAAFixture {
  schnorrAA: SchnorrAccountAbstraction
}

export async function deploySchnorAA(addresses: string[]): Promise<SchnorAAFixture> {
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

export async function generateCombinedPublicAddress(signerOne: any, signerTwo: any) {
  // get the public key
  const combinedPublicKey = Schnorrkel.getCombinedPublicKey([signerOne.getPublicKey(), signerTwo.getPublicKey()])
  const px = ethers.hexlify(combinedPublicKey.buffer.subarray(1, 33))
  const combinedAddress = "0x" + px.slice(px.length - 40, px.length)

  return { combinedAddress }
}

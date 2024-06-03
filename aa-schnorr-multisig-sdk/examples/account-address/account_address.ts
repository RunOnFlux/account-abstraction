import "dotenv/config"

import { JsonRpcProvider, randomBytes } from "ethers"
import { http } from "viem"
import type { Address } from "@alchemy/aa-core"
import { getEntryPoint } from "@alchemy/aa-core"
import secp256k1 from "secp256k1"
import { polygon } from "viem/chains"

import {
  predictAccountAddrOffchain,
  predictAccountAddrOnchain,
  predictAccountImplementationAddrOffchain,
  saltToHex,
} from "../../src/helpers/create2"
import { ENTRY_POINT_ALCHEMY_ADDRESS } from "../../../deploy/helpers/const"
import { deployments } from "../../src/generated/deployments"
import { createMultiSigSmartAccount } from "../../src/accountAbstraction"
import { createSchnorrSigner, getAllCombinedAddrFromKeys } from "../../src/helpers/schnorr-helpers"

const CHAIN = polygon

async function getAddressOnChain(combinedAddresses: string[], salt: string) {
  const factoryAddress = deployments[polygon.id]?.MultiSigSmartAccountFactory
  const provider = new JsonRpcProvider(process.env.ALCHEMY_RPC_URL)
  return predictAccountAddrOnchain(factoryAddress, combinedAddresses, salt, provider)
}

function getAddressOffChain(combinedAddresses: string[], salt: string) {
  const factorySalt = "aafactorysalt"
  const factoryAddress = deployments[polygon.id]?.MultiSigSmartAccountFactory
  const accountImplementationAddress = predictAccountImplementationAddrOffchain(factorySalt, factoryAddress, ENTRY_POINT_ALCHEMY_ADDRESS)

  return predictAccountAddrOffchain(factoryAddress, accountImplementationAddress, combinedAddresses, salt)
}

async function getAddressAlchemyAASDK(combinedAddresses: Address[], salt: string) {
  const rpcUrl = process.env.ALCHEMY_RPC_URL
  const transport = http(rpcUrl)
  const multiSigSmartAccount = await createMultiSigSmartAccount({
    transport,
    chain: CHAIN,
    combinedAddress: combinedAddresses,
    salt: saltToHex(salt),
    entryPoint: getEntryPoint(CHAIN),
  })

  return multiSigSmartAccount.address
}

async function main() {
  /**
   * Generate 3 random private keys
   */
  let privKey1
  do privKey1 = randomBytes(32)
  while (!secp256k1.privateKeyVerify(privKey1))

  let privKey2
  do privKey2 = randomBytes(32)
  while (!secp256k1.privateKeyVerify(privKey2))

  let privKey3
  do privKey3 = randomBytes(32)
  while (!secp256k1.privateKeyVerify(privKey3))

  const schnorrSigner1 = createSchnorrSigner(privKey1)
  const publicKey1 = schnorrSigner1.getPubKey()

  const schnorrSigner2 = createSchnorrSigner(privKey2)
  const publicKey2 = schnorrSigner2.getPubKey()

  const schnorrSigner3 = createSchnorrSigner(privKey3)
  const publicKey3 = schnorrSigner3.getPubKey()

  const publicKeys = [publicKey1, publicKey2, publicKey3]

  const combinedAddresses = getAllCombinedAddrFromKeys(publicKeys, 3)
  const salt = "random salt for randomly generated priv keys"

  const addressOffChain = getAddressOffChain(combinedAddresses, salt)
  console.log("Get address off chain:", addressOffChain)

  const addressOnChain = await getAddressOnChain(combinedAddresses, salt)
  console.log("Get address on chain:", addressOnChain)

  const addressOnChainAlchemy = await getAddressAlchemyAASDK(combinedAddresses, salt)
  console.log("Get address on chain (Alchemy SDK):", addressOnChainAlchemy)
}

main()

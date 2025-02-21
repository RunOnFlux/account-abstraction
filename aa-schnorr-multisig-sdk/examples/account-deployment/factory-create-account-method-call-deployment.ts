import "dotenv/config"

import { JsonRpcProvider, randomBytes, Wallet } from "ethers"
import secp256k1 from "secp256k1"
import type { Hex } from "viem"
import { polygon } from "viem/chains"

import { createSchnorrSigner, getAllCombinedAddrFromKeys } from "../../src/helpers/schnorr-helpers"
import { MultiSigSmartAccountFactory__factory } from "../../src/generated/typechain"
import { predictAccountAddrOnchain, saltToHex } from "../../src/helpers/create2"
import { deployments } from "../../src/generated/deployments"

const CHAIN = polygon

async function factoryCallCreateSmartAccount() {
  const privKey1 = process.env.PRIVATE_KEY as Hex
  const schnorrSigner1 = createSchnorrSigner(privKey1)
  const publicKey1 = schnorrSigner1.getPubKey()

  let privKey2
  do privKey2 = randomBytes(32)
  while (!secp256k1.privateKeyVerify(privKey2))
  const schnorrSigner2 = createSchnorrSigner(privKey2)
  const publicKey2 = schnorrSigner2.getPubKey()

  const salt = "aasalt" // To maintain cross-wallet compatibility with SSP Wallet, we are using 'aasalt', usage of different salt will lead to different multisignature address

  const publicKeys = [publicKey1, publicKey2]

  const combinedAddresses = getAllCombinedAddrFromKeys(publicKeys, 2)

  const provider = new JsonRpcProvider(process.env.ALCHEMY_RPC_URL)
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider)

  const factoryAddress = deployments[CHAIN.id]?.MultiSigSmartAccountFactory

  const smartAccountAddress = await predictAccountAddrOnchain(factoryAddress, combinedAddresses, salt, provider)
  console.log("Smart Account Address:", smartAccountAddress)

  const multiSigSmartAccountFactory = MultiSigSmartAccountFactory__factory.connect(factoryAddress, wallet)

  const createAccountTransactionResponse = await multiSigSmartAccountFactory.createAccount(combinedAddresses, saltToHex(salt))

  await createAccountTransactionResponse.wait()
  console.log("Smart Account deployment transaction hash:", createAccountTransactionResponse.hash)
}

async function main() {
  await factoryCallCreateSmartAccount()
}

main()

import "dotenv/config"

import { JsonRpcProvider, randomBytes, Wallet } from "ethers"
import secp256k1 from "secp256k1"
import type { Address } from "@alchemy/aa-core"

import { createSchnorrSigner, getAllCombinedAddrFromKeys } from "../../src/helpers/schnorr-helpers"
import { MultiSigSmartAccountFactory__factory } from "../../src/generated/typechain"
import { predictAccountAddrOnchain, saltToHex } from "../../src/helpers/create2"

async function factoryCallCreateSmartAccount() {
  const privKey1 = process.env.PRIVATE_KEY as Address
  const schnorrSigner1 = createSchnorrSigner(privKey1)
  const publicKey1 = schnorrSigner1.getPubKey()

  let privKey2
  do privKey2 = randomBytes(32)
  while (!secp256k1.privateKeyVerify(privKey2))
  const schnorrSigner2 = createSchnorrSigner(privKey2)
  const publicKey2 = schnorrSigner2.getPubKey()

  const salt = "this is salt"

  const publicKeys = [publicKey1, publicKey2]

  const combinedAddresses = getAllCombinedAddrFromKeys(publicKeys, 2)

  const provider = new JsonRpcProvider(process.env.ALCHEMY_RPC_URL)
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider)

  const factoryAddress = "0xA76f98D25C9775F67DCf8B9EF9618d454D287467"

  const smartAccountAdddress = await predictAccountAddrOnchain(factoryAddress, combinedAddresses, salt, provider)
  console.log("Smart Account Address:", smartAccountAdddress)

  const multiSigSmartAccountFactory = MultiSigSmartAccountFactory__factory.connect(factoryAddress, wallet)

  const createAccountTransactionResponse = await multiSigSmartAccountFactory.createAccount(combinedAddresses, saltToHex(salt))

  await createAccountTransactionResponse.wait()
  console.log("Smart Account deployment transaction hash:", createAccountTransactionResponse.hash)
}

async function main() {
  await factoryCallCreateSmartAccount()
}

main()

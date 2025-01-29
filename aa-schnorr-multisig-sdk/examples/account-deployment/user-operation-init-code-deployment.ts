import "dotenv/config"

import type { Address } from "@alchemy/aa-core"
import { createSmartAccountClient, deepHexlify, getEntryPoint } from "@alchemy/aa-core"
import { JsonRpcProvider, randomBytes, Wallet } from "ethers"
import secp256k1 from "secp256k1"
import type { Hex } from "viem"
import { http, parseUnits } from "viem"
import { polygon } from "viem/chains"

import { deployments } from "../../src/generated/deployments"
import { predictAccountAddrOnchain, saltToHex } from "../../src/helpers/create2"
import { createSchnorrSigner, getAllCombinedAddrFromKeys } from "../../src/helpers/schnorr-helpers"
import { createMultiSigSmartAccount } from "../../src/accountAbstraction"
import { MultiSigUserOp } from "../../src/userOperation"

const CHAIN = polygon
const CLIENT_OPT = {
  feeOptions: {
    maxPriorityFeePerGas: { multiplier: 1.5 },
    maxFeePerGas: { multiplier: 1.5 },
    preVerificationGas: { multiplier: 1.5 },
  },

  txMaxRetries: 5,
  txRetryMultiplier: 3,
}

async function userOperationInitCodeDeploySmartAccount() {
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

  const smartAccountAdddress = await predictAccountAddrOnchain(factoryAddress, combinedAddresses, salt, provider)
  console.log("Smart Account Address:", smartAccountAdddress)

  const initTransactionCost = parseUnits("0.05", 18)
  const addBalanceToSmartAccountTransaction = await wallet.sendTransaction({ to: smartAccountAdddress, value: initTransactionCost })
  await addBalanceToSmartAccountTransaction.wait()

  const transport = http(process.env.ALCHEMY_RPC_URL)
  const multiSigSmartAccount = await createMultiSigSmartAccount({
    transport,
    chain: CHAIN,
    combinedAddress: combinedAddresses,
    salt: saltToHex(salt),
    entryPoint: getEntryPoint(CHAIN),
  })

  const smartAccountClient = createSmartAccountClient({
    transport,
    chain: CHAIN,
    account: multiSigSmartAccount,

    opts: CLIENT_OPT,
  })

  const uoStruct = await smartAccountClient.buildUserOperation({
    account: multiSigSmartAccount,
    uo: "0x",
  })
  const uoStructHash = multiSigSmartAccount.getEntryPoint().getUserOperationHash(deepHexlify(uoStruct))

  const publicNonces1 = schnorrSigner1.generatePubNonces()
  const publicNonces2 = schnorrSigner2.generatePubNonces()

  const multiSigUserOp = new MultiSigUserOp([publicKey1, publicKey2], [publicNonces1, publicNonces2], uoStructHash, uoStruct)

  multiSigUserOp.signMultiSigHash(schnorrSigner1)
  multiSigUserOp.signMultiSigHash(schnorrSigner2)

  const summedSignature = multiSigUserOp.getSummedSigData()

  const uoHash = await smartAccountClient.sendRawUserOperation(
    {
      ...deepHexlify(uoStruct),
      signature: summedSignature,
    },
    multiSigSmartAccount.getEntryPoint().address
  )

  const txHash = await smartAccountClient.waitForUserOperationTransaction({ hash: uoHash })
  console.log("Smart Account initCode user operation transaction hash:", txHash)
}

async function userOperationInitCodeERC20MintDeploySmartAccount() {
  const privKey1 = process.env.PRIVATE_KEY as Address
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

  const smartAccountAdddress = await predictAccountAddrOnchain(factoryAddress, combinedAddresses, salt, provider)
  console.log("Smart Account Address:", smartAccountAdddress)

  const initTransactionCost = parseUnits("0.05", 18)
  const addBalanceToSmartAccountTransaction = await wallet.sendTransaction({ to: smartAccountAdddress, value: initTransactionCost })
  await addBalanceToSmartAccountTransaction.wait()

  const transport = http(process.env.ALCHEMY_RPC_URL)
  const multiSigSmartAccount = await createMultiSigSmartAccount({
    transport,
    chain: CHAIN,
    combinedAddress: combinedAddresses,
    salt: saltToHex(salt),
    entryPoint: getEntryPoint(CHAIN),
  })

  const smartAccountClient = createSmartAccountClient({
    transport,
    chain: CHAIN,
    account: multiSigSmartAccount,

    opts: CLIENT_OPT,
  })

  const uoStruct = await smartAccountClient.buildUserOperation({
    account: multiSigSmartAccount,
    uo: {
      value: 0n,
      data: "0x",
      target: multiSigSmartAccount.address,
    },
  })
  const uoStructHash = multiSigSmartAccount.getEntryPoint().getUserOperationHash(deepHexlify(uoStruct))

  const publicNonces1 = schnorrSigner1.generatePubNonces()
  const publicNonces2 = schnorrSigner2.generatePubNonces()

  const multiSigUserOp = new MultiSigUserOp([publicKey1, publicKey2], [publicNonces1, publicNonces2], uoStructHash, uoStruct)

  multiSigUserOp.signMultiSigHash(schnorrSigner1)
  multiSigUserOp.signMultiSigHash(schnorrSigner2)

  const summedSignature = multiSigUserOp.getSummedSigData()

  const uoHash = await smartAccountClient.sendRawUserOperation(
    {
      ...deepHexlify(uoStruct),
      signature: summedSignature,
    },
    multiSigSmartAccount.getEntryPoint().address
  )

  const txHash = await smartAccountClient.waitForUserOperationTransaction({ hash: uoHash })
  console.log("Smart Account initCode + ERC20 mint user operation transaction hash:", txHash)
}

async function main() {
  await userOperationInitCodeDeploySmartAccount()
  await userOperationInitCodeERC20MintDeploySmartAccount()
}

main()

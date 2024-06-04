import "dotenv/config"

import { JsonRpcProvider, parseEther, parseUnits, randomBytes, Wallet } from "ethers"
import type { Address } from "@alchemy/aa-core"
import secp256k1 from "secp256k1"
import type { Hex } from "viem"
import { http } from "viem"
import { createSmartAccountClient, deepHexlify, getEntryPoint } from "@alchemy/aa-core"
import { polygon } from "viem/chains"

import { createSchnorrSigner, getAllCombinedAddrFromKeys } from "../../../src/helpers/schnorr-helpers"
import { createMultiSigSmartAccount } from "../../../src/accountAbstraction"
import { saltToHex } from "../../../src/helpers/create2"
import { MultiSigUserOp } from "../../../src/userOperation"

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

async function main() {
  /**
   * Wallet to cover initial transaction costs/prefund smart account
   */
  const provider = new JsonRpcProvider(process.env.ALCHEMY_RPC_URL)
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider)

  /**
   * Requirements
   * Eth/Matic: 0.06
   */

  const walletBalance = await provider.getBalance(wallet.address)
  if (walletBalance < parseEther("0.06")) throw new Error("Not enough native assets")

  const privKey1 = process.env.PRIVATE_KEY as Address
  const schnorrSigner1 = createSchnorrSigner(privKey1)

  const publicKey1 = schnorrSigner1.getPubKey()

  let privKey2
  do privKey2 = randomBytes(32)
  while (!secp256k1.privateKeyVerify(privKey2))
  const schnorrSigner2 = createSchnorrSigner(privKey2)

  const publicKey2 = schnorrSigner2.getPubKey()

  let privKey3
  do privKey3 = randomBytes(32)
  while (!secp256k1.privateKeyVerify(privKey3))
  const schnorrSigner3 = createSchnorrSigner(privKey3)

  const publicKey3 = schnorrSigner3.getPubKey()

  const salt = "this is salt shared by participants"

  const publicKeys = [publicKey1, publicKey2, publicKey3]

  const combinedAddresses = getAllCombinedAddrFromKeys(publicKeys, 3)

  const rpcUrl = process.env.ALCHEMY_RPC_URL
  const transport = http(rpcUrl)
  const multiSigSmartAccount = await createMultiSigSmartAccount({
    transport,
    chain: CHAIN,
    combinedAddress: combinedAddresses,
    salt: saltToHex(salt),
    entryPoint: getEntryPoint(CHAIN),
  })

  /**
   * Prefund smart account
   */
  const initTransactionCost = parseUnits("0.06", 18)
  const addBalanceToSmartAccountTransaction = await wallet.sendTransaction({ to: multiSigSmartAccount.address, value: initTransactionCost })
  await addBalanceToSmartAccountTransaction.wait()

  const smartAccountClient = createSmartAccountClient({
    transport,
    chain: CHAIN,
    account: multiSigSmartAccount,

    opts: CLIENT_OPT,
  })

  /**
   * Build User Operation with ETH/Matic value
   */
  const signerAddress1 = schnorrSigner1.getAddress() as Hex
  const uoStruct = await smartAccountClient.buildUserOperation({
    account: multiSigSmartAccount,
    uo: {
      data: "0x",
      target: signerAddress1,
      value: parseUnits("0.01", 18),
    },
  })
  const uoStructHash = multiSigSmartAccount.getEntryPoint().getUserOperationHash(deepHexlify(uoStruct))

  const publicNonces1 = schnorrSigner1.generatePubNonces()
  const publicNonces2 = schnorrSigner2.generatePubNonces()
  const publicNonces3 = schnorrSigner3.generatePubNonces()
  const multiSigUserOp = new MultiSigUserOp(
    [publicKey1, publicKey2, publicKey3],
    [publicNonces1, publicNonces2, publicNonces3],
    uoStructHash,
    uoStruct
  )

  multiSigUserOp.signMultiSigHash(schnorrSigner1)
  multiSigUserOp.signMultiSigHash(schnorrSigner2)
  multiSigUserOp.signMultiSigHash(schnorrSigner3)

  const summedSignature = multiSigUserOp.getSummedSigData()

  const uoHash = await smartAccountClient.sendRawUserOperation(
    {
      ...deepHexlify(uoStruct),
      signature: summedSignature,
    },
    multiSigSmartAccount.getEntryPoint().address
  )

  const txHash = await smartAccountClient.waitForUserOperationTransaction({ hash: uoHash })

  console.log("tx", txHash)
}

main()

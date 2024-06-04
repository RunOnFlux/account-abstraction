import "dotenv/config"

import type { Address } from "@alchemy/aa-core"
import { createSmartAccountClient, deepHexlify, getEntryPoint } from "@alchemy/aa-core"
import { http, parseUnits } from "viem"
import { randomBytes, JsonRpcProvider, Wallet } from "ethers"
import secp256k1 from "secp256k1"
import { polygon } from "viem/chains"

import { createMultiSigSmartAccount } from "../../src/accountAbstraction"
import { createSchnorrSigner, getAllCombinedAddrFromKeys } from "../../src/helpers/schnorr-helpers"
import { saltToHex } from "../../src/helpers/create2"
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
async function main() {
  /**
   * Wallet to cover initial transaction costs/prefund smart account
   */
  const provider = new JsonRpcProvider(process.env.ALCHEMY_RPC_URL)
  const wallet = new Wallet(process.env.PRIVATE_KEY, provider)

  /**
   * Precondition:
   * 3 Participants sharing they Public Key's
   */

  /**
   * Multi Sig participant #1
   */
  const privKey1 = process.env.PRIVATE_KEY as Address
  const schnorrSigner1 = createSchnorrSigner(privKey1)

  const publicKey1 = schnorrSigner1.getPubKey()

  /**
   * Multi Sig participant #2
   */

  let privKey2
  do privKey2 = randomBytes(32)
  while (!secp256k1.privateKeyVerify(privKey2))
  const schnorrSigner2 = createSchnorrSigner(privKey2)

  const publicKey2 = schnorrSigner2.getPubKey()

  /**
   * Multi Sig participant #3
   */
  let privKey3
  do privKey3 = randomBytes(32)
  while (!secp256k1.privateKeyVerify(privKey3))
  const schnorrSigner3 = createSchnorrSigner(privKey3)

  const publicKey3 = schnorrSigner3.getPubKey()

  /**
   * Participants select SALT for the Smart Account
   * (Same 3 Participants can have multiple smart account's where id of those account is SALT)
   */

  const salt = "this is salt shared by participants 3"

  /**
   * Step 1
   * User initiate User Operation with his private key
   * User share User Operation with rest of owner's
   * Produce Public Nonces of his instance of Schnorr signer
   */
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
  const initTransactionCost = parseUnits("0.05", 18)
  const addBalanceToSmartAccountTransaction = await wallet.sendTransaction({ to: multiSigSmartAccount.address, value: initTransactionCost })
  await addBalanceToSmartAccountTransaction.wait()

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

  /**
   * Step 2
   * Second MultiSig owner get User Operation
   * Produce Public Nonces and Public Key of his instance of Schnorr signer
   */

  const publicNonces2 = schnorrSigner2.generatePubNonces()

  /**
   * Step 3
   * Third MultiSig owner get User Operation
   * Produce Public Nonces and Public Key of his instance of Schnorr signer
   */
  const publicNonces3 = schnorrSigner3.generatePubNonces()

  /**
   * Step 4
   * Owners share their Public Nonces an Public Keys between each other to sign User Operation
   */
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

import "dotenv/config"

import type { Address } from "@alchemy/aa-core"
import { createSmartAccountClient, deepHexlify, getEntryPoint, sepolia } from "@alchemy/aa-core"
import type { Hex } from "viem"
import { encodeFunctionData, http, parseUnits } from "viem"
import { randomBytes } from "ethers"
import secp256k1 from "secp256k1"

import ERC20MintableAbi from "../abi/ERC20Mintable.json"
import { createMultiSigSmartAccount } from "../../src/accountAbstraction"
import { createSchnorrSigner, getAllCombinedAddrFromKeys } from "../../src/helpers/schnorr-helpers"
import { saltToHex } from "../../src/helpers/create2"
import { MultiSigUserOp } from "../../src/userOperation"

async function main() {
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
    chain: sepolia,
    combinedAddress: combinedAddresses,
    salt: saltToHex(salt),
    entryPoint: getEntryPoint(sepolia),
  })

  const smartAccountClient = createSmartAccountClient({
    transport,
    chain: sepolia,
    account: multiSigSmartAccount,

    opts: {
      txMaxRetries: 5,
      txRetryMultiplier: 3,
    },
  })

  const amount = parseUnits("10", 18)

  const uoCallData: Hex = encodeFunctionData({
    abi: ERC20MintableAbi,
    functionName: "mintTo",
    args: [multiSigSmartAccount.address, amount],
  })

  const uoStruct = await smartAccountClient.buildUserOperation({
    account: multiSigSmartAccount,
    uo: {
      data: uoCallData,
      target: "0xdA9A5ACCAF66bf4Db0E839Dd0d49330F88f25044",
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

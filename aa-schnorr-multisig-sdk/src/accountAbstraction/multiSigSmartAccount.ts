import type {
  UpgradeToAndCallParams,
  Address,
  EntryPointParameter,
  SmartContractAccount,
  ToSmartContractAccountParams,
} from "@alchemy/aa-core"
import {
  createBundlerClient,
  FailedToGetStorageSlotError,
  getAccountAddress,
  getEntryPoint,
  toSmartContractAccount,
} from "@alchemy/aa-core"
import type { Chain, Hex, Transport } from "viem"
import { concatHex, encodeFunctionData } from "viem"
import { ethers } from "ethers"

import { deployments } from "../generated/deployments"
import { MultiSigSmartAccount_abi } from "../generated/abi"
import { MultiSigSmartAccountFactory_abi } from "../abi"

export const MULTISIG_ACCOUNT_SOURCE = "MultiSigSmartAccount"

export type MultiSigSmartAccount = SmartContractAccount<typeof MULTISIG_ACCOUNT_SOURCE, "0.6.0">

export type CreateMultiSigSmartAccountParams<TTransport extends Transport = Transport, TEntryPointVersion extends "0.6.0" = "0.6.0"> = Pick<
  ToSmartContractAccountParams<typeof MULTISIG_ACCOUNT_SOURCE, TTransport, Chain, TEntryPointVersion>,
  "transport" | "chain"
> & {
  salt?: Hex
  factoryAddress?: Address
  initCode?: Hex
  combinedAddress?: Address[]
  accountAddress?: Address
} & EntryPointParameter<TEntryPointVersion, Chain>

export async function createMultiSigSmartAccount<TTransport extends Transport = Transport>(
  config: CreateMultiSigSmartAccountParams<TTransport>
): Promise<MultiSigSmartAccount>

export async function createMultiSigSmartAccount({
  transport,
  chain,
  entryPoint = getEntryPoint(chain, { version: "0.6.0" }),
  accountAddress,
  combinedAddress = [],
  salt: _salt,
}: CreateMultiSigSmartAccountParams): Promise<MultiSigSmartAccount> {
  const client = createBundlerClient({
    transport,
    chain,
  })
  const salt = _salt ?? ethers.encodeBytes32String("salt")

  const getAccountInitCode = async () => {
    return concatHex([
      deployments[chain.id]?.MultiSigSmartAccountFactory as Address,
      encodeFunctionData({
        abi: MultiSigSmartAccountFactory_abi,
        functionName: "createAccount",
        args: [combinedAddress, salt],
      }),
    ])
  }

  const address = await getAccountAddress({
    client,
    entryPoint,
    accountAddress,
    getAccountInitCode,
  })

  const encodeUpgradeToAndCall = async ({ upgradeToAddress, upgradeToInitData }: UpgradeToAndCallParams) => {
    const storage = await client.getStorageAt({
      address,
      // the slot at which impl addresses are stored by UUPS
      slot: "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
    })

    if (storage === null)
      throw new FailedToGetStorageSlotError(
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
        "Proxy Implementation Address"
      )

    return encodeFunctionData({
      abi: MultiSigSmartAccount_abi,
      functionName: "upgradeToAndCall",
      args: [upgradeToAddress, upgradeToInitData],
    })
  }

  const account = await toSmartContractAccount({
    transport,
    chain,
    entryPoint,
    accountAddress: address,
    source: "MultiSigSmartAccount",
    getAccountInitCode,
    encodeExecute: async ({ target, data, value }) => {
      return encodeFunctionData({
        abi: MultiSigSmartAccount_abi,
        functionName: "execute",
        args: [target, value ?? 0n, data],
      })
    },
    encodeBatchExecute: async (txs) => {
      const [targets, values, datas] = txs.reduce(
        (accum, curr) => {
          accum[0].push(curr.target)
          accum[1].push(curr.value ?? 0n)
          accum[2].push(curr.data)

          return accum
        },
        [[], [], []] as [Address[], bigint[], Hex[]]
      )
      return encodeFunctionData({
        abi: MultiSigSmartAccount_abi,
        functionName: "executeBatch",
        args: [targets, values, datas],
      })
    },
    signUserOperationHash: async () => {
      throw new Error("Use Schnorr Signer to get user operation hash signature")
    },
    async signMessage() {
      throw new Error("Use Schnorr Signer to sign message")
    },
    async signTypedData() {
      throw new Error("Use Schnorr Signer to sign message")
    },
    getDummySignature: () => {
      return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
    },
    encodeUpgradeToAndCall,
  })

  return {
    ...account,
    source: "MultiSigSmartAccount",
  }
}

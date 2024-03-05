import type { Address } from "abitype"
import type { BatchUserOperationCallData, SmartAccountSigner } from "@alchemy/aa-core"
import { BaseSmartContractAccount, getDefaultEntryPointAddress } from "@alchemy/aa-core"
import type { BytesLike } from "ethers"
import { utils } from "ethers"
import { concatHex, encodeFunctionData, hexToBytes } from "viem"
import type { FallbackTransport, Hex, Transport } from "viem"

import { MultiSigSmartAccountFactory_abi, MultiSigSmartAccount_abi } from "../abi"

import type { MultiSigAccountAbstractionParams } from "./schema"
import { MultiSigSmartAccountParamsSchema } from "./schema"

export class MultiSigAccountAbstraction<TTransport extends Transport | FallbackTransport = Transport> extends BaseSmartContractAccount<
  TTransport,
  SmartAccountSigner
> {
  protected owner: SmartAccountSigner
  protected combinedPubKeys: Address[]
  protected factoryAddress: Address
  protected salt: BytesLike

  constructor(params: MultiSigAccountAbstractionParams<TTransport>) {
    MultiSigSmartAccountParamsSchema<TTransport>().parse(params)

    super(params)
    this.owner = params.owner
    this.combinedPubKeys = params.combinedPubKeys?.map((key) => key as Hex) ?? []
    this.salt = params.salt ?? utils.formatBytes32String("salt")
    this.factoryAddress = (params.factoryAddress ?? "0x") as Hex
    this.entryPointAddress = (params.entryPointAddress ?? getDefaultEntryPointAddress(params.chain)) as Hex
  }

  getDummySignature(): `0x${string}` {
    return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async encodeExecute(target: Hex, value: bigint, data: Hex): Promise<`0x${string}`> {
    return encodeFunctionData({
      abi: MultiSigSmartAccount_abi,
      functionName: "execute",
      args: [target, value, data],
    })
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  override async encodeBatchExecute(_txs: BatchUserOperationCallData): Promise<`0x${string}`> {
    const [targets, datas] = _txs.reduce(
      (accum, curr) => {
        accum[0].push(curr.target)
        accum[1].push(curr.data)

        return accum
      },
      [[], []] as [Address[], Hex[]]
    )

    return encodeFunctionData({
      abi: MultiSigSmartAccount_abi,
      functionName: "executeBatch",
      args: [targets, datas],
    })
  }

  signMessage(msg: Uint8Array | string): Promise<`0x${string}`> {
    let _encodedMsg = msg
    if (typeof msg === "string" && msg.startsWith("0x")) _encodedMsg = hexToBytes(msg as Hex)
    else if (typeof msg === "string") _encodedMsg = new TextEncoder().encode(msg)

    return this.owner.signMessage(_encodedMsg)
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async getAccountInitCode(): Promise<`0x${string}`> {
    return concatHex([
      this.factoryAddress,
      encodeFunctionData({
        abi: MultiSigSmartAccountFactory_abi,
        functionName: "createAccount",
        args: [this.combinedPubKeys, this.salt],
      }),
    ])
  }
}

export function createMultiSigAccountAbstraction(
  params: Pick<MultiSigAccountAbstractionParams<Transport>, "chain" | "accountAddress" | "rpcClient" | "combinedPubKeys" | "salt">
): MultiSigAccountAbstraction {
  return new MultiSigAccountAbstraction(params)
}

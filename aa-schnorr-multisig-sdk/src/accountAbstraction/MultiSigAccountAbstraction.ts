import type { Address } from "abitype"
import { BaseSmartContractAccount, BatchUserOperationCallData, SmartAccountSigner } from "@alchemy/aa-core"
import { BytesLike, utils } from "ethers"
import { concatHex, encodeFunctionData, hexToBytes, type Hex, FallbackTransport, Transport } from "viem"
import { MultiSigAccountAbstractionParams, MultiSigSmartAccountParamsSchema } from "./schema"
import { MultiSigSmartAccountFactory_abi, MultiSigSmartAccount_abi } from "../abi"

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
    this.factoryAddress = params.factoryAddress as Hex
  }

  getDummySignature(): `0x${string}` {
    return "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"
  }

  async encodeExecute(target: Hex, value: bigint, data: Hex): Promise<`0x${string}`> {
    return encodeFunctionData({
      abi: MultiSigSmartAccount_abi,
      functionName: "execute",
      args: [target, value, data],
    })
  }

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
    if (typeof msg === "string" && msg.startsWith("0x")) {
      msg = hexToBytes(msg as Hex)
    } else if (typeof msg === "string") {
      msg = new TextEncoder().encode(msg)
    }

    return this.owner.signMessage(msg)
  }

  protected async getAccountInitCode(): Promise<`0x${string}`> {
    const owner = await this.owner.getAddress()
    return concatHex([
      this.factoryAddress,
      encodeFunctionData({
        abi: MultiSigSmartAccountFactory_abi,
        functionName: "createAccount",
        args: [owner, this.combinedPubKeys, this.salt],
      }),
    ])
  }
}

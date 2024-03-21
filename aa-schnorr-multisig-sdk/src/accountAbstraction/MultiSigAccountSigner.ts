import type { Hex, UserOperationCallData } from "@alchemy/aa-core"
import { deepHexlify, getUserOperationHash } from "@alchemy/aa-core"
import { AccountSigner } from "@alchemy/aa-ethers"

import type { MultiSigUserOpWithSigners, MultiSigUserOp } from "../transaction"

import type { MultiSigAccountAbstraction } from "./MultiSigAccountAbstraction"
import type { GasEstimatorLimits, UserOperationTxData } from "./types"

export class MultiSigAccountSigner extends AccountSigner<MultiSigAccountAbstraction> {
  constructor(accountSigner: AccountSigner<MultiSigAccountAbstraction>) {
    super(accountSigner.provider)
  }
  async sendMultiSigTransaction(tx: MultiSigUserOpWithSigners): Promise<`0x${string}`> {
    const _provider = this.provider.accountProvider
    const _summedSignature = tx.getSummedSigData()
    const _opRequest = tx.userOpRequest
    _opRequest.signature = _summedSignature as Hex
    const txHash = await _provider.rpcClient.sendUserOperation(_opRequest, _provider.getEntryPointAddress())
    const txUserOp = await _provider.waitForUserOperationTransaction(txHash)
    return txUserOp
  }

  async sendMultiSigUserOp(userOp: MultiSigUserOp): Promise<`0x${string}`> {
    const _provider = this.provider.accountProvider
    const _summedSignature = userOp.getSummedSigData()
    const _opRequest = userOp.userOpRequest
    _opRequest.signature = _summedSignature as Hex
    const txHash = await _provider.rpcClient.sendUserOperation(_opRequest, _provider.getEntryPointAddress())
    const txUserOp = await _provider.waitForUserOperationTransaction(txHash)
    return txUserOp
  }

  async buildUserOp(userOp: UserOperationCallData): Promise<UserOperationTxData> {
    const _provider = this.provider.accountProvider
    const uoStruct = await _provider.buildUserOperation(userOp)
    const request = deepHexlify(uoStruct)
    const opHash = getUserOperationHash(request, _provider.getEntryPointAddress(), BigInt(await this.getChainId()))
    return { request, opHash }
  }

  async buildUserOpWithGasEstimator(userOp: UserOperationCallData, gasEstimator: GasEstimatorLimits): Promise<UserOperationTxData> {
    // eslint-disable-next-line @typescript-eslint/require-await
    this.withGasEstimator(async (userOperation) => {
      return {
        ...userOperation,
        callGasLimit: gasEstimator.callGasLimit ?? 2_000_000,
        preVerificationGas: gasEstimator.preVerificationGas ?? 2_000_000,
        verificationGasLimit: gasEstimator.verificationGasLimit ?? 2_000_000,
      }
    })
    const _provider = this.provider.accountProvider
    const uoStruct = await _provider.buildUserOperation(userOp)
    const request = deepHexlify(uoStruct)
    const opHash = getUserOperationHash(request, _provider.getEntryPointAddress(), BigInt(await this.getChainId()))
    return { request, opHash }
  }
}

export function createMultiSigAccountSigner(accountSigner: AccountSigner<MultiSigAccountAbstraction>): MultiSigAccountSigner {
  return new MultiSigAccountSigner(accountSigner)
}

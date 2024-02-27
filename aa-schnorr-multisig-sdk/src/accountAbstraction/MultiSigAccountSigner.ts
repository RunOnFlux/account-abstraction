import { Hex, UserOperationCallData, deepHexlify, getUserOperationHash } from "@alchemy/aa-core"
import { AccountSigner } from "@alchemy/aa-ethers"
import { MultiSigAccountAbstraction } from "./MultiSigAccountAbstraction"
import { GasEstimatorLimits, UserOperationTxData } from "./types"
import { SchnorrMultiSigTx } from "../transaction"

export function createMultiSigAccountSigner(accountSigner: AccountSigner<MultiSigAccountAbstraction>): MultiSigAccountSigner {
  return new MultiSigAccountSigner(accountSigner)
}

export class MultiSigAccountSigner extends AccountSigner<MultiSigAccountAbstraction> {
  constructor(accountSigner: AccountSigner<MultiSigAccountAbstraction>) {
    super(accountSigner.provider)
  }
  async sendMultiSigTransaction(tx: SchnorrMultiSigTx): Promise<`0x${string}`> {
    const _provider = this.provider.accountProvider
    const _summedSignature = tx.getSummedSigData()
    const _opRequest = tx.userOpRequest
    _opRequest.signature = _summedSignature as Hex
    const txHash = await _provider.rpcClient.sendUserOperation(_opRequest, _provider.getEntryPointAddress())
    return await _provider.waitForUserOperationTransaction(txHash)
  }

  async buildUserOp(userOp: UserOperationCallData): Promise<UserOperationTxData> {
    const _provider = this.provider.accountProvider
    const uoStruct = await _provider.buildUserOperation(userOp)
    const request = deepHexlify(uoStruct)
    const opHash = getUserOperationHash(request, _provider.getEntryPointAddress(), BigInt(await this.getChainId()))
    return { request, opHash }
  }

  async buildUserOpWithGasEstimator(userOp: UserOperationCallData, gasEstimator: GasEstimatorLimits): Promise<UserOperationTxData> {
    this.withGasEstimator(async (userOperation) => {
      return Promise.resolve({
        ...userOperation,
        callGasLimit: gasEstimator.callGasLimit ?? 2000000,
        preVerificationGas: gasEstimator.preVerificationGas ?? 2000000,
        verificationGasLimit: gasEstimator.verificationGasLimit ?? 2000000,
      })
    })
    const _provider = this.provider.accountProvider
    const uoStruct = await _provider.buildUserOperation(userOp)
    const request = deepHexlify(uoStruct)
    const opHash = getUserOperationHash(request, _provider.getEntryPointAddress(), BigInt(await this.getChainId()))
    return { request, opHash }
  }
}

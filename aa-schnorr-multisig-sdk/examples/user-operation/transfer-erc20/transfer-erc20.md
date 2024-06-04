## ERC20 transfer with User Operation 

> [!NOTE]
> Current demo extends demo [Sign 3 of 3](../../sign_3_of_3/sign-3_of_3.md). Please refer to docs.

#### Requirements
Account `Private Key`:
```typescript
PRIVATE_KEY="0x"
```
Also there some config options to adjust script execution:
```typescript
// Replace Chain to execute User Operation on different chain
const CHAIN = polygon
// Provide ERC20 address appropriate to previously setted chain
const ERC20_ADDRESS = "0x" as Address

// Adjust those options to guarante User Operation successfull execution
const CLIENT_OPT = {
    feeOptions: {
        maxPriorityFeePerGas: { multiplier: 1.5 },
        maxFeePerGas: { multiplier: 1.5 },
        preVerificationGas: { multiplier: 1.5 },
    },

    txMaxRetries: 5,
    txRetryMultiplier: 3,
}
```
Provided account with `Private Key` should satisfy next requirements:
```
Balance > 0.07 (Matic/ETH)
ERC20 Balance > 0.01
```
#### Prefund Smart Account
To execute User Operation with Smart Account we need to prefund account:
```typescript
const initTransactionCost = parseUnits("0.05", 18)
const addBalanceToSmartAccountTransaction = await wallet.sendTransaction({ to: multiSigSmartAccount.address, value: initTransactionCost })
await addBalanceToSmartAccountTransaction.wait()

const addERC20BalanceToSmartAccountTransaction = await erc20.transfer(multiSigSmartAccount.address, erc20Amount)
await addERC20BalanceToSmartAccountTransaction.wait()
```
That will guarantee successfully execution of User Operation.

#### Encode User Operation `calldata`
To encode transaction data ethers or viem can be used:  
  
***ethers(v6)***
```typescript
const uoCallData = erc20.interface.encodeFunctionData("transfer", [wallet.address, erc20Amount]) as Hex
```
***viem***
```typescript
import { encodeFunctionData, http, parseUnits } from "viem"

const uoCallData: Hex = encodeFunctionData({
    abi: ERC20Abi,
    functionName: "mintTo",
    args: [multiSigSmartAccount.address, amount],
})
```

#### Build User Operation
Encoded function data now can be used in User Operation:
```typescript
const uoStruct = await smartAccountClient.buildUserOperation({
    account: multiSigSmartAccount,
    uo: {
      data: uoCallData,
      target: ERC20_ADDRESS,
    },
})
```
  
For next step's refer to [sign-3_of_3](../../sign_3_of_3/sign-3_of_3.md)

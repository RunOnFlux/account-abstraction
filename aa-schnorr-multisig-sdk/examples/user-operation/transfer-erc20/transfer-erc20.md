## ERC20 Transfer with User Operation

> [!NOTE]
> This demo extends the demo [Sign 3 of 3](../../sign_3_of_3/sign-3_of_3.md). Please refer to the documentation for more details.

### Requirements

#### Account `Private Key`
```typescript
PRIVATE_KEY = "0x";
```

#### Configuration Options
Adjust the following configuration options to ensure successful script execution:

```typescript
// Replace with the desired chain to execute the User Operation
const CHAIN = polygon;

// Provide the ERC20 address appropriate for the previously set chain
const ERC20_ADDRESS = "0x" as Address;

// Adjust these options to guarantee successful execution of the User Operation
const CLIENT_OPT = {
    feeOptions: {
        maxPriorityFeePerGas: { multiplier: 1.5 },
        maxFeePerGas: { multiplier: 1.5 },
        preVerificationGas: { multiplier: 1.5 },
    },
    txMaxRetries: 5,
    txRetryMultiplier: 3,
};
```

#### Account Requirements
The account with the `Private Key` should meet the following requirements:
- Balance > 0.07 (Matic/ETH)
- ERC20 Balance > 0.01

### Prefund Smart Account
To execute a User Operation with a Smart Account, you need to prefund the account:

```typescript
const initTransactionCost = parseUnits("0.05", 18);
const addBalanceToSmartAccountTransaction = await wallet.sendTransaction({
    to: multiSigSmartAccount.address,
    value: initTransactionCost,
});
await addBalanceToSmartAccountTransaction.wait();

const addERC20BalanceToSmartAccountTransaction = await erc20.transfer(multiSigSmartAccount.address, erc20Amount);
await addERC20BalanceToSmartAccountTransaction.wait();
```

This will guarantee the successful execution of the User Operation.

### Encode User Operation `calldata`
To encode transaction data, you can use either ethers or viem:

#### Using ethers (v6)
```typescript
const uoCallData = erc20.interface.encodeFunctionData("transfer", [wallet.address, erc20Amount]) as Hex;
```

#### Using viem
```typescript
import { encodeFunctionData, http, parseUnits } from "viem";

const uoCallData: Hex = encodeFunctionData({
    abi: ERC20Abi,
    functionName: "mintTo",
    args: [multiSigSmartAccount.address, amount],
});
```

### Build User Operation
The encoded function data can now be used in a User Operation:

```typescript
const uoStruct = await smartAccountClient.buildUserOperation({
    account: multiSigSmartAccount,
    uo: {
        data: uoCallData,
        target: ERC20_ADDRESS,
    },
});
```

For the next steps, refer to [sign-3_of_3](../../sign_3_of_3/sign-3_of_3.md).
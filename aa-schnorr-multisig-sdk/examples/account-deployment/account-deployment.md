## Deploy Smart Account
MultiSigSmartAccount is Account Abstraction in terms of [ERC 4337](https://github.com/ethereum/ercs/blob/master/ERCS/erc-4337.md).
We use [Alchemy Account Kit](https://accountkit.alchemy.com/) SDK to execute User Operation's.  
There are multiple scenarios of deploying Smart Account. Next we go through them:

### Deploy through factory `createAccount` method call
This scenario is implemented in [factory-create-account-method-call-deployment.ts](./factory-create-account-method-call-deployment.ts)

```typescript
const wallet = new Wallet(process.env.PRIVATE_KEY, provider)

const multiSigSmartAccountFactory = MultiSigSmartAccountFactory__factory.connect(factoryAddress, wallet)

const createAccountTransactionResponse = await multiSigSmartAccountFactory.createAccount(combinedAddresses, saltToHex(salt))

await createAccountTransactionResponse.wait()
```
In this scenario user deploy smart account with EOA and also cover deployment transaction costs by EOA.

## Deploy with empty UserOperation though `initCode` execution
This scenario is implemented in [user-operation-init-code-deployment.ts/userOperationInitCodeDeploySmartAccount](./user-operation-init-code-deployment.ts)

When we are creating Smart Account instance with Alchemy Account Kit and Smart Account do not deployed yet, additional `initCode` will be added to UserOperation, which triggers Smart Account deployment.

> [!NOTE]
> This scenario requires Smart Account to be prefunded before sending UserOperation
> In our script we assume you provide `PRIVATE_KEY` with balance to send to Smart Account.
> ```typescript
> const initTransactionCost = parseUnits("0.05", 18)
> const addBalanceToSmartAccountTransaction = await wallet.sendTransaction({ to: smartAccountAdddress, value: initTransactionCost })
> await addBalanceToSmartAccountTransaction.wait()
>```

```typescript
const multiSigSmartAccount = await createMultiSigSmartAccount({
    transport,
    chain: sepolia,
    combinedAddress: combinedAddresses,
    salt: saltToHex(salt),
    entryPoint: getEntryPoint(sepolia),
})

const uoStruct = await smartAccountClient.buildUserOperation({
    account: multiSigSmartAccount,
    uo: "0x",
})
```
After execution of *empty* UserOperation Smart Account will be deployed


## Deploy with UserOperation though `initCode` execution
This scenario is implemented in [user-operation-init-code-deployment.ts/userOperationInitCodeERC20MintDeploySmartAccount](./user-operation-init-code-deployment.ts)
Similarly to *empty* user operation we will trigger `initCode` this time with `mint()` method call on ERC20 contract.

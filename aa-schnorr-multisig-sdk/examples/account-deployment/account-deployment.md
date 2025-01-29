# Deploy Smart Account

The **MultiSigSmartAccount** is an Account Abstraction in terms of [ERC 4337](https://github.com/ethereum/ercs/blob/master/ERCS/erc-4337.md). We utilize the [Alchemy Account Kit](https://accountkit.alchemy.com/) SDK to execute User Operations. There are multiple scenarios for deploying a Smart Account, which we will explore below:

## 1. Deploy through Factory `createAccount` Method Call

This scenario is implemented in [factory-create-account-method-call-deployment.ts](./factory-create-account-method-call-deployment.ts).

```typescript
const wallet = new Wallet(process.env.PRIVATE_KEY, provider);
const multiSigSmartAccountFactory = MultiSigSmartAccountFactory__factory.connect(factoryAddress, wallet);

const createAccountTransactionResponse = await multiSigSmartAccountFactory.createAccount(combinedAddresses, saltToHex(salt));
await createAccountTransactionResponse.wait();
```

In this scenario, the user deploys the Smart Account with an Externally Owned Account (EOA) and covers the deployment transaction costs using the EOA.

## 2. Deploy with Empty UserOperation through `initCode` Execution

This scenario is implemented in [user-operation-init-code-deployment.ts/userOperationInitCodeDeploySmartAccount](./user-operation-init-code-deployment.ts).

When creating a Smart Account instance with the Alchemy Account Kit, if the Smart Account is not yet deployed, additional `initCode` will be added to the UserOperation, triggering the Smart Account deployment.

> **Note:** This scenario requires the Smart Account to be prefunded before sending the UserOperation. In our script, we assume you provide a `PRIVATE_KEY` with a balance to send to the Smart Account.

```typescript
const initTransactionCost = parseUnits("0.05", 18);
const addBalanceToSmartAccountTransaction = await wallet.sendTransaction({ to: smartAccountAdddress, value: initTransactionCost });
await addBalanceToSmartAccountTransaction.wait();
```

```typescript
const multiSigSmartAccount = await createMultiSigSmartAccount({
    transport,
    chain: sepolia,
    combinedAddress: combinedAddresses,
    salt: saltToHex(salt),
    entryPoint: getEntryPoint(sepolia),
});

const uoStruct = await smartAccountClient.buildUserOperation({
    account: multiSigSmartAccount,
    uo: "0x",
});
```

After executing the *empty* UserOperation, the Smart Account will be deployed.

## 3. Deploy with UserOperation through `initCode` Execution

This scenario is implemented in [user-operation-init-code-deployment.ts/userOperationInitCodeERC20MintDeploySmartAccount](./user-operation-init-code-deployment.ts).

Similar to the *empty* UserOperation, we will trigger `initCode` this time with a `mint()` method call on the ERC20 contract.

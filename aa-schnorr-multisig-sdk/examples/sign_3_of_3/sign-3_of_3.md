## Sending Transaction with Multi-signature Smart Account `M of N`

> [!NOTE]
> This demo covers the `3 of 3` case.

### Multi-signature Smart Account
To obtain a `Multi-signature Smart Account` address, you will need the following:
* Schnorr Signer `Public Keys` from all parties
* A common `SALT`

The process of obtaining these inputs and their significance will be explained in subsequent sections.

### Schnorr Signer
#### Create Schnorr Signer and Share Public Key
Each party needs to generate a `Public Key` and share it with the other parties.
```typescript
const schnorrSigner = createSchnorrSigner(PRIVATE_KEY);
const publicKey = schnorrSigner.getPubKey();
```

After this phase, each party should have all participating parties' `Public Keys`, e.g., `[0x..1, 0x..2, 0x..3]`.

#### Schnorr Combined Addresses

#### Smart Account Client
To create a `MultiSigSmartAccount`, generate `combinedAddresses` based on the Public Keys:
```typescript
const combinedAddresses = getAllCombinedAddrFromKeys(publicKeys, 3);
```
> [!NOTE]
> In the `3 of 3` case, a single combined address will be generated.

With `combinedAddresses` and `salt`, you are ready to create a smart account client, which will be used for building a `UserOperation`.  
The [Alchemy AA SDK](https://accountkit.alchemy.com/getting-started/overview.html) is used to create the ***smart account client***.
```typescript
const rpcUrl = "https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}";
const transport = http(rpcUrl);
const multiSigSmartAccount = await createMultiSigSmartAccount({
    transport,
    chain: sepolia,
    combinedAddress: combinedAddresses,
    salt: saltToHex(salt),
    entryPoint: getEntryPoint(sepolia),
});
const smartAccountClient = createSmartAccountClient({
    transport,
    chain: sepolia,
    account: multiSigSmartAccount,
});
```

Refer to the Alchemy documentation for [buildUserOperation](https://accountkit.alchemy.com/packages/aa-core/smart-account-client/actions/buildUserOperation.html), [sendRawUserOperation](https://accountkit.alchemy.com/packages/aa-core/bundler-client/actions/sendRawUserOperation.html), and [waitForUserOperationTransaction](https://accountkit.alchemy.com/packages/aa-core/smart-account-client/actions/waitForUserOperationTransaction.html).

### Prepare User Operation Calldata
User Operation calldata is encoded function data with arguments. In this example, we use viem's [encodeFunctionData(viem)](https://accountkit.alchemy.com/using-smart-accounts/send-user-operations.html#_2-construct-the-call-data). The same result can be achieved with Ethers [encodeFunctionData(ethers v6)](https://docs.ethers.org/v5/api/utils/abi/interface/#Interface--encoding).  
In this demo, we aim to mint 10 ERC20 tokens to the smart account address.
```typescript
const amount = parseUnits("10", 18);
const uoCallData: Hex = encodeFunctionData({
    abi: ERC20MintableAbi,
    functionName: "mintTo",
    args: [multiSigSmartAccount.address, amount],
});
```

### Build and Get Hash of User Operation Struct
To obtain a User Operation with preinitialized fields, use [buildUserOperation](https://accountkit.alchemy.com/packages/aa-core/smart-account-client/actions/buildUserOperation.html). Under the hood, it calls [estimateUserOperationGas](https://accountkit.alchemy.com/packages/aa-core/bundler-client/actions/estimateUserOperationGas.html).  
`uoStruct` and `uoStructHash` will be shared among parties for signing before sending the User Operation.
```typescript
const uoStruct = await smartAccountClient.buildUserOperation({
    account: multiSigSmartAccount,
    uo: {
        data: uoCallData,
        target: targetAddress,
    },
});
const uoStructHash = multiSigSmartAccount.getEntryPoint().getUserOperationHash(deepHexlify(uoStruct));
```

### Share Public Nonces Between Parties
Each party needs to generate Public Nonces and share them with the other parties.
```typescript
const publicNonces1 = schnorrSigner1.generatePubNonces();
// ...
const publicNoncesN = schnorrSignerN.generatePubNonces();
```

### Create MultiSig User Operation
Once all parties have the necessary information about the intended User Operation and the other parties, you are ready to create a `MultiSigUserOp`.
```typescript
const multiSigUserOp = new MultiSigUserOp(
    [publicKey1, publicKey2, publicKey3],
    [publicNonces1, publicNonces2, publicNonces3],
    uoStructHash,
    uoStruct
);
```

### MultiSigUserOperation Signing by Schnorr Signer
All parties need to sign the previously prepared `MultiSigUserOp`.
```typescript
multiSigUserOp.signMultiSigHash(schnorrSigner1);
multiSigUserOp.signMultiSigHash(schnorrSigner2);
// ...
multiSigUserOp.signMultiSigHash(schnorrSignerN);
```

### Send UserOperation
Once the `MultiSigUserOp` is signed by all parties, it is ready to be sent.
```typescript
const summedSignature = multiSigUserOp.getSummedSigData();

// Set SummedSignature as UserOperation signature
const uoHash = await smartAccountClient.sendRawUserOperation(
    {
        ...deepHexlify(uoStruct),
        signature: summedSignature,
    },
    multiSigSmartAccount.getEntryPoint().address
);
```

### Check Transaction
To check the transaction on the blockchain, wait until the bundler commits the batched UserOperation transaction.
```typescript
const txHash = await smartAccountClient.waitForUserOperationTransaction({ hash: uoHash });
```
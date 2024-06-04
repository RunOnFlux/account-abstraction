## Sending transaction with Multi-signature Smart Account  `M of N`

> [!NOTE]
> Current demo cover case `3 of 3`


### Multi-signature Smart Account
To get `Multi-signature Smart Account` address we will need arguments:
* All parties Schnorr Signer `Public Key's`
* Common `SALT`

How to get those input's and their meaning will be explained in next subsection's.

### Schnorr Signer
Schnorr Signer 
#### Create Schnorr Signer and share Public Key
Every party need to get `Public Key` and share that key with rest parties.
```typescript
const schnorrSigner = createSchnorrSigner(PRIVATE_KEY)

const publicKey = schnorrSigner.getPubKey()
```

After that phase each party should have all participating parties `Public Key's` like `[0x..1, 0x..2, 0x..3]`.


#### Schnorr combined addresses

#### Smart Account Client

To create `MultiSigSmartAccount` we will need to generate `combinedAddresses` based on Public Keys:

```
  const combinedAddresses = getAllCombinedAddrFromKeys(publicKeys, 3)
```
> [!NOTE]
> In case of `3 of 3`, we will get single combined address

So based on `combinedAddresses` and `salt` we ready to create smart account client, which is going to be used for building `UserOperation`.  
[Alchemy AA SDK](https://accountkit.alchemy.com/getting-started/overview.html) is used to create ***smart account client***
```  
const rpcUrl = "https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
const transport = http(rpcUrl)
const multiSigSmartAccount = await createMultiSigSmartAccount({
    transport,
    chain: sepolia,
    combinedAddress: combinedAddresses,
    salt: saltToHex(salt),
    entryPoint: getEntryPoint(sepolia),
})
const smartAccountClient = createSmartAccountClient({
    transport,
    chain: sepolia,
    account: multiSigSmartAccount,
})
```

Take a look onto Alchemy docs [buildUserOperation](https://accountkit.alchemy.com/packages/aa-core/smart-account-client/actions/buildUserOperation.html), [sendRawUserOperation](https://accountkit.alchemy.com/packages/aa-core/bundler-client/actions/sendRawUserOperation.html), [waitForUserOperationTransaction](https://accountkit.alchemy.com/packages/aa-core/smart-account-client/actions/waitForUserOperationTransaction.html).


### Prepare User Operation  calldata
User Operation  calldata is encoded function data with arguments, in current example we use viem [encodeFunctionData(viem)](https://accountkit.alchemy.com/using-smart-accounts/send-user-operations.html#_2-construct-the-call-data) same result we can get with Ethers [encodeFunctionData(ethers v6)](https://docs.ethers.org/v5/api/utils/abi/interface/#Interface--encoding)  
In current demo we want to mint 10 ERC20 token's to smart account address
```typescript
const amount = parseUnits("10", 18)

const uoCallData: Hex = encodeFunctionData({
    abi: ERC20MintableAbi,
    functionName: "mintTo",
    args: [multiSigSmartAccount.address, amount],
})
```

### Build and get hash of User Operation Struct
In order to get User Operation with preinitialized field, we use [buildUserOperation](https://accountkit.alchemy.com/packages/aa-core/smart-account-client/actions/buildUserOperation.html), under the hood it's call [estimateUserOperationGas](https://accountkit.alchemy.com/packages/aa-core/bundler-client/actions/estimateUserOperationGas.html).  
`uoStruct` and `uoStructHash` will be shared between parties to sign before sending User Operation.
```typescript
const uoStruct = await smartAccountClient.buildUserOperation({
    account: multiSigSmartAccount,
    uo: {
        data: uoCallData,
        target: targetAddress,
    },
})
const uoStructHash = multiSigSmartAccount.getEntryPoint().getUserOperationHash(deepHexlify(uoStruct))
```

### Share Public Nonces between parties
Each party need to generate Public Nonces and share between rest parties.
```typescript
const publicNonces1 = schnorrSigner1.generatePubNonces()
...
const publicNoncesN = schnorrSignerN.generatePubNonces()
```

### Create MultiSig User Operation
After all parties have required informations about intended User Operation and rest of parties we ready to breate `MultiSigUserOp`
```typescript
const multiSigUserOp = new MultiSigUserOp(
    [publicKey1, publicKey2, publicKey3],
    [publicNonces1, publicNonces2, publicNonces3],
    uoStructHash,
    uoStruct
)
```

### MultiSigUserOperation signing by Schnorr Signer 
All parties need to sign previously prepared `MultiSigUserOp`
```typescript
multiSigUserOp.signMultiSigHash(schnorrSigner1)
multiSigUserOp.signMultiSigHash(schnorrSigner2)
...
multiSigUserOp.signMultiSigHash(schnorrSignerN)
```


### Send UserOperation
When `MultiSigUserOp` is signed by all parties we ready to send it.  
```typescript
const summedSignature = multiSigUserOp.getSummedSigData()

// Set SummedSignature as UserOperation signature
const uoHash = await smartAccountClient.sendRawUserOperation(
    {
        ...deepHexlify(uoStruct),
        signature: summedSignature,
    },
    multiSigSmartAccount.getEntryPoint().address
)
```

### Check Transaction
To check transaction on blockchain scan, wait until bundler commit batched UserOperation transaction.
```typescript
const txHash = await smartAccountClient.waitForUserOperationTransaction({ hash: uoHash })
```

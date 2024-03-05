# Account Abstraction Schnorr Signatures
A typescript library for creating ERC-4337 Account Abstraction which utilizes Schnorr Signatures for multi signatures.


## About
* ERC-4337 Account Abstraction
  * `MultiSigAccountAbstraction` class extends [Alchemys's](https://github.com/alchemyplatform/aa-sdk/tree/main/packages/core) `BaseSmartContractAccount`. It allows to interact with Smart Contract Account.
  * `MultiSigAccountSigner` class extends [Alchemys's](https://github.com/alchemyplatform/aa-sdk/tree/main/packages/ethers) `AccountSigner` and is designed to build and send multi-sig user operations.
* Schnorr Signatures
  * `Schnorkell` is the key element of the package. It manages signature's nonces and has methods for signing messeges, like: `sign()` and `multiSigSign()`.
  * `SchnorrSigner` extends `Schnorkell` and manages key pairs (private and public) to generate Schnorr Signatures.
  * `SchnorrMultiSigTx` class has te be used to create single multi-signature transaction. Signers, User Operation Hash and User Operation Request data have to be known upfront to initialize transaction signing process.

## Requirements:

* Node: >=18.0.0, <20.0.0
* npm (Node.js package manager): v9.x.x

## Installation

```
git clone https://github.com/RunOnFlux/aa-schnorr-multisig-sdk.git
cd aa-schnorr-multisig-sdk
npm i
```


## Important notice

***Before signing any multi-sig transaction signers have to exchange their `publicKey` and `publicNonces`. Nonces are one-time generated random numbers used to create and validate the signature. It's absolutely crucial to delete the nonces once a signature has been crafted with them. Nonce reuse will lead to private key leakage!***

## Example usage
### 0. Deploy MultiSigSmartAccountFactory and create Account Abstraction
`MultiSigSmartAccountFactory` should be deployed first from [aa-schnorr-multisig package](https://www.npmjs.com/package/aa-schnorr-multisig). If already deployed, address can be found in `deployments` folder.
```
const smartAccountFactory = MultiSigSmartAccountFactory__factory.connect(
  <MUSIG_ACCOUNT_FACTORY_ADDRESS>,
  signer
)
```
`accountAddress` is Account Abstraction Address deployed with `MultiSigSmartAccountFactory` contract's method `createAccount`. 
`combinedPubAddress` can be generated with `getAllCombinedPubAddressXofY()` function from schnorr-helpers.

```
const x = 2 // nr of signers needed for valid signature, here 2/3
combinedPubAddress: string[] = getAllCombinedPubAddressXofY([signer1, signer2, signer3], x)

const saltBytes = stringToBytes(<SALT_STRING>, { size: 32 })

const _createTx = await smartAccountFactory.createAccount(combinedPubAddress, saltBytes)
```

If `MultiSigSmartAccountFactory` was deployed then deterministic Account address can be predict with `predictAccountAddress`
```
const predictedAddress = await predictAccountAddress(smartAccountFactory, signer, combinedPubAddress, salt)
```

### 1. Create Schnorr Signers out of private keys
**Warning! Never disclose your private key!**
```
const signer1 = createSchnorrSigner(hexToBytes(<PRIVATE_KEY_1>))
const signer2 = createSchnorrSigner(hexToBytes(<PRIVATE_KEY_2>))
```

### 2. Create Account Signer
- Create Provider. It can be e.g. AlchemyProvider.
```
const alchemy = new Alchemy({
  apiKey: <ALCHEMY_API_KEY>,
  network: <network>,
})
const alchemyProvider = await alchemy.config.getProvider()
```
- Connect the Provider to the MultiSig Account Abstraction
```
const accountProvider = EthersProviderAdapter.fromEthersProvider(alchemyProvider)

const accountSigner = accountProvider.connectToAccount((rpcClient) => {
  const smartAccount = new MultiSigAccountAbstraction({
    chain: <CHAIN>,
    accountAddress: <SMART_ACCOUNT_ADDRESS>,
    factoryAddress: <MUSIG_ACCOUNT_FACTORY_ADDRESS>,
    rpcClient,
    combinedPubAddress: combinedPubAddress[],
    salt: utils.formatBytes32String(<SALT_STRING>),
  })

  smartAccount.getDeploymentState().then((result: unknown) => {
    console.log("===> [useAccountSigner] deployment state", result)
  })
  smartAccount.isAccountDeployed().then((deployed: unknown) => {
    console.log("===> [useAccountSigner] deployed", deployed)
  })

  return smartAccount
})
```

* `chain` can be get from Alchemy SDK
```
const chain = getChain(chainId)
```
* `accountAddress` is Account Abstraction Address deployed with `MultiSigSmartAccountFactory` contract method `createAccount`
```
const saltBytes = stringToBytes(<SALT_STRING>, { size: 32 })
const _createTx = await smartAccountFactory.createAccount(combinedPubAddress, saltBytes)
```
* `factoryAddress` is address of `MultiSigSmartAccountFactory`. If already deployed, can be found in `deployments` folder of `aa-schnorr-multisig` package
* `combinedPubAddress` can be generated with `getAllCombinedPubAddressXofY()` function from schnorr-helpers. **Signers have to be the same as used for signing transactions.**

```
const x = 2 // nr of signers needed for valid signature, here 2/3
combinedPubAddress: string[] = getAllCombinedPubAddressXofY([signer1, signer2, signer3], x)
```
* `salt` is a string used to specify the deterministic address of the Account Abstraction
```
const saltBytes = stringToBytes(<SALT_STRING>, { size: 32 })
```
where [stringToBytes](https://viem.sh/docs/utilities/toBytes#stringtobytes) imported from [viem](https://www.npmjs.com/package/viem) encodes a UTF-8 string into a 32-byte array
* optional parameter `EntryPoint` by default is Alchemy's deterministic address and is the same for every chain. It can be get from Alchemy SDK:
```
// default: "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"
const entryPointAddress = getDefaultEntryPointAddress(chain)
```
### 3. Create MultiSig Account Signer out of Account Signer
Use `multiSigAccountSigner` to extends accountSigner with multi-signature methods.
```
const multiSigAccountSigner = createMultiSigAccountSigner(accountSigner)
```

### 4. Construct User Operation CallData
[User Operation CallData](https://accountkit.alchemy.com/using-smart-accounts/send-user-operations.html#_2-construct-the-call-data) is just wrapped standard transaction calldata.
- [encodeFunctionData](https://viem.sh/docs/contract/encodeFunctionData.html#encodefunctiondata) imported from [viem](https://www.npmjs.com/package/viem) encodes the function name and parameters into an ABI encoded value

- smart contract's ABI, like `ERC20_abi`, can be imported from [aa-schnorr-multisig](https://www.npmjs.com/package/aa-schnorr-multisig) or defined within the function, e.g.
```
const AlchemyTokenAbi = [
  {
    inputs: [{ internalType: "address", name: "recipient", type: "address" }],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
];
```

### CallData construction examples
#### ERC20 Transfer

```
const uoCallData: UserOperationCallData = encodeFunctionData({
        abi: ERC20_abi,
        args: [toAddress, amount],
        functionName: "transfer",
      })
```
#### Transfer ETH
```
const uoCallData: UserOperationCallData = {
  data: "0x",
  target: <toAddress> as Hex,
  value: <amount>,
}
```
#### Upgrade MultiSigSmartAccount contract
```
const newImplementation = <newImplementationAddress> as string
const data = ""
const uoCallData: UserOperationCallData = encodeFunctionData({
  abi: MultiSigSmartAccount_abi,
  args: [newImplementation, ""],
  functionName: "upgradeToAndCall",
})
```
#### Withdraw MultiSigSmartAccount deposit
```
const uoCallData: UserOperationCallData = encodeFunctionData({
  abi: MultiSigSmartAccount_abi,
  args: [toAddress, amount],
  functionName: "withdrawDepositTo",
})
```

### 5. Build User Operation
Use `MultiSigAccountSigner`'s method with gas estimator `buildUserOpWithGasEstimator()`.
```
const { opHash, request } = await multiSigAccountSigner.buildUserOpWithGasEstimator(
  {
    data: uoCallData,
    target: targetAddress as Hex,
  },
  {
    preVerificationGas: 2000000,
  }
)
```
`targetAddress` can be ERC20 Token address (e.g. for token transfer) or MultiSigSmartAccount address for upgrade call.

### 6. Initialize Multi-Sig Schnorr Transaction
Use signers, opHash and request generated above.

Every instance of `SchnorrMultiSigTx` is created once for single transaction (and designed signers combination, like 2/3) and uses **one-time nonces**, so transaction can't be re-signed or reused! 
```
const msTx = new SchnorrMultiSigTx([signer1, signer2], opHash, request)
```

### 7. Sign the transaction with every defined signer
```
msTx.signMultiSigHash(signer)
```

### 8. Send the transaction
To do so use `MultiSigAccountSigner`'s method `sendMultiSigTransaction()`.

In this step signatures signed before by every signer are collected and combined within `SchnorrMultiSigTx` instance. This "summed-signature" is then sent and validate on-chain. If it's ok - transaction can be finished.
```
const txHash = await multiSigAccountSigner.sendMultiSigTransaction(msTx)
```

## Associated package
* [MultiSig Smart Account - ERC-4337 Smart Contracts](https://www.npmjs.com/package/aa-schnorr-multisig)
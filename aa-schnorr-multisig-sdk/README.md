# Account Abstraction Schnorr Signatures
A typescript library for creating ERC-4337 Account Abstraction which utilizes Schnorr Signatures for multi signatures.


## About
* ERC-4337 Account Abstraction
  * `MultiSigAccountAbstraction` class extends [Alchemys's](https://github.com/alchemyplatform/aa-sdk/tree/main/packages/core) `BaseSmartContractAccount`. It allows to interact with the Smart Contract Account.
  * `MultiSigAccountSigner` class extends [Alchemys's](https://github.com/alchemyplatform/aa-sdk/tree/main/packages/ethers) `AccountSigner` and is designed to build and send multi-sig user operations.
* Schnorr Signatures
  * `Schnorkell` is the key element of the package. It manages signature's nonces and has methods for signing messages, like: `sign()` and `multiSigSign()`.
  * `SchnorrSigner` extends `Schnorkell` and manages key pairs (private and public) to generate Schnorr Signatures.
  * `MultiSigUserOpWithSigners` class has to be used to create a single multi-signature transaction. Signers, User Operation Hash and User Operation Request data have to be known upfront to initialize the transaction signing process.

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
`MultiSigSmartAccountFactory` should be deployed first from [aa-schnorr-multisig package](https://www.npmjs.com/package/aa-schnorr-multisig). If already deployed, the address can be found in the `deployments` folder.
```
const smartAccountFactory = MultiSigSmartAccountFactory__factory.connect(
  <MUSIG_ACCOUNT_FACTORY_ADDRESS>,
  signer
)
```
`accountAddress` is Account Abstraction Address deployed with `MultiSigSmartAccountFactory` contract's method `createAccount`.
```
const saltHash = saltToHex(salt)
const createAccountTxHash = await smartAccountFactory.createAccount(combinedAddress, saltHash)
```


**Notice!**  
`combinedAddress` can be generated with `getAllCombinedAddrFromSigners()` function from schnorr-helpers. 

```
const x = 2 // nr of signers needed for valid signature, here 2/3
combinedAddress: string[] = getAllCombinedAddrFromSigners([signer1, signer2, signer3], x)
```
It is also possible to generate with signers' public keys with `getAllCombinedAddrFromKeys()`
```
combinedAddress: string[] = getAllCombinedAddrFromKeys([pubKey1, pubKey2, pubKey3], x)
```

#### Smart Account Address prediction
If `MultiSigSmartAccountFactory` was deployed then the deterministic Account address can be predict with helpers in preffered way:

**1. Onchain prediction**
```
const predictedAddress = await predictAccountAddrOnchain(smartAccountFactory combinedAddress, salt, ethersSignerOrProvider)
```

`accountImplementationAddress` can be taken from `MultiSigSmartAccountFactory` contract by calling `accountImplementation()`. This is done also by the helper function which can be used as below:
```
const implementationAddress = await getAccountImplementationAddress(factoryAddress, ethersSignerOrProvider)
```


**2. Fully offchain prediction!**
```
const predictedAddress = await predictAccountAddrOffchain(factoryAddress, accountImplementationAddress, combinedAddress, salt)
```

`factoryAddress` as well as `accountImplementationAddress` can be also predicted fully offchain with: 
* `predictFactoryAddrOffchain()` 
* `predictAccountImplementationAddrOffchain`. 
```
// predict Smart Account Factory address using salt
const saltFactory = saltToHex("aafactorysalttest")
const predictedFactory = predictFactoryAddrOffchain(saltFactory, ENTRYPOINT_ADDRESS)

// predict Smart Account Implementation address
const predictedImplementation = predictAccountImplementationAddrOffchain(
  saltFactory,
  predictedFactory,
  ENTRYPOINT_ADDRESS
)
```

### 1. Create Schnorr Signers out of private keys
The private key has to be hex value, so e.g. `0x123456...`. 

**Warning! Never disclose your private key!**
```
const signer1 = createSchnorrSigner(<PRIVATE_KEY_HEX_1>)
const signer2 = createSchnorrSigner(<PRIVATE_KEY_HEX_2>)
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
    combinedAddress: combinedAddress[],
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
const _createTx = await smartAccountFactory.createAccount(combinedAddress, saltBytes)
```
* `factoryAddress` is the address of `MultiSigSmartAccountFactory`. If already deployed, can be found in `deployments` folder of `aa-schnorr-multisig` package
* `combinedAddress` can be generated with `getAllCombinedAddrFromSigners()` function from schnorr-helpers. **Signers have to be the same as used for signing transactions.**

```
const x = 2 // nr of signers needed for valid signature, here 2/3
combinedAddress: string[] = getAllCombinedAddrFromSigners([signer1, signer2, signer3], x)
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
Use `multiSigAccountSigner` to extend accountSigner with multi-signature methods.
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
Use signers (or signers' public keys and public nonces), opHash and request generated above.

Every instance of `MultiSigUserOpWithSigners` is created once for single transaction (and designed signers combination, like 2/3) and uses **one-time nonces**, so transactions can't be re-signed or reused! 
```
const msUserOp = new MultiSigUserOpWithSigners([signer1, signer2], opHash, request)
```

If Signers can not be entirely passed as arguments it is possible to build User Operation out of signers' `publicKeys` and `publicNonces`.
```
const msUserOp = new MultiSigUserOp(publicKeys, publicNonces, opHash, userOpRequest)
```


### 7. Sign the transaction with every defined signer
```
msUserOp.signMultiSigHash(signer)
```

### 8. Send the transaction
To do so use `MultiSigAccountSigner`'s method `sendMultiSigTransaction()`.

In this step signatures (signed before by each signer) are collected and combined within the `MultiSigUserOpWithSigners` instance. This "summed-signature" is then sent and validated on-chain. If it's ok - transaction can be finished.
```
const txHash = await multiSigAccountSigner.sendMultiSigTransaction(msUserOp)
```

## Associated package
* [MultiSig Smart Account - ERC-4337 Smart Contracts](https://www.npmjs.com/package/aa-schnorr-multisig)

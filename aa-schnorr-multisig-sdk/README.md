# Account Abstraction Schnorr Signatures
A typescript library for creating ERC-4337 Account Abstraction which utilizes Schnorr Signatures for multi signatures.


## Key features
* ERC-4337 Account Abstraction
  * `MultiSigAccountAbstraction` class extends [Alchemys's](https://github.com/alchemyplatform/aa-sdk/tree/main/packages/core) `BaseSmartContractAccount`. It allows to interact with Smart Contract Account.
  * `MultiSigAccountSigner` class extends [Alchemys's](https://github.com/alchemyplatform/aa-sdk/tree/main/packages/ethers) `Account Signer` and is designed to build and send user operations.
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
### 1. Create Schnorr Signers out of private keys. 
**Warning! Never disclose your private key!**
```
const signer1 = createSchnorrSigner(hexToBytes(<PRIVATE_KEY_1>))
const signer2 = createSchnorrSigner(hexToBytes(<PRIVATE_KEY_2>))
```

### 2. Create Account Signer and MultiSig Account Signer 
- Create Provider. It can be e.g. AlchemyProvider.
```
const alchemy = new Alchemy({
  apiKey: <ALCHEMY_API_KEY>,
  network: <network>,
})
const provider = await alchemy.config.getProvider()
```
- Connect the Provider to the MultiSig Account Abstraction
```
const accountSigner = accountProvider.connectToAccount((rpcClient) => {
  const smartAccount = new MultiSigAccountAbstraction({
    entryPointAddress: <ENTRYPOINT_ADDRESS>,
    chain: <CHAIN>,
    accountAddress: <SMART_ACCOUNT_ADDRESS>,
    owner: <ACCPUNT_OWNER>,
    factoryAddress: <MUSIG_ACCOUNT_FACTORY_ADDRESS>,
    rpcClient,
    combinedPubKeys: combinedPubKeys[],
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
Tip! `combinedPubKeys` can be generated with `getAllCombinedPubKeysXofY()` function from schnorr-helpers. **Signers have to be the same as used for signing transactions.**

```
combinedPubKeys: Key[] = getAllCombinedPubKeysXofY([signer1, signer2])
```
- Finally create MultiSig Account Signer out of Account Signer
```
const multiSigAccountSigner = createMultiSigAccountSigner(accountSigner)
```

### 3. Create User Operation Call Data. 
In this example `UserOperationCallData` is encoded with ERC20's `transfer` function.
```
const uoCallData: UserOperationCallData = encodeFunctionData({
        abi: ERC20_abi,
        args: [toAddress, amount],
        functionName: "transfer",
      })
```

- `ERC20_abi` imported from [aa-schnorr-multisig](https://www.npmjs.com/package/aa-schnorr-multisig)
- `encodeFunctionData` imported from [viem](https://www.npmjs.com/package/viem) encodes the function name and parameters into an ABI encoded value

### 4. Build User Operation. 
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

### 5. Initialize Multi-Sig Schnorr Transaction.
Use signers, opHash and request generated above.

Every instance of `SchnorrMultiSigTx` is created once for single transaction and uses **one-time nonces**, so transaction can't be re-signed or reused! 
```
const msTx = new SchnorrMultiSigTx([signer1, signer2], opHash, request)
```

### 6. Sign the transaction with every defined signer.
```
msTx.signMultiSigHash(signer)
```

### 7. Send the transaction.
To do so use `MultiSigAccountSigner`'s method `sendMultiSigTransaction()`.

In this step signatures signed before by every signer are collected and combined within `SchnorrMultiSigTx` instance. This "summed-signature" is then sent and validate on-chain. If it's ok - transaction can be finished.
```
const txHash = await multiSigAccountSigner.sendMultiSigTransaction(msTx)
```

## Associated package
* [MultiSig Smart Account - ERC-4337 Smart Contracts](https://www.npmjs.com/package/aa-schnorr-multisig)
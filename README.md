# Account Abstraction Schnorr MultiSig

Account Abstraction - Schnorr Multi Signature ERC-4337 compliant smart contracts.

## About
Package contains two main contracts:
* MultiSigSmartAccount - ERC-4337 Account Abstraction implementation
* MultiSigSmartAccountFactory - factory contract for account abstraction

Account Abstraction is [UUPS Upgradeable Proxy](https://docs.openzeppelin.com/contracts/5.x/api/proxy#UUPSUpgradeable) and implementation can be upgraded only by the Owner.
[The Owner Role](https://docs.openzeppelin.com/contracts/5.x/api/access#AccessControl) is granted for every Schnorr's combined public address - `combinedAddress` - passed during Account initialization (read more about the `combinedAddress` creation [here](https://www.npmjs.com/package/aa-schnorr-multisig-sdk#0-deploy-multisigsmartaccountfactory-and-create-account-abstraction) ). It means that the most crucial functions, such as upgrade or deposit withdrawal, can be done only if a transaction is signed with Schnorr Multi-signature algorithm. 


## Requirements:

* Node: >=18.0.0 <20.0.0
* npm (Node.js package manager): v9.x.x

## Installation

```
git clone https://github.com/RunOnFlux/account-abstraction.git
cd account-abstraction
npm i
```

### Testing
```
npm run test
```

# Deployment

Make sure to include the `deployments` folder in the repository and add the `env` file as in the `env.sample` file.

To deploy MultiSigSmartAccount Factory on Polygon Mumbai Testnet run command: 

```bash
npm run deploy:mumbai
```

To deploy on any different supported network run
```bash
npx hardhat deploy --network <NETWORK_NAME> --tags ACCOUNT_FACTORY
```
List of supported network names:
  * mainnet,
  * sepolia,
  * polygon-mainnet,
  * polygon-mumbai,


## Build package

```bash
npm run build
```

The package contains the following folders:
* `abi` - generated smart contracts' ABI json files
* `deployments` - addresses of deployed contracts (if any) for every supported network
* `typechain` - generated TypeScript typings based on the given ABI files

## Associated package
* [MultiSig Schnorr Signature SDK](https://www.npmjs.com/package/aa-schnorr-multisig-sdk)

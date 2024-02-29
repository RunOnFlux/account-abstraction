# Account Abstraction Schnorr MultiSig

Account Abstraction - Schnorr Multi Signature ERC-4337 compliant smart contracts.


## Requirements:

* Node: >=18.0.0, <20.0.0
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

Make sure to include `deployments` folder in the repository and add `env` file as in the `env.sample` file.

To deploy MultiSigSmartAccount Factory on Polygon Mumbai Testnet run command: 

```bash
npm run deploy:mumbai
```

To deploy on any different supported network run
```bash
npx hardhat deploy --network <NETWORK_NAME> --tags FULL
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
* `deployments` - addresses of deployed contrancts (if any) for each supported network
* `typechain` - generated TypeScript typings based on the given ABI files

## Associated package
* [MultiSig Schnorr Signature SDK](https://www.npmjs.com/package/aa-schnorr-multisig-sdk)
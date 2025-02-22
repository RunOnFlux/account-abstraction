# Account Abstraction Schnorr MultiSig

Account Abstraction - Schnorr Multi Signature ERC-4337 compliant smart contracts.

## Overview

This package provides a robust implementation of ERC-4337 Account Abstraction using Schnorr Multi-Signatures. It includes two main smart contracts:

- **MultiSigSmartAccount**: Implements the ERC-4337 Account Abstraction.
- **MultiSigSmartAccountFactory**: A factory contract for creating account abstractions.

The contracts are designed to be [UUPS Upgradeable Proxies](https://docs.openzeppelin.com/contracts/5.x/api/proxy#UUPSUpgradeable), allowing upgrades by the Owner. The Owner role is assigned to the combined public address (`combinedAddress`) during account initialization, ensuring that critical functions like upgrades or withdrawals require Schnorr Multi-signature authorization.

## Key Features

- **Secure Multi-Signature Transactions**: Utilizes Schnorr signatures for enhanced security.
- **Upgradeable Contracts**: Supports UUPS proxy pattern for contract upgrades.
- **ERC-4337 Compliance**: Adheres to the latest Ethereum standards for account abstraction.

## Requirements

- **Node.js**: Version >=18
- **npm**: Version >=9

## Installation

NPM package

```bash
npm install @runonflux/account-abstraction
```

Clone the repository and install dependencies:

```bash
git clone https://github.com/RunOnFlux/account-abstraction.git
cd account-abstraction
npm install
```

## Testing

Run the test suite using:

```bash
npm run test
```

## Deployments

Refer to the [Deployments](./deployments.md) for information about deployed contracts.

Deploy the MultiSigSmartAccount Factory on Ethereum Sepolia Testnet:

```bash
npm run deploy:sepolia
```

For other supported networks, use:

```bash
npx hardhat deploy --network <NETWORK_NAME> --tags ACCOUNT_FACTORY
```

Supported networks include:
- mainnet
- sepolia
- polygon-mainnet

## Build Package

Build the package with:

```bash
npm run prebuild
npm run build
```

The package includes:
- `abi`: Generated ABI JSON files for smart contracts.
- `deployments`: Addresses of deployed contracts for each supported network.
- `typechain`: TypeScript typings generated from ABI files.

## Associated Packages

- **[MultiSig Schnorr Signature SDK](https://www.npmjs.com/package/@runonflux/aa-schnorr-multisig-sdk)**: A TypeScript library for creating ERC-4337 Account Abstractions with Schnorr Signatures. Refer to the [SDK README](https://github.com/RunOnFlux/account-abstraction/tree/main/aa-schnorr-multisig-sdk) for usage guides and examples.

## SSP Wallet

The SSP Wallet is a multi-signature, multi-asset wallet leveraging this SDK for EVM chains. For more information and usage examples, visit the [SSP Wallet Repository](https://github.com/RunOnFlux/ssp-wallet).

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Reporting Issues

Found a bug? Please report it on our [issue tracker](https://github.com/RunOnFlux/account-abstraction/issues).

## Inspiration, Credits & Acknowledgements

- *This library is based on [Borislav Itskov research](https://hackmd.io/@0xbobby/rkIGEBVb2) and draws inspiration from the [schnorrkel.js](https://github.com/borislav-itskov/schnorrkel.js) implementation.*
- *Account Abstraction ERC4337 [eth-infinitism/account-abstraction](https://github.com/eth-infinitism/account-abstraction)*

## Security Audits  

The smart contracts and SDK underwent a comprehensive security audit by [Halborn](https://halborn.com/) finalised in **February 2025**.  

### Audit Reports  

📄 **Smart Contracts Audit**  
- **[Halborn Audit Report – Smart Contracts](https://github.com/RunOnFlux/account-abstraction/blob/main/Account_Abstraction_Schnorr_MultiSig_SmartContracts_SecAudit_HALBORN.pdf)** (GitHub)  
- **[Halborn Public Report – Smart Contracts](https://www.halborn.com/audits/influx-technologies/account-abstraction-schnorr-multisig)** (Halborn)  

📄 **SDK Audit**  
- **[Halborn Audit Report – SDK](https://github.com/RunOnFlux/account-abstraction/blob/main/Account_Abstraction_Schnorr_MultiSig_SDK_SecAudit_HALBORN.pdf)** (GitHub)  
- **[Halborn Public Report – SDK](https://www.halborn.com/audits/influx-technologies/account-abstraction-schnorr-signatures-sdk)** (Halborn)  


### Findings & Notes

- **Smart Contracts:** All findings were in **unused code**, which has been **removed** in the `main` branch. Contracts were **redeployed**, and the `main` branch is recommended for production while `master` branch is an archive where audits were assessed and perfectly safe to continue using. ([Fix PR](https://github.com/RunOnFlux/account-abstraction/pull/15))  
- **SDK:** All important findigs were addressed in the `main` branch. Be noted that examples are using hard coded values, furthermore this library requires proper **nonce management** on the client side, and following a strict **error-throwing approach**. ([Fix PR](https://github.com/RunOnFlux/account-abstraction/pull/17))  


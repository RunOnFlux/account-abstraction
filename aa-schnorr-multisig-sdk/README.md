# Account Abstraction Schnorr Multi Signatures SDK
A typescript library for creating ERC-4337 Account Abstraction which utilizes Schnorr Signatures for multi signatures.


## About
Current library provide utilities to sign/send User Operation's with Schnorr Signer.
[Alchemy Account Kit](https://accountkit.alchemy.com/) used to send User Operations. To better understand usage
of library go to ***Examples*** section.


## ⚠️ Critical Information

### Public Nonces

Never reuse public nonces. Reusing them will cryptographically expose your private keys and lead to a loss of funds. Implement robust nonce management in your application is crucial for security, make sure to delete nonce after usage and never use it again.

### Salts

Construction of multisignature address uses salts. Ensure salts are deterministic and consistent to maintain cross-wallet compatibility. Usage of different salts will lead to different multisignature address. Use the following salts that are used by SSP Wallet:
- `accountSalt`: `aasalt`
- `factorySalt`: `aafactorysalt`


## 📦 Installation

Install via npm:

```bash
npm install @runonflux/aa-schnorr-multisig-sdk
```

Or clone the repository:

```bash
git clone https://github.com/RunOnFlux/account-abstraction.git
cd account-abstraction/aa-schnorr-multisig-sdk
npm i
```

## 🛠️ Usage

To get started, explore our examples and documentation. Ensure you have a `.env` file configured with the necessary environment variables as shown in `.env.sample`.

### Examples

- **[Get Smart Account Address On-Chain/Off-Chain](./examples/account-address/account_address.md)**
- **[Smart Account Deployment](./examples/account-deployment/account-deployment.md)**
- **[Sign 3 of 3](./examples/sign_3_of_3/sign-3_of_3.md)**


## 🐛 Reporting Issues

Found a bug? Please report it on our [issue tracker](https://github.com/RunOnFlux/account-abstraction/issues).


## 📜 License

This project is licensed under the MIT License.

## 🌐 Associated Packages

- **[MultiSig Smart Account - ERC-4337 Smart Contracts](https://www.npmjs.com/package/@runonflux/account-abstraction)**
- **[Account Abstraction - Schnorr Multisig SDK](https://www.npmjs.com/package/@runonflux/aa-schnorr-multisig-sdk)**


## SSP Wallet

SSP Wallet is a multi-signature multi-asset wallet that uses this AA Schnorr Multi-Signature SDK for EVM chains. Check out the SSP Wallet repository for more information and proper usage of the library

- **[SSP Wallet Repository](https://github.com/RunOnFlux/ssp-wallet)**


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

# Account Abstraction Schnorr Signatures
A typescript library for creating ERC-4337 Account Abstraction which utilizes Schnorr Signatures for multi signatures.


## About
Current library provide utilities to sign/send User Operation's with Schnorr Signer.
[Alchemy Account Kit](https://accountkit.alchemy.com/) used to send User Operations. To better understand usage
of library go to ***Examples*** section.


## Installation

```
git clone https://github.com/RunOnFlux/aa-schnorr-multisig-sdk.git
cd aa-schnorr-multisig-sdk
npm i
```

## Examples
To execute examples add `.env` file with required variables according to `.env.sample`
```
ALCHEMY_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/0000000000000000000000000"
# Private key of account with fund's to cover transaction's costs 
# (ex. 0.5 Sepolia ETH in case of sepolia chain)
PRIVATE_KEY="0x"
```
* [Get Smart Account Address On-Chain/Off-Chain](./examples/account-address/account_address.md)
* [Smart Account Deployment](./examples/account-deployment/account-deployment.md)
* [Sign 3 of 3](./examples/sign_3_of_3/sign-3_of_3.md)


## Associated package
* [MultiSig Smart Account - ERC-4337 Smart Contracts](https://www.npmjs.com/package/@runonflux/aa-schnorr-multisig)

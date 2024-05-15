import { ethers } from "ethers"

const pk1 = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
const pk2 = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"
const pk3 = "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"
const addressOne = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
const addressTwo = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
const addressThree = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC"
const addressFour = "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
const localhost = "http://127.0.0.1:8545"
const provider = new ethers.JsonRpcProvider(localhost)
const wallet = new ethers.Wallet(pk1, provider)
const wallet2 = new ethers.Wallet(pk2, provider)
const wallet3 = new ethers.Wallet(pk3, provider)

export { pk1, pk2, pk3, localhost, provider, wallet, wallet2, wallet3, addressOne, addressTwo, addressThree, addressFour }

export const ERC1271_MAGICVALUE_BYTES32 = "0x1626ba7e"
export const ERC1271_INVALID_SIGNATURE = "0xffffffff"
export const HEX_ZERO = "0x0000000000000000000000000000000000000000000000000000000000000000"
export const HEX_ONE = "0x0000000000000000000000000000000000000000000000000000000000000001"
export const OWNER_ROLE_HASH = ethers.solidityPackedKeccak256(["string"], ["OWNER_ROLE"])
export const SIGNER_ROLE_HASH = ethers.solidityPackedKeccak256(["string"], ["SIGNER_ROLE"])

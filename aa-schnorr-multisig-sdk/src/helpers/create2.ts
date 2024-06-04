/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Provider, Signer } from "ethers"
import { AbiCoder, ethers } from "ethers"

import { ERC1967Proxy__factory, MultiSigSmartAccount__factory, MultiSigSmartAccountFactory__factory } from "../generated/typechain"
import { MultiSigSmartAccountFactory_abi } from "../generated/abi"
import type { Hex } from "../accountAbstraction"

// Proxy address contract used to deploy (using create2) new MultiSigSmartAccount Factory
// see: https://github.com/Arachnid/deterministic-deployment-proxy
export const PROXY_FACTORY_ADDRESS = "0x4e59b44847b379578588920ca78fbf26c0b4956c"

// Alchemy Supported Entry Point
// see: https://docs.alchemy.com/reference/eth-supportedentrypoints
export const ENTRY_POINT_ALCHEMY_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

/**
 * Calculates offchain MultiSigSmartAccount address with create2.
 * @param factoryAddress MultiSigSmartAccountFactory address
 * @param accountImplementationAddress MultiSigSmartAccount implementation address
 * @param combinedAddresses combined schnorr signers' public addresses used as contract owners
 * @param salt salt text: string or number
 * @returns predicted MultiSigSmartAccount address
 */
export function predictAccountAddrOffchain(
  factoryAddress: string,
  accountImplementationAddress: string,
  combinedAddresses: string[],
  salt: string
): string {
  // ERC1967Proxy is the contract which gets deployed when creating new MultiSigSmartAccount
  const erc1967ProxyBytecode = ERC1967Proxy__factory.bytecode
  const smartAccountInterface = MultiSigSmartAccount__factory.createInterface()
  const encodedInitializer = smartAccountInterface.encodeFunctionData("initialize", [combinedAddresses])

  // ERC1967Proxy takes two parameters while deploying: implementation and encoded init data
  const coder = AbiCoder.defaultAbiCoder()
  const encodedConstructorInitCode = coder.encode(["address", "bytes"], [accountImplementationAddress, encodedInitializer])
  // Calculating initCodeHash keccak256(contractByteCode+ConstructorCode)
  const initByteCode = ethers.solidityPacked(["bytes", "bytes"], [erc1967ProxyBytecode, encodedConstructorInitCode])
  const initCodeHash = ethers.keccak256(initByteCode)

  return ethers.getCreate2Address(factoryAddress, saltToHex(salt), initCodeHash)
}

/**
 * Calculates offchain MultiSigSmartAccount address with create2
 * @param salt salt text: string or number
 * @param entryPointAddress Account Abstraction's Entry Point address (default: Alchemy Entry Point)
 * @returns predicted MultiSigSmartAccount Factory address
 */
export function predictFactoryAddrOffchain(salt: string, entryPointAddress?: string): string {
  const factoryBytecode = MultiSigSmartAccountFactory__factory.bytecode
  const saltHex = saltToHex(salt)
  const entryPointAddr = entryPointAddress ?? ENTRY_POINT_ALCHEMY_ADDRESS

  // Factory takes only one parameter while deploying: Entry Point address
  const coder = AbiCoder.defaultAbiCoder()
  const encodedConstructorInitCode = coder.encode(["address", "bytes32"], [entryPointAddr, saltHex])

  // Calculating initCodeHash keccak256(contractByteCode+ConstructorCode)
  const initCode = ethers.solidityPacked(["bytes", "bytes"], [factoryBytecode, encodedConstructorInitCode])
  const initCodeHash = ethers.keccak256(initCode)

  return ethers.getCreate2Address(PROXY_FACTORY_ADDRESS, saltHex, initCodeHash)
}

/**
 * Calculates offchain MultiSigSmartAccount implementation address with create2
 * @param factoryAddress MultiSigSmartAccount Factory address.
 * If not known, can be predicted with given `factorySalt` and `entryPointAddress` params
 * @param factorySalt salt text: string or number - the same used for Factory deployment
 * @param entryPointAddress Account Abstraction's Entry Point address (default: Alchemy Entry Point)
 * @returns
 */
export function predictAccountImplementationAddrOffchain(factorySalt: string, factoryAddress?: string, entryPointAddress?: string): string {
  const entryPointAddr = entryPointAddress ?? ENTRY_POINT_ALCHEMY_ADDRESS
  const factorySaltHex = saltToHex(factorySalt)
  const multiSigFactoryAddress = factoryAddress ?? predictFactoryAddrOffchain(factorySalt, entryPointAddr)
  const smartAccountByteCode = MultiSigSmartAccount__factory.bytecode

  // Factory takes only one parameter while deploying: Entry Point address
  const coder = AbiCoder.defaultAbiCoder()
  const encodedConstructorInitCode = coder.encode(["address"], [entryPointAddr])

  // Calculating initCodeHash keccak256(contractByteCode+ConstructorCode)
  const initCode = ethers.solidityPacked(["bytes", "bytes"], [smartAccountByteCode, encodedConstructorInitCode])
  const initCodeHash = ethers.keccak256(initCode)
  return ethers.getCreate2Address(multiSigFactoryAddress, factorySaltHex, initCodeHash)
}

/**
 * Calculates MultiSigSmartAccount address with create2 and onchain data.
 * @param factoryAddress MultiSigSmartAccountFactory address
 * @param combinedAddresses combined schnorr signers' public addresses used as contract owners
 * @param salt salt text: string or number
 * @param ethersSignerOrProvider Signer or Provider type to call the Factory contract
 * @returns predicted MultiSigSmartAccount address
 */
export async function predictAccountAddrOnchain(
  factoryAddress: string,
  combinedAddresses: string[],
  salt: string,
  ethersSignerOrProvider: Signer | Provider
): Promise<`0x${string}`> {
  const smartAccountFactory = new ethers.Contract(factoryAddress, MultiSigSmartAccountFactory_abi, ethersSignerOrProvider)
  const saltHash = saltToHex(salt)
  const predictedAccount = await smartAccountFactory.getAccountAddress(combinedAddresses, saltHash)
  return predictedAccount
}

/**
 * Helper for getting account implementation address from Account Factory
 * @param factoryAddress deployed MultiSigSmartAccountFactory address
 * @param ethersSignerOrProvider signer or provider to call contract
 * @returns account implementation address
 */
export async function getAccountImplementationAddress(factoryAddress: string, ethersSignerOrProvider: Signer | Provider): Promise<string> {
  const smartAccountFactory = new ethers.Contract(factoryAddress, MultiSigSmartAccountFactory_abi, ethersSignerOrProvider)
  const accountImplementation = await smartAccountFactory.accountImplementation()
  return accountImplementation
}

/**
 * Checks if salt is Hex and if not - converts from string or number to hashed string with keccak256.
 * @param salt salt text: string or number
 * @returns hashed salt
 */
export const saltToHex = (salt: string): Hex => {
  const saltString = salt.toString()
  if (ethers.isHexString(saltString)) return saltString

  return ethers.id(saltString) as Hex
}

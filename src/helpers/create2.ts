import type { Provider } from "@ethersproject/providers"
import { ethers, type Signer } from "ethers"

import { ERC1967Proxy__factory, MultiSigSmartAccount__factory } from "../typechain"
import { MultiSigSmartAccountFactory_abi } from "../abi"

/**
 * Calculates offchain MultiSigSmartAccount address with create2
 * @param factoryAddress MultiSigSmartAccountFactory address
 * @param accountImplementationAddress MultiSigSmartAccount implementation address
 * @param combinedAddresses combined schnorr signers' public addresses used as contract owners
 * @param salt salt text: string or number
 * @returns predicted MultiSigSmartAccount address
 */
export function predictAddressOffchain(
  factoryAddress: string,
  accountImplementationAddress: string,
  combinedAddresses: string[],
  salt: string | number
): string {
  // ERC1967Proxy is the contract which gets deployed when creating new MultiSigSmartAccount
  const erc1967ProxyBytecode = ERC1967Proxy__factory.bytecode
  const smartAccountInterface = MultiSigSmartAccount__factory.createInterface()
  const encodedInitializer = smartAccountInterface.encodeFunctionData("initialize", [combinedAddresses])

  // ERC1967Proxy takes two parameters while deploying: implementation and encoded init data
  const encodedConstructorInitCode = ethers.utils.defaultAbiCoder.encode(
    ["address", "bytes"],
    [accountImplementationAddress, encodedInitializer]
  )
  // Calculating initCodeHash keccak256(contractByteCode+ConstructorCode)
  const initByteCode = ethers.utils.solidityPack(["bytes", "bytes"], [erc1967ProxyBytecode, encodedConstructorInitCode])
  const initCodeHash = ethers.utils.keccak256(initByteCode)

  return ethers.utils.getCreate2Address(factoryAddress, saltToHex(salt), initCodeHash)
}

/**
 * Onchain functon to predict deterministic Account Abstraction address
 * @param factoryAddress MultiSigSmartAccountFactory address
 * @param combinedAddresses combined schnorr signers' public addresses used as contract owners
 * @param salt salt text: string or number
 * @param ethersSignerOrProvider Signer or Provider type to call the Factory contract
 * @returns predicted MultiSigSmartAccount address
 */
export async function predictAddressOnchain(
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
 * Determines if a given contract is deployed at the given address.
 * @param address contract address
 * @param provider provider to call contract
 * @returns true if contract deployed or false otherwise
 */
export async function isDeployed(address: string, provider: Provider): Promise<boolean> {
  const code = await provider.getCode(address)
  return code.slice(2).length > 0
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

export const saltToHex = (salt: string | number): string => {
  const saltString = salt.toString()
  if (ethers.utils.isHexString(saltString)) return saltString

  return ethers.utils.id(saltString)
}

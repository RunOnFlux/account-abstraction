/* eslint-disable @typescript-eslint/no-explicit-any */
import { AbiCoder, ethers } from "ethers"
import type { Interface } from "ethers"
import type { TransactionReceipt, Provider } from "@ethersproject/providers"

export const buildBytecode = (constructorTypes: any[], constructorArgs: any[], contractBytecode: string) =>
  `${contractBytecode}${encodeParams(constructorTypes, constructorArgs).slice(2)}`

export const buildCreate2Address = (factoryAddress: string, saltHex: string, byteCode: string) => {
  return `0x${ethers
    .keccak256(`0x${["ff", factoryAddress, saltHex, ethers.keccak256(byteCode)].map((x) => x.replace(/0x/, "")).join("")}`)
    .slice(-40)}`.toLowerCase()
}

export const numberToUint256 = (value: number) => {
  const hex = value.toString(16)
  return `0x${"0".repeat(64 - hex.length)}${hex}`
}

export const encodeParams = (dataTypes: any[], data: any[]) => {
  const abiCoder = new AbiCoder()
  return abiCoder.encode(dataTypes, data)
}

export const isContract = async (address: string, provider: Provider) => {
  const code = await provider.getCode(address)
  return code.slice(2).length > 0
}

export const parseEvents = (receipt: TransactionReceipt, contractInterface: Interface, eventName: string) =>
  receipt.logs.map((log) => contractInterface.parseLog(log)).filter((log) => log?.name === eventName)

export const encoder = (types, values) => {
  const abiCoder = new AbiCoder()
  const encodedParams = abiCoder.encode(types, values)
  return encodedParams.slice(2)
}

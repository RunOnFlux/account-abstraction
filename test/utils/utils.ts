/* eslint-disable @typescript-eslint/no-explicit-any */
import { AbiCoder, ethers } from "ethers"
import type { Interface } from "ethers"
import type { TransactionReceipt, Provider } from "@ethersproject/providers"
import type { Hex } from "viem"

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

export const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true

  if (typeof obj1 !== "object" || obj1 === null || typeof obj2 !== "object" || obj2 === null) return false

  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)

  if (keys1.length !== keys2.length) return false

  for (const key of keys1) if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) return false

  return true
}

export const generateRandomHex = (): Hex => {
  let hex = "0x"
  for (let index = 0; index < 40; index++) hex += Math.floor(Math.random() * 16).toString(16)

  return hex as Hex
}

export const generateRandomBigInt = (min: number = 10, max: number = 1_000_000_000): bigint => {
  return BigInt(Math.floor(Math.random() * (max - min + 1) + min))
}

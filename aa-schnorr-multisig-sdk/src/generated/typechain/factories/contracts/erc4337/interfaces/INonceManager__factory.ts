/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  INonceManager,
  INonceManagerInterface,
} from "../../../../contracts/erc4337/interfaces/INonceManager";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "uint192",
        name: "key",
        type: "uint192",
      },
    ],
    name: "getNonce",
    outputs: [
      {
        internalType: "uint256",
        name: "nonce",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint192",
        name: "key",
        type: "uint192",
      },
    ],
    name: "incrementNonce",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export class INonceManager__factory {
  static readonly abi = _abi;
  static createInterface(): INonceManagerInterface {
    return new utils.Interface(_abi) as INonceManagerInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): INonceManager {
    return new Contract(address, _abi, signerOrProvider) as INonceManager;
  }
}

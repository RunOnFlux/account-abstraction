/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import { Contract, Signer, utils } from "ethers";
import type { Provider } from "@ethersproject/providers";
import type {
  IMultiSigSmartAccount,
  IMultiSigSmartAccountInterface,
} from "../../../contracts/interfaces/IMultiSigSmartAccount";

const _abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "msgSender",
        type: "address",
      },
    ],
    name: "MsgSenderNotThisAccount",
    type: "error",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "msgSender",
        type: "address",
      },
    ],
    name: "NeitherOwnerNorEntryPoint",
    type: "error",
  },
  {
    inputs: [],
    name: "OwnerNotDefined",
    type: "error",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "contract IEntryPoint",
        name: "entryPoint",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "pubKeysCounter",
        type: "uint256",
      },
    ],
    name: "MultiSigAccountInitialized",
    type: "event",
  },
] as const;

export class IMultiSigSmartAccount__factory {
  static readonly abi = _abi;
  static createInterface(): IMultiSigSmartAccountInterface {
    return new utils.Interface(_abi) as IMultiSigSmartAccountInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): IMultiSigSmartAccount {
    return new Contract(
      address,
      _abi,
      signerOrProvider
    ) as IMultiSigSmartAccount;
  }
}

/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import { Signer, utils, Contract, ContractFactory, Overrides } from "ethers";
import type { Provider, TransactionRequest } from "@ethersproject/providers";
import type { PromiseOrValue } from "../../../../common";
import type {
  SenderCreator,
  SenderCreatorInterface,
} from "../../../../contracts/erc4337/core/SenderCreator";

const _abi = [
  {
    inputs: [
      {
        internalType: "bytes",
        name: "initCode",
        type: "bytes",
      },
    ],
    name: "createSender",
    outputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const _bytecode =
  "0x608060405234801561001057600080fd5b506101f3806100206000396000f3fe608060405234801561001057600080fd5b506004361061002b5760003560e01c8063570e1a3614610030575b600080fd5b61004361003e3660046100ec565b61005f565b6040516001600160a01b03909116815260200160405180910390f35b60008061006f601482858761015e565b61007891610188565b60601c9050600061008c846014818861015e565b8080601f016020809104026020016040519081016040528093929190818152602001838380828437600092018290525084519495509360209350849250905082850182875af190506000519350806100e357600093505b50505092915050565b600080602083850312156100ff57600080fd5b823567ffffffffffffffff8082111561011757600080fd5b818501915085601f83011261012b57600080fd5b81358181111561013a57600080fd5b86602082850101111561014c57600080fd5b60209290920196919550909350505050565b6000808585111561016e57600080fd5b8386111561017b57600080fd5b5050820193919092039150565b6bffffffffffffffffffffffff1981358181169160148510156101b55780818660140360031b1b83161692505b50509291505056fea26469706673582212207ba38bd6cdb4278ae982c86a5e991b906b86bc749734e5115c2cc103f8ffdfba64736f6c63430008140033";

type SenderCreatorConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: SenderCreatorConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class SenderCreator__factory extends ContractFactory {
  constructor(...args: SenderCreatorConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override deploy(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): Promise<SenderCreator> {
    return super.deploy(overrides || {}) as Promise<SenderCreator>;
  }
  override getDeployTransaction(
    overrides?: Overrides & { from?: PromiseOrValue<string> }
  ): TransactionRequest {
    return super.getDeployTransaction(overrides || {});
  }
  override attach(address: string): SenderCreator {
    return super.attach(address) as SenderCreator;
  }
  override connect(signer: Signer): SenderCreator__factory {
    return super.connect(signer) as SenderCreator__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): SenderCreatorInterface {
    return new utils.Interface(_abi) as SenderCreatorInterface;
  }
  static connect(
    address: string,
    signerOrProvider: Signer | Provider
  ): SenderCreator {
    return new Contract(address, _abi, signerOrProvider) as SenderCreator;
  }
}

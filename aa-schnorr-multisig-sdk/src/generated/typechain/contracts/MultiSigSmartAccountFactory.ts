/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "../common";

export interface MultiSigSmartAccountFactoryInterface extends Interface {
  getFunction(
    nameOrSignature:
      | "accountImplementation"
      | "createAccount"
      | "getAccountAddress"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic: "MultiSigSmartAccountCreated"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "accountImplementation",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "createAccount",
    values: [AddressLike[], BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "getAccountAddress",
    values: [AddressLike[], BytesLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "accountImplementation",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "createAccount",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "getAccountAddress",
    data: BytesLike
  ): Result;
}

export namespace MultiSigSmartAccountCreatedEvent {
  export type InputTuple = [smartAccount: AddressLike];
  export type OutputTuple = [smartAccount: string];
  export interface OutputObject {
    smartAccount: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface MultiSigSmartAccountFactory extends BaseContract {
  connect(runner?: ContractRunner | null): MultiSigSmartAccountFactory;
  waitForDeployment(): Promise<this>;

  interface: MultiSigSmartAccountFactoryInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  accountImplementation: TypedContractMethod<[], [string], "view">;

  createAccount: TypedContractMethod<
    [combinedAddress: AddressLike[], salt: BytesLike],
    [string],
    "nonpayable"
  >;

  getAccountAddress: TypedContractMethod<
    [combinedAddress: AddressLike[], salt: BytesLike],
    [string],
    "view"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "accountImplementation"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "createAccount"
  ): TypedContractMethod<
    [combinedAddress: AddressLike[], salt: BytesLike],
    [string],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "getAccountAddress"
  ): TypedContractMethod<
    [combinedAddress: AddressLike[], salt: BytesLike],
    [string],
    "view"
  >;

  getEvent(
    key: "MultiSigSmartAccountCreated"
  ): TypedContractEvent<
    MultiSigSmartAccountCreatedEvent.InputTuple,
    MultiSigSmartAccountCreatedEvent.OutputTuple,
    MultiSigSmartAccountCreatedEvent.OutputObject
  >;

  filters: {
    "MultiSigSmartAccountCreated(address)": TypedContractEvent<
      MultiSigSmartAccountCreatedEvent.InputTuple,
      MultiSigSmartAccountCreatedEvent.OutputTuple,
      MultiSigSmartAccountCreatedEvent.OutputObject
    >;
    MultiSigSmartAccountCreated: TypedContractEvent<
      MultiSigSmartAccountCreatedEvent.InputTuple,
      MultiSigSmartAccountCreatedEvent.OutputTuple,
      MultiSigSmartAccountCreatedEvent.OutputObject
    >;
  };
}

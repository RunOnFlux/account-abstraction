/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  FunctionFragment,
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
} from "../../common";

export interface IMultiSigSmartAccountFactoryInterface extends Interface {
  getEvent(
    nameOrSignatureOrTopic: "MultiSigSmartAccountCreated"
  ): EventFragment;
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

export interface IMultiSigSmartAccountFactory extends BaseContract {
  connect(runner?: ContractRunner | null): IMultiSigSmartAccountFactory;
  waitForDeployment(): Promise<this>;

  interface: IMultiSigSmartAccountFactoryInterface;

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

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

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

/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
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

export interface IMultiSigSmartAccountInterface extends Interface {
  getEvent(nameOrSignatureOrTopic: "MultiSigAccountInitialized"): EventFragment;
}

export namespace MultiSigAccountInitializedEvent {
  export type InputTuple = [
    entryPoint: AddressLike,
    pubKeysCounter: BigNumberish
  ];
  export type OutputTuple = [entryPoint: string, pubKeysCounter: bigint];
  export interface OutputObject {
    entryPoint: string;
    pubKeysCounter: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface IMultiSigSmartAccount extends BaseContract {
  connect(runner?: ContractRunner | null): IMultiSigSmartAccount;
  waitForDeployment(): Promise<this>;

  interface: IMultiSigSmartAccountInterface;

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
    key: "MultiSigAccountInitialized"
  ): TypedContractEvent<
    MultiSigAccountInitializedEvent.InputTuple,
    MultiSigAccountInitializedEvent.OutputTuple,
    MultiSigAccountInitializedEvent.OutputObject
  >;

  filters: {
    "MultiSigAccountInitialized(address,uint256)": TypedContractEvent<
      MultiSigAccountInitializedEvent.InputTuple,
      MultiSigAccountInitializedEvent.OutputTuple,
      MultiSigAccountInitializedEvent.OutputObject
    >;
    MultiSigAccountInitialized: TypedContractEvent<
      MultiSigAccountInitializedEvent.InputTuple,
      MultiSigAccountInitializedEvent.OutputTuple,
      MultiSigAccountInitializedEvent.OutputObject
    >;
  };
}

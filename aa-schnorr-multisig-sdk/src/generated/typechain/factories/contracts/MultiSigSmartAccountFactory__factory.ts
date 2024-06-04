/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import {
  Contract,
  ContractFactory,
  ContractTransactionResponse,
  Interface,
} from "ethers";
import type {
  Signer,
  BytesLike,
  AddressLike,
  ContractDeployTransaction,
  ContractRunner,
} from "ethers";
import type { NonPayableOverrides } from "../../common";
import type {
  MultiSigSmartAccountFactory,
  MultiSigSmartAccountFactoryInterface,
} from "../../contracts/MultiSigSmartAccountFactory";

const _abi = [
  {
    inputs: [
      {
        internalType: "contract IEntryPoint",
        name: "_entryPoint",
        type: "address",
      },
      {
        internalType: "bytes32",
        name: "_salt",
        type: "bytes32",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "smartAccount",
        type: "address",
      },
    ],
    name: "MultiSigSmartAccountCreated",
    type: "event",
  },
  {
    inputs: [],
    name: "accountImplementation",
    outputs: [
      {
        internalType: "contract MultiSigSmartAccount",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "combinedAddress",
        type: "address[]",
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32",
      },
    ],
    name: "createAccount",
    outputs: [
      {
        internalType: "contract MultiSigSmartAccount",
        name: "ret",
        type: "address",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address[]",
        name: "combinedAddress",
        type: "address[]",
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32",
      },
    ],
    name: "getAccountAddress",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const _bytecode =
  "0x60a060405234801561001057600080fd5b50604051612a65380380612a6583398101604081905261002f9161008f565b808260405161003d90610082565b6001600160a01b0390911681526020018190604051809103906000f590508015801561006d573d6000803e3d6000fd5b506001600160a01b0316608052506100c99050565b61208f806109d683390190565b600080604083850312156100a257600080fd5b82516001600160a01b03811681146100b957600080fd5b6020939093015192949293505050565b6080516108e66100f060003960008181604b0152818160db01526101b101526108e66000f3fe608060405234801561001057600080fd5b50600436106100415760003560e01c806311464fbe1461004657806319d1e47f146100895780634acdf1a51461009c575b600080fd5b61006d7f000000000000000000000000000000000000000000000000000000000000000081565b6040516001600160a01b03909116815260200160405180910390f35b61006d6100973660046102f9565b6100af565b61006d6100aa3660046102f9565b610186565b600061017d82604051806020016100c5906102ba565b6020820181038252601f19601f820116604052507f00000000000000000000000000000000000000000000000000000000000000008660405160240161010b91906103c4565b60408051601f19818403018152918152602080830180516001600160e01b031663a224cee760e01b179052905161014493929101610435565b60408051601f19818403018152908290526101629291602001610477565b60405160208183030381529060405280519060200120610288565b90505b92915050565b60008061019384846100af565b90506001600160a01b0381163b80156101ae57509050610180565b837f0000000000000000000000000000000000000000000000000000000000000000866040516024016101e191906103c4565b60408051601f198184030181529181526020820180516001600160e01b031663a224cee760e01b17905251610215906102ba565b610220929190610435565b8190604051809103906000f5905080158015610240573d6000803e3d6000fd5b506040516001600160a01b03841681529093507f6885f8a96880e6e539a4b958e66d1baee586f1d4188fee5b68e8bad2ce1ef0899060200160405180910390a1505092915050565b600061017d8383306000604051836040820152846020820152828152600b8101905060ff815360559020949350505050565b61040a806104a783390190565b634e487b7160e01b600052604160045260246000fd5b80356001600160a01b03811681146102f457600080fd5b919050565b6000806040838503121561030c57600080fd5b823567ffffffffffffffff8082111561032457600080fd5b818501915085601f83011261033857600080fd5b813560208282111561034c5761034c6102c7565b8160051b604051601f19603f83011681018181108682111715610371576103716102c7565b60405292835281830193508481018201928984111561038f57600080fd5b948201945b838610156103b4576103a5866102dd565b85529482019493820193610394565b9997909101359750505050505050565b6020808252825182820181905260009190848201906040850190845b818110156104055783516001600160a01b0316835292840192918401916001016103e0565b50909695505050505050565b60005b8381101561042c578181015183820152602001610414565b50506000910152565b60018060a01b03831681526040602082015260008251806040840152610462816060850160208701610411565b601f01601f1916919091016060019392505050565b60008351610489818460208801610411565b83519083019061049d818360208801610411565b0194935050505056fe608060405260405161040a38038061040a83398101604081905261002291610268565b61002c8282610033565b5050610352565b61003c82610092565b6040516001600160a01b038316907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a280511561008657610081828261010e565b505050565b61008e610185565b5050565b806001600160a01b03163b6000036100cd57604051634c9c8ce360e01b81526001600160a01b03821660048201526024015b60405180910390fd5b7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc80546001600160a01b0319166001600160a01b0392909216919091179055565b6060600080846001600160a01b03168460405161012b9190610336565b600060405180830381855af49150503d8060008114610166576040519150601f19603f3d011682016040523d82523d6000602084013e61016b565b606091505b50909250905061017c8583836101a6565b95945050505050565b34156101a45760405163b398979f60e01b815260040160405180910390fd5b565b6060826101bb576101b682610205565b6101fe565b81511580156101d257506001600160a01b0384163b155b156101fb57604051639996b31560e01b81526001600160a01b03851660048201526024016100c4565b50805b9392505050565b8051156102155780518082602001fd5b604051630a12f52160e11b815260040160405180910390fd5b634e487b7160e01b600052604160045260246000fd5b60005b8381101561025f578181015183820152602001610247565b50506000910152565b6000806040838503121561027b57600080fd5b82516001600160a01b038116811461029257600080fd5b60208401519092506001600160401b03808211156102af57600080fd5b818501915085601f8301126102c357600080fd5b8151818111156102d5576102d561022e565b604051601f8201601f19908116603f011681019083821181831017156102fd576102fd61022e565b8160405282815288602084870101111561031657600080fd5b610327836020830160208801610244565b80955050505050509250929050565b60008251610348818460208701610244565b9190910192915050565b60aa806103606000396000f3fe6080604052600a600c565b005b60186014601a565b6051565b565b6000604c7f360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc546001600160a01b031690565b905090565b3660008037600080366000845af43d6000803e808015606f573d6000f35b3d6000fdfea2646970667358221220f038e5386f37d7c294910e36c8834558bc963a25cf018593b31ef79e0554f56964736f6c63430008140033a2646970667358221220843d2f6e15d93849836cca17f0e9e2731c1946c19e8630384ec7e610958ff26464736f6c6343000814003360c0604052306080523480156200001557600080fd5b506040516200208f3803806200208f83398101604081905262000038916200010a565b6001600160a01b03811660a0526200004f62000056565b506200013c565b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a00805468010000000000000000900460ff1615620000a75760405163f92ee8a960e01b815260040160405180910390fd5b80546001600160401b0390811614620001075780546001600160401b0319166001600160401b0390811782556040519081527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d29060200160405180910390a15b50565b6000602082840312156200011d57600080fd5b81516001600160a01b03811681146200013557600080fd5b9392505050565b60805160a051611eee620001a1600039600081816103f10152818161072c015281816107ad015281816109f601528181610b0201528181610b9a01528181610e060152610feb0152600081816112040152818161122d015261136e0152611eee6000f3fe6080604052600436106101695760003560e01c806352d1902d116100d1578063b61d27f61161008a578063d087d28811610064578063d087d2881461047f578063d547741f14610494578063e58378bb146104b4578063f23a6e61146104d657600080fd5b8063b61d27f61461041b578063bc197c811461043b578063c399ec881461046a57600080fd5b806352d1902d1461032f57806391d1485414610344578063a217fddf14610364578063a224cee714610379578063ad3cb1cc14610399578063b0d691fe146103d757600080fd5b80632f2ff15d116101235780632f2ff15d1461029457806336568abe146102b45780633a871cdd146102d45780634a58db19146102f45780634d44560d146102fc5780634f1ef2861461031c57600080fd5b806223de291461017557806301ffc9a71461019c578063150b7a02146101d15780631626ba7e1461021657806318dfb3c714610236578063248a9ca31461025657600080fd5b3661017057005b600080fd5b34801561018157600080fd5b5061019a610190366004611617565b5050505050505050565b005b3480156101a857600080fd5b506101bc6101b73660046116c7565b610503565b60405190151581526020015b60405180910390f35b3480156101dd57600080fd5b506101fd6101ec3660046116f1565b630a85bd0160e11b95945050505050565b6040516001600160e01b031990911681526020016101c8565b34801561022257600080fd5b506101fd610231366004611818565b61052e565b34801561024257600080fd5b5061019a6102513660046118a2565b6105a6565b34801561026257600080fd5b5061028661027136600461190d565b60009081526020819052604090206001015490565b6040519081526020016101c8565b3480156102a057600080fd5b5061019a6102af366004611926565b6106a1565b3480156102c057600080fd5b5061019a6102cf366004611926565b6106cc565b3480156102e057600080fd5b506102866102ef366004611956565b610704565b61019a61072a565b34801561030857600080fd5b5061019a6103173660046119a9565b6107a3565b61019a61032a3660046119d5565b610834565b34801561033b57600080fd5b50610286610853565b34801561035057600080fd5b506101bc61035f366004611926565b610870565b34801561037057600080fd5b50610286600081565b34801561038557600080fd5b5061019a610394366004611a0e565b610899565b3480156103a557600080fd5b506103ca604051806040016040528060058152602001640352e302e360dc1b81525081565b6040516101c89190611ae3565b3480156103e357600080fd5b506040516001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001681526020016101c8565b34801561042757600080fd5b5061019a610436366004611b16565b610a99565b34801561044757600080fd5b506101fd610456366004611b65565b63bc197c8160e01b98975050505050505050565b34801561047657600080fd5b50610286610ae2565b34801561048b57600080fd5b50610286610b73565b3480156104a057600080fd5b5061019a6104af366004611926565b610bc9565b3480156104c057600080fd5b50610286600080516020611e3883398151915281565b3480156104e257600080fd5b506101fd6104f1366004611c02565b63f23a6e6160e01b9695505050505050565b60006001600160e01b0319821663da8def7360e01b1480610528575061052882610bee565b92915050565b6000815160801461055a5760405162461bcd60e51b815260040161055190611c7d565b60405180910390fd5b60006105668484610c23565b9050610580600080516020611e3883398151915282610870565b156105955750630b135d3f60e11b9050610528565b506001600160e01b03199392505050565b6105ae610dfb565b8281146105f35760405162461bcd60e51b815260206004820152601360248201527277726f6e67206172726179206c656e6774687360681b6044820152606401610551565b60005b8381101561069a5761068885858381811061061357610613611ccb565b90506020020160208101906106289190611ce1565b600085858581811061063c5761063c611ccb565b905060200281019061064e9190611cfe565b8080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250610e6692505050565b8061069281611d5a565b9150506105f6565b5050505050565b6000828152602081905260409020600101546106bc81610ed6565b6106c68383610ee3565b50505050565b6001600160a01b03811633146106f55760405163334bd91960e11b815260040160405180910390fd5b6106ff8282610f75565b505050565b600061070e610fe0565b6107188484611058565b90506107238261118a565b9392505050565b7f000000000000000000000000000000000000000000000000000000000000000060405163b760faf960e01b81523060048201526001600160a01b03919091169063b760faf99034906024016000604051808303818588803b15801561078f57600080fd5b505af115801561069a573d6000803e3d6000fd5b6107ab6111d7565b7f000000000000000000000000000000000000000000000000000000000000000060405163040b850f60e31b81526001600160a01b03848116600483015260248201849052919091169063205c287890604401600060405180830381600087803b15801561081857600080fd5b505af115801561082c573d6000803e3d6000fd5b505050505050565b61083c6111f9565b6108458261129e565b61084f82826112a6565b5050565b600061085d611363565b50600080516020611e9983398151915290565b6000918252602082815260408084206001600160a01b0393909316845291905290205460ff1690565b7ff0c57e16840df040f15088dc2f81fe391c3923bec73e23a9662efc9c229c6a008054600160401b810460ff1615906001600160401b03166000811580156108de5750825b90506000826001600160401b031660011480156108fa5750303b155b905081158015610908575080155b156109265760405163f92ee8a960e01b815260040160405180910390fd5b845467ffffffffffffffff19166001178555831561095057845460ff60401b1916600160401b1785555b855160008190036109735760405162f3041560e01b815260040160405180910390fd5b60005b818160ff1610156109e5576109aa6000801b898360ff168151811061099d5761099d611ccb565b6020026020010151610ee3565b506109d2600080516020611e38833981519152898360ff168151811061099d5761099d611ccb565b50806109dd81611d73565b915050610976565b508651604080516001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016815260208101929092527ff254ba336d4ee22021c9669762cbc1dc666c532a01bd503441728c63c543ac02910160405180910390a150831561082c57845460ff60401b19168555604051600181527fc7f505b2f371ae2175ee4913f4499e1f2633a7b5936321eed1cdaeb6115181d29060200160405180910390a1505050505050565b610aa1610dfb565b6106c6848484848080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250610e6692505050565b6040516370a0823160e01b81523060048201526000906001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906370a08231906024015b602060405180830381865afa158015610b4a573d6000803e3d6000fd5b505050506040513d601f19601f82011682018060405250810190610b6e9190611d92565b905090565b604051631aab3f0d60e11b8152306004820152600060248201819052906001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016906335567e1a90604401610b2d565b600082815260208190526040902060010154610be481610ed6565b6106c68383610f75565b60006001600160e01b03198216637965db0b60e01b148061052857506301ffc9a760e01b6001600160e01b0319831614610528565b600080600080600085806020019051810190610c3f9190611dab565b9350935093509350600070014551231950b75fc4402da1732fc9bebe1980610c6957610c69611df2565b858409610c889070014551231950b75fc4402da1732fc9bebe19611e08565b9050600070014551231950b75fc4402da1732fc9bebe19868609610cbe9070014551231950b75fc4402da1732fc9bebe19611e08565b905070014551231950b75fc4402da1732fc9bebf8201610cdd57600080fd5b6040805160008082526020820180845285905260ff861692820192909252606081018890526080810183905260019060a0016020604051602081039080840390855afa158015610d31573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b038116610d875760405162461bcd60e51b815260206004820152601060248201526f1958dc9958dbdd995c8819985a5b195960821b6044820152606401610551565b6040516bffffffffffffffffffffffff19606083901b1660208201526001600160f81b031960f886901b16603482015260358101889052605581018b9052607501604051602081830303815290604052805190602001208614610deb576000610ded565b865b9a9950505050505050505050565b336001600160a01b037f0000000000000000000000000000000000000000000000000000000000000000161480610e455750610e45600080516020611e3883398151915233610870565b610e64576040516355bd2c4d60e01b8152336004820152602401610551565b565b600080846001600160a01b03168484604051610e829190611e1b565b60006040518083038185875af1925050503d8060008114610ebf576040519150601f19603f3d011682016040523d82523d6000602084013e610ec4565b606091505b50915091508161069a57805160208201fd5b610ee081336113ac565b50565b6000610eef8383610870565b610f6d576000838152602081815260408083206001600160a01b03861684529091529020805460ff19166001179055610f253390565b6001600160a01b0316826001600160a01b0316847f2f8788117e7eff1d82e926ec794901d17c78024a50270940304540a733656f0d60405160405180910390a4506001610528565b506000610528565b6000610f818383610870565b15610f6d576000838152602081815260408083206001600160a01b0386168085529252808320805460ff1916905551339286917ff6391f5c32d9c69d2a47ea670b442974b53935d1edc7fd64eb21e047a839171b9190a4506001610528565b336001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614610e645760405162461bcd60e51b815260206004820152601c60248201527f6163636f756e743a206e6f742066726f6d20456e747279506f696e74000000006044820152606401610551565b600080611069610140850185611cfe565b8080601f0160208091040260200160405190810160405280939291908181526020018383808284376000920191909152505060408051608081019091526041808252939450929150611e5890506020830139805190602001208180519060200120036110d9576001915050610528565b6110e7610140850185611cfe565b90506080146111085760405162461bcd60e51b815260040161055190611c7d565b60006111568461111c610140880188611cfe565b8080601f016020809104026020016040519081016040528093929190818152602001838380828437600092019190915250610c2392505050565b9050611170600080516020611e3883398151915282610870565b61117f57600192505050610528565b506000949350505050565b8015610ee057604051600090339060001990849084818181858888f193505050503d806000811461069a576040519150601f19603f3d011682016040523d82523d6000602084013e61069a565b333014610e645760405163bbe0361b60e01b8152336004820152602401610551565b306001600160a01b037f000000000000000000000000000000000000000000000000000000000000000016148061128057507f00000000000000000000000000000000000000000000000000000000000000006001600160a01b0316611274600080516020611e99833981519152546001600160a01b031690565b6001600160a01b031614155b15610e645760405163703e46dd60e11b815260040160405180910390fd5b610ee06111d7565b816001600160a01b03166352d1902d6040518163ffffffff1660e01b8152600401602060405180830381865afa925050508015611300575060408051601f3d908101601f191682019092526112fd91810190611d92565b60015b61132857604051634c9c8ce360e01b81526001600160a01b0383166004820152602401610551565b600080516020611e99833981519152811461135957604051632a87526960e21b815260048101829052602401610551565b6106ff83836113e5565b306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614610e645760405163703e46dd60e11b815260040160405180910390fd5b6113b68282610870565b61084f5760405163e2517d3f60e01b81526001600160a01b038216600482015260248101839052604401610551565b6113ee8261143b565b6040516001600160a01b038316907fbc7cd75a20ee27fd9adebab32041f755214dbc6bffa90cc0225b39da2e5c2d3b90600090a2805115611433576106ff82826114a0565b61084f611516565b806001600160a01b03163b60000361147157604051634c9c8ce360e01b81526001600160a01b0382166004820152602401610551565b600080516020611e9983398151915280546001600160a01b0319166001600160a01b0392909216919091179055565b6060600080846001600160a01b0316846040516114bd9190611e1b565b600060405180830381855af49150503d80600081146114f8576040519150601f19603f3d011682016040523d82523d6000602084013e6114fd565b606091505b509150915061150d858383611535565b95945050505050565b3415610e645760405163b398979f60e01b815260040160405180910390fd5b60608261154a5761154582611591565b610723565b815115801561156157506001600160a01b0384163b155b1561158a57604051639996b31560e01b81526001600160a01b0385166004820152602401610551565b5080610723565b8051156115a15780518082602001fd5b604051630a12f52160e11b815260040160405180910390fd5b6001600160a01b0381168114610ee057600080fd5b60008083601f8401126115e157600080fd5b5081356001600160401b038111156115f857600080fd5b60208301915083602082850101111561161057600080fd5b9250929050565b60008060008060008060008060c0898b03121561163357600080fd5b883561163e816115ba565b9750602089013561164e816115ba565b9650604089013561165e816115ba565b95506060890135945060808901356001600160401b038082111561168157600080fd5b61168d8c838d016115cf565b909650945060a08b01359150808211156116a657600080fd5b506116b38b828c016115cf565b999c989b5096995094979396929594505050565b6000602082840312156116d957600080fd5b81356001600160e01b03198116811461072357600080fd5b60008060008060006080868803121561170957600080fd5b8535611714816115ba565b94506020860135611724816115ba565b93506040860135925060608601356001600160401b0381111561174657600080fd5b611752888289016115cf565b969995985093965092949392505050565b634e487b7160e01b600052604160045260246000fd5b604051601f8201601f191681016001600160401b03811182821017156117a1576117a1611763565b604052919050565b600082601f8301126117ba57600080fd5b81356001600160401b038111156117d3576117d3611763565b6117e6601f8201601f1916602001611779565b8181528460208386010111156117fb57600080fd5b816020850160208301376000918101602001919091529392505050565b6000806040838503121561182b57600080fd5b8235915060208301356001600160401b0381111561184857600080fd5b611854858286016117a9565b9150509250929050565b60008083601f84011261187057600080fd5b5081356001600160401b0381111561188757600080fd5b6020830191508360208260051b850101111561161057600080fd5b600080600080604085870312156118b857600080fd5b84356001600160401b03808211156118cf57600080fd5b6118db8883890161185e565b909650945060208701359150808211156118f457600080fd5b506119018782880161185e565b95989497509550505050565b60006020828403121561191f57600080fd5b5035919050565b6000806040838503121561193957600080fd5b82359150602083013561194b816115ba565b809150509250929050565b60008060006060848603121561196b57600080fd5b83356001600160401b0381111561198157600080fd5b8401610160818703121561199457600080fd5b95602085013595506040909401359392505050565b600080604083850312156119bc57600080fd5b82356119c7816115ba565b946020939093013593505050565b600080604083850312156119e857600080fd5b82356119f3816115ba565b915060208301356001600160401b0381111561184857600080fd5b60006020808385031215611a2157600080fd5b82356001600160401b0380821115611a3857600080fd5b818501915085601f830112611a4c57600080fd5b813581811115611a5e57611a5e611763565b8060051b9150611a6f848301611779565b8181529183018401918481019088841115611a8957600080fd5b938501935b83851015611ab35784359250611aa3836115ba565b8282529385019390850190611a8e565b98975050505050505050565b60005b83811015611ada578181015183820152602001611ac2565b50506000910152565b6020815260008251806020840152611b02816040850160208701611abf565b601f01601f19169190910160400192915050565b60008060008060608587031215611b2c57600080fd5b8435611b37816115ba565b93506020850135925060408501356001600160401b03811115611b5957600080fd5b611901878288016115cf565b60008060008060008060008060a0898b031215611b8157600080fd5b8835611b8c816115ba565b97506020890135611b9c816115ba565b965060408901356001600160401b0380821115611bb857600080fd5b611bc48c838d0161185e565b909850965060608b0135915080821115611bdd57600080fd5b611be98c838d0161185e565b909650945060808b01359150808211156116a657600080fd5b60008060008060008060a08789031215611c1b57600080fd5b8635611c26816115ba565b95506020870135611c36816115ba565b9450604087013593506060870135925060808701356001600160401b03811115611c5f57600080fd5b611c6b89828a016115cf565b979a9699509497509295939492505050565b6020808252602e908201527f4d756c7469536967536d6172744163636f756e743a20696e76616c696420736960408201526d0cedcc2e8eae4ca40d8cadccee8d60931b606082015260800190565b634e487b7160e01b600052603260045260246000fd5b600060208284031215611cf357600080fd5b8135610723816115ba565b6000808335601e19843603018112611d1557600080fd5b8301803591506001600160401b03821115611d2f57600080fd5b60200191503681900382131561161057600080fd5b634e487b7160e01b600052601160045260246000fd5b600060018201611d6c57611d6c611d44565b5060010190565b600060ff821660ff8103611d8957611d89611d44565b60010192915050565b600060208284031215611da457600080fd5b5051919050565b60008060008060808587031215611dc157600080fd5b845193506020850151925060408501519150606085015160ff81168114611de757600080fd5b939692955090935050565b634e487b7160e01b600052601260045260246000fd5b8181038181111561052857610528611d44565b60008251611e2d818460208701611abf565b919091019291505056feb19546dff01e856fb3f010c267a7b1c60363cf8a4664e21cc89c26224620214efffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbca26469706673582212205fec409cc1d1cfbbba98bc9337bd826a5d4a052bff2b5aa8100d35277b32c36964736f6c63430008140033";

type MultiSigSmartAccountFactoryConstructorParams =
  | [signer?: Signer]
  | ConstructorParameters<typeof ContractFactory>;

const isSuperArgs = (
  xs: MultiSigSmartAccountFactoryConstructorParams
): xs is ConstructorParameters<typeof ContractFactory> => xs.length > 1;

export class MultiSigSmartAccountFactory__factory extends ContractFactory {
  constructor(...args: MultiSigSmartAccountFactoryConstructorParams) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }

  override getDeployTransaction(
    _entryPoint: AddressLike,
    _salt: BytesLike,
    overrides?: NonPayableOverrides & { from?: string }
  ): Promise<ContractDeployTransaction> {
    return super.getDeployTransaction(_entryPoint, _salt, overrides || {});
  }
  override deploy(
    _entryPoint: AddressLike,
    _salt: BytesLike,
    overrides?: NonPayableOverrides & { from?: string }
  ) {
    return super.deploy(_entryPoint, _salt, overrides || {}) as Promise<
      MultiSigSmartAccountFactory & {
        deploymentTransaction(): ContractTransactionResponse;
      }
    >;
  }
  override connect(
    runner: ContractRunner | null
  ): MultiSigSmartAccountFactory__factory {
    return super.connect(runner) as MultiSigSmartAccountFactory__factory;
  }

  static readonly bytecode = _bytecode;
  static readonly abi = _abi;
  static createInterface(): MultiSigSmartAccountFactoryInterface {
    return new Interface(_abi) as MultiSigSmartAccountFactoryInterface;
  }
  static connect(
    address: string,
    runner?: ContractRunner | null
  ): MultiSigSmartAccountFactory {
    return new Contract(
      address,
      _abi,
      runner
    ) as unknown as MultiSigSmartAccountFactory;
  }
}

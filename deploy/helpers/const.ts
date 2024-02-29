export const ENTRY_POINT_ALCHEMY_ADDRESS = "0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789"

export enum TAGS {
  FULL = "FULL",
  TEST = "TEST",
  ACCOUNT_FACTORY = "ACCOUNT_FACTORY",
  ACCOUNT = "ACCOUNT",
}

export const getEntryPointByChainId = (chainId: string | undefined): string | undefined => {
  switch (chainId) {
    case "1": {
      // mainnet
      return ENTRY_POINT_ALCHEMY_ADDRESS
    }
    case "11155111": {
      // sepolia
      return ENTRY_POINT_ALCHEMY_ADDRESS
    }
    case "137": {
      // polygon
      return ENTRY_POINT_ALCHEMY_ADDRESS
    }
    case "80001": {
      // mumbai
      return ENTRY_POINT_ALCHEMY_ADDRESS
    }
    case "31337": {
      // hardhat
      return ENTRY_POINT_ALCHEMY_ADDRESS
    }

    default: {
      throw new Error("Wrong chainId")
    }
  }
}

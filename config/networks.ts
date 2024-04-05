export enum KNOWN_ACCOUNT {
  DEPLOYER = "deployer",
  SIGNER = "signer",
}

export enum CHAIN_NAMES {
  ARBITRUM_MAINNET = "arbitrum-mainnet",
  AVALANCHE = "avalanche",
  GANACHE = "ganache",
  HARDHAT = "hardhat",
  ETHEREUM_MAINNET = "mainnet",
  ETHEREUM_SEPOLIA = "sepolia",
  POLYGON_MAINNET = "polygon-mainnet",
  POLYGON_MUMBAI = "polygon-mumbai",
  POLYGON_AMOY = "polygon-amoy",
}

export const CHAIN_IDS = {
  [CHAIN_NAMES.ARBITRUM_MAINNET]: 42_161,
  [CHAIN_NAMES.AVALANCHE]: 43_114,
  [CHAIN_NAMES.GANACHE]: 1337,
  [CHAIN_NAMES.HARDHAT]: 31_337,
  [CHAIN_NAMES.ETHEREUM_MAINNET]: 1,
  [CHAIN_NAMES.POLYGON_MAINNET]: 137,
  [CHAIN_NAMES.POLYGON_MUMBAI]: 80_001,
  [CHAIN_NAMES.POLYGON_AMOY]: 80_002,
  [CHAIN_NAMES.ETHEREUM_SEPOLIA]: 11_155_111,
}

export enum KNOWN_NETWORK {
  ETHEREUM_MAINNET = CHAIN_NAMES.ETHEREUM_MAINNET,
  ETHEREUM_SEPOLIA = CHAIN_NAMES.ETHEREUM_SEPOLIA,
  POLYGON_MAINNET = CHAIN_NAMES.POLYGON_MAINNET,
  POLYGON_MUMBAI = CHAIN_NAMES.POLYGON_MUMBAI,
  POLYGON_AMOY = CHAIN_NAMES.POLYGON_AMOY,
}

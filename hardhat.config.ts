import dotenv from "dotenv"

import { HardhatUserConfig } from "hardhat/config"

import '@nomicfoundation/hardhat-ethers'
import "@nomicfoundation/hardhat-verify"
import "@nomicfoundation/hardhat-network-helpers"
import "@nomicfoundation/hardhat-chai-matchers"

import "@typechain/hardhat"

import "hardhat-deploy"
import "hardhat-abi-exporter"
import "hardhat-dependency-compiler"

import { CHAIN_IDS, CHAIN_NAMES, KNOWN_ACCOUNT, KNOWN_NETWORK } from "./config/networks"

dotenv.config()

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  typechain: {
    outDir: "src/typechain",
    target: "ethers-v6",
  },

  defaultNetwork: "hardhat",

  networks: {
    hardhat: {
      chainId: 1337,
      loggingEnabled: false,
    },
    [KNOWN_NETWORK.ETHEREUM_MAINNET]: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ETHEREUM_MAINNET_ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      chainId: CHAIN_IDS[CHAIN_NAMES.ETHEREUM_MAINNET],
    },
    [KNOWN_NETWORK.ETHEREUM_SEPOLIA]: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ETHEREUM_SEPOLIA_ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      chainId: CHAIN_IDS[CHAIN_NAMES.ETHEREUM_SEPOLIA],
    },
    [KNOWN_NETWORK.POLYGON_MAINNET]: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.POLYGON_MAINNET_ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      chainId: CHAIN_IDS[CHAIN_NAMES.POLYGON_MAINNET],
    },
    [KNOWN_NETWORK.POLYGON_AMOY]: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${process.env.POLYGON_AMOY_ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`], // use if want to use private account; important! use `0x` prefix
      chainId: CHAIN_IDS[CHAIN_NAMES.POLYGON_AMOY],
    },
    [KNOWN_NETWORK.BINANCE_SMART_CHAIN]: {
      url: `https://rpc.etherspot.io/v1/56?api-key=${process.env.BINANCE_SMART_CHAIN_ETHERSPOT_API_KEY}`,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      chainId: CHAIN_IDS[CHAIN_NAMES.BINANCE_SMART_CHAIN],
    },
    [KNOWN_NETWORK.BASE_CHAIN]: {
      url: `https://base-mainnet.g.alchemy.com/v2/${process.env.BASE_CHAIN_ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      chainId: CHAIN_IDS[CHAIN_NAMES.BASE_CHAIN],
    },
    [KNOWN_NETWORK.AVALANCHE]: {
      url: `https://avax-mainnet.g.alchemy.com/v2/${process.env.AVALANCHE_ALCHEMY_API_KEY}`,
      accounts: [`0x${process.env.DEPLOYER_PRIVATE_KEY}`],
      chainId: CHAIN_IDS[CHAIN_NAMES.AVALANCHE],
      loggingEnabled: true,
    },
  },

  paths: {
    cache: "cache",
    sources: "contracts",
    artifacts: "artifacts",
    tests: "test",
    deploy: "deploy",
    deployments: "deployments",
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY ?? "",
      sepolia: process.env.ETHERSCAN_API_KEY ?? "",
      polygon: process.env.POLYGONSCAN_API_KEY ?? "",
      polygonAmoy: process.env.POLYGONSCAN_API_KEY ?? "",
      bsc: process.env.BSCSCAN_API_KEY ?? "",
      base: process.env.BASESCAN_API_KEY ?? "",
      avalanche: process.env.AVALANCHE_API_KEY ?? "",
    },
  },
  namedAccounts: {
    [KNOWN_ACCOUNT.DEPLOYER]: 0,
  },
  abiExporter: {
    path: "./src/abi",
    runOnCompile: true,
    clear: true,
    flat: true,
    spacing: 2,
    format: "json",
  },
  sourcify: {
    enabled: true,
  },
}

export default config

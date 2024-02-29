import dotenv from "dotenv"

import { HardhatUserConfig } from "hardhat/config"
import "@nomiclabs/hardhat-ethers"
import "@nomicfoundation/hardhat-verify"
import "@nomicfoundation/hardhat-chai-matchers"
import "@nomicfoundation/hardhat-network-helpers"
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
    target: "ethers-v5",
  },

  defaultNetwork: "hardhat",

  networks: {
    [KNOWN_NETWORK.ETHEREUM_MAINNET]: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${process.env.ETHEREUM_MAINNET_ALCHEMY_API_KEY}`,
      accounts: [`${process.env.DEPLOYER_PRIVATE_KEY}`],
      chainId: CHAIN_IDS[CHAIN_NAMES.ETHEREUM_MAINNET],
    },
    [KNOWN_NETWORK.ETHEREUM_SEPOLIA]: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ETHEREUM_SEPOLIA_ALCHEMY_API_KEY}`,
      accounts: [`${process.env.DEPLOYER_PRIVATE_KEY}`],
      chainId: CHAIN_IDS[CHAIN_NAMES.ETHEREUM_SEPOLIA],
    },
    [KNOWN_NETWORK.POLYGON_MAINNET]: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.POLYGON_MAINNET_ALCHEMY_API_KEY}`,
      accounts: [`${process.env.DEPLOYER_PRIVATE_KEY}`],
      chainId: CHAIN_IDS[CHAIN_NAMES.POLYGON_MAINNET],
    },
    [KNOWN_NETWORK.POLYGON_MUMBAI]: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/${process.env.POLYGON_MUMBAI_ALCHEMY_API_KEY}`,
      accounts: [`${process.env.DEPLOYER_PRIVATE_KEY}`],
      chainId: CHAIN_IDS[CHAIN_NAMES.POLYGON_MUMBAI],
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
      polygonMumbai: process.env.POLYGONSCAN_API_KEY ?? "",
    },
  },
  namedAccounts: {
    [KNOWN_ACCOUNT.DEPLOYER]: {
      default: 0,
      [KNOWN_NETWORK.ETHEREUM_MAINNET]: `${process.env.DEPLOYER_ADDRESS}`,
      [KNOWN_NETWORK.ETHEREUM_SEPOLIA]: `${process.env.DEPLOYER_ADDRESS}`,
      [KNOWN_NETWORK.POLYGON_MAINNET]: `${process.env.DEPLOYER_ADDRESS}`,
      [KNOWN_NETWORK.POLYGON_MUMBAI]: `${process.env.DEPLOYER_ADDRESS}`,
    },
  },
  abiExporter: {
    path: "./src/abi",
    runOnCompile: true,
    clear: true,
    flat: true,
    spacing: 2,
    format: "json",
  },
}

export default config

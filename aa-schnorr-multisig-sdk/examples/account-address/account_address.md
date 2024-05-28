## Get Smart Account Address (Off-Chain/On-Chain)


### Step 1: Generate 3 random Private Key's
```typescript
import secp256k1 from "secp256k1"
import { randomBytes } from "ethers"

let privKey
do privKey = randomBytes(32)
while (!secp256k1.privateKeyVerify(privKey))
```

### Step 2: Create Schnorr Signer
```typescript
const schnorrSigner3 = createSchnorrSigner(privKey)
```

### Step 3: Get Combined Addresses based on Public Key's
```typescript
const publicKey = schnorrSigner.getPubKey()


const combinedAddresses = getAllCombinedAddrFromKeys([publicKey,...,publikKeyN], M)
```

### Step 4: Chose Smart Account salt
```typescript
const salt = "random salt for randomly generated priv keys"
```
### Step 5: Get Smart Account Address
To get Smart Account you will need to provide following arguments:
* Ethers provider *[ONLY On-Chain]* (in example we creating provider with Alchemy url to read call smart account factory method)
* Smart Account Factory Address (check Deployment's to provide address for appropriate chain)
* Smart Account Factory salt *[ONLY Off-Chain]*
* Combined addresses of all participating parties
* Smart Account salt
### Step 5.a: Get Smart Account Address On-Chain

```typescript
async function getAddressOnChain(combinedAddresses: string[], salt: string) {
    // You can find deployed Factory address for chain in ./src/generated/deployments
    const factoryAddress = "0x..."
    // Current example using Sepolia deployed Smart Account factory
    const rpcUrl = "https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}"

    // Ethers Provider used to read-call Smart Account factory
    const provider = new JsonRpcProvider(rpcUrl)
    return predictAccountAddrOnchain(factoryAddress, combinedAddresses, salt, provider)
}

getAddressOffChain(combinedAddresses, salt)
```
### Step 5.b: Get Smart Account Address On-Chain (Alchemy AA SDK)
To get address through Smart Account Alchemy SDK we need to create instance of Smart Account.
Alchemy AA SDK also read-call Smart Account factory On-Chain as ***5.a*** but only on instance init, so later on you can use cached value.
```typescript
import { getEntryPoint, sepolia } from "@alchemy/aa-core"

async function getAddressAlchemyAASDK(combinedAddresses: Address[], salt: string) {
    // Current example using Sepolia deployed Smart Account factory
    const rpcUrl = "https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}"
    const transport = http(rpcUrl)
    
    // no factoryAddress value, because it's already used in createMultiSigSmartAccount function
    const multiSigSmartAccount = await createMultiSigSmartAccount({
        transport,
        chain: sepolia,
        combinedAddress: combinedAddresses,
        salt: saltToHex(salt),
        entryPoint: getEntryPoint(sepolia),
    })

    return multiSigSmartAccount.address
}

getAddressAlchemyAASDK(combinedAddresses, salt)
```

### Step 5.c: Get Smart Account Address Off-Chain

```typescript
function getAddressOffChain(combinedAddresses: string[], salt: string) {
    // Smart Account factory salt value should be known at deploy time
    const factorySalt = ""
    // You can find deployed Factory address for chain in ./src/generated/deployments
    const factoryAddress = "0x"
    const accountImplementationAddress = predictAccountImplementationAddrOffchain(factorySalt, factoryAddress, ENTRY_POINT_ALCHEMY_ADDRESS)

    return predictAccountAddrOffchain(factoryAddress, accountImplementationAddress, combinedAddresses, salt)
}
getAddressOffChain(combinedAddresses, salt)
```

Use assosiated script to run all 

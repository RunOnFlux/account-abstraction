## Get Smart Account Address (Off-Chain/On-Chain)

### Step 1: Generate 3 Random Private Keys
```typescript
import secp256k1 from "secp256k1";
import { randomBytes } from "ethers";

let privKey;
do {
    privKey = randomBytes(32);
} while (!secp256k1.privateKeyVerify(privKey));
```

### Step 2: Create Schnorr Signer
```typescript
const schnorrSigner3 = createSchnorrSigner(privKey);
```

### Step 3: Get Combined Addresses Based on Public Keys
```typescript
const publicKey = schnorrSigner.getPubKey();
const combinedAddresses = getAllCombinedAddrFromKeys([publicKey, ..., publicKeyN], M);
```

### Step 4: Choose Smart Account Salt
SSP is using 'aasalt'
```typescript
const salt = "aasalt"; // SSP is using 'aasalt', usage of different salt will lead to different multisignature address
```

### Step 5: Get Smart Account Address
To get a Smart Account, you will need to provide the following arguments:
- Ethers provider *[ONLY On-Chain]* (in the example, we create a provider with an Alchemy URL to read-call the smart account factory method)
- Smart Account Factory Address (check deployments to provide the address for the appropriate chain)
- Smart Account Factory salt *[ONLY Off-Chain]*
- Combined addresses of all participating parties
- Smart Account salt

### Step 5.a: Get Smart Account Address On-Chain
```typescript
async function getAddressOnChain(combinedAddresses: string[], salt: string) {
    // You can find the deployed Factory address for the chain in ./src/generated/deployments
    const factoryAddress = "0x3974821943e9cA3549744D910999332eE387Fda4";
    // Current example using Sepolia deployed Smart Account factory
    const rpcUrl = "https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}";

    // Ethers Provider used to read-call Smart Account factory
    const provider = new JsonRpcProvider(rpcUrl);
    return predictAccountAddrOnchain(factoryAddress, combinedAddresses, salt, provider);
}

getAddressOnChain(combinedAddresses, salt);
```

### Step 5.b: Get Smart Account Address On-Chain (Alchemy AA SDK)
To get the address through the Smart Account Alchemy SDK, we need to create an instance of Smart Account.
Alchemy AA SDK also read-calls the Smart Account factory On-Chain as in ***5.a*** but only on instance init, so later on you can use the cached value.
```typescript
import { getEntryPoint, sepolia } from "@alchemy/aa-core";

async function getAddressAlchemyAASDK(combinedAddresses: Address[], salt: string) {
    // Current example using Sepolia deployed Smart Account factory
    const rpcUrl = "https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}";
    const transport = http(rpcUrl);
    
    // No factoryAddress value, because it's already used in createMultiSigSmartAccount function
    const multiSigSmartAccount = await createMultiSigSmartAccount({
        transport,
        chain: sepolia,
        combinedAddress: combinedAddresses,
        salt: saltToHex(salt),
        entryPoint: getEntryPoint(sepolia),
    });

    return multiSigSmartAccount.address;
}

getAddressAlchemyAASDK(combinedAddresses, salt);
```

### Step 5.c: Get Smart Account Address Off-Chain
```typescript
function getAddressOffChain(combinedAddresses: string[], salt: string) {
    // Smart Account factory salt value should be known at deploy time
    const factorySalt = "aafactorysalt";
    // You can find the deployed Factory address for the chain in ./src/generated/deployments
    const factoryAddress = "0x3974821943e9cA3549744D910999332eE387Fda4";
    const accountImplementationAddress = predictAccountImplementationAddrOffchain(factorySalt, factoryAddress, ENTRY_POINT_ALCHEMY_ADDRESS);

    return predictAccountAddrOffchain(factoryAddress, accountImplementationAddress, combinedAddresses, salt);
}

getAddressOffChain(combinedAddresses, salt);
```

Use the associated script to run all.
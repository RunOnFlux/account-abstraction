## Native transfer with User Operation

> [!NOTE]
> Current demo extends demo [Transfer ERC20](../transfer-erc20/transfer-erc20.md). Please refer to docs.

#### Build User Operation

User Operation transfering native token require `value` field of `uo`, and `target` address of recipient.

```typescript
/**
 * Build User Operation with ETH/Matic value
 */
const signerAddress1 = schnorrSigner1.getAddress() as Hex
const uoStruct = await smartAccountClient.buildUserOperation({
    account: multiSigSmartAccount,
    uo: {
        data: "0x",
        target: signerAddress1,
        value: parseUnits("0.01", 18),
    },
})
```

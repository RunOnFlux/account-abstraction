## Native Transfer with User Operation

> [!NOTE]
> This demo extends the demo [Transfer ERC20](../transfer-erc20/transfer-erc20.md). Please refer to the documentation for more details.

### Build User Operation

Transferring native tokens using a User Operation requires specifying the `value` field in the `uo` (User Operation) and the `target` address of the recipient.

```typescript
/**
 * Build User Operation with ETH/Matic value
 */
const signerAddress1 = schnorrSigner1.getAddress() as Hex;
const uoStruct = await smartAccountClient.buildUserOperation({
    account: multiSigSmartAccount,
    uo: {
        data: "0x", // No calldata needed for native transfers
        target: signerAddress1, // Recipient address
        value: parseUnits("0.01", 18), // Amount to transfer
    },
});
```

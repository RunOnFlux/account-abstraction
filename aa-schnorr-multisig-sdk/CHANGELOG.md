# Changelog — @runonflux/aa-schnorr-multisig-sdk

## 1.5.0

Security hardening (SSP security review 2026-10). The public API is backward
compatible: every new option is optional, existing methods keep their
signatures. The contracts are unchanged.

### Nonce single use (AA-7 / EVM-10)

- The in-memory used-nonce guard is keyed by the signer's own **public nonce**
  only (previously `hash(privateKey) + nonce`), so a nonce pair can no longer
  be replayed under a different signing key (e.g. a relay-chosen
  `addressIndex` / `vaultIndex`). The pair is burned before the partial
  signature is computed.
- New optional persistent burned-nonce ledger: `new Schnorrkel({ nonceStore })`
  / `createSchnorrSigner(privKey, { nonceStore })` with
  `isNonceBurned(kPublicHex)` / `markNonceBurned(kPublicHex)` (async). New
  `multiSigSignAsync` / `multiSigSignHashAsync` / `restorePublicNoncesAsync`
  (and `signMultiSigMsgAsync` / `signMultiSigHashAsync` /
  `restorePubNoncesAsync` on `SchnorrSigner`) consult the ledger and persist
  the burn before signing; if `markNonceBurned` rejects, nothing is signed.
  With a store configured, the synchronous signing methods throw.
- New `MultiSigUserOp.signMultiSigHashAsync(signer)`, the async counterpart of
  `MultiSigUserOp.signMultiSigHash`, so EVM sends can adopt
  `createSchnorrSigner(privKey, { nonceStore })`. It records the partial
  signature on the op only after the store has burned the pair. The sync
  `MultiSigUserOp.signMultiSigHash` is unchanged for signers without a store;
  for a store-configured signer it throws and records nothing. Switch every
  signing call to the async variants when you adopt the store.

### MuSig2 hardening (AA-6)

- A signer refuses to sign for a key list that does not contain its own key,
  for duplicate keys, for a nonce/key count mismatch, or when the combined key
  does not match the key list.
- Public keys are normalised to compressed form before aggregation
  (`_normalizePublicKey`); `_generateL` no longer sorts the caller's array in
  place and `_concatTypedArrays` handles keys of any length. Callers that
  already pass compressed keys (all SSP apps) get identical results.
- New `Schnorrkel.verifyPartialSignatureHash` and
  `Schnorrkel.sumVerifiedSigsHash`; `MultiSigUserOp.getSummedSigData`
  verifies every partial signature and throws
  `Invalid partial signature from signer <address>` instead of producing an
  invalid aggregate.

### Owner lists (AA-4 / AA-8, SDK side)

- `predictAccountAddrOffchain`, `predictAccountAddrOnchain`,
  `predictAccountAddress` and `createMultiSigSmartAccount` refuse owner lists
  that are empty, contain the zero address, duplicates or invalid addresses,
  or have more than 255 entries (`helpers.ownerHelpers.validateAccountOwners`).
- The combination helpers (`getAllCombinedAddrFromKeys[Strict]`,
  `getAllCombinedAddrFromSigners[Strict]`, `getAllCombinedPubKeysFromSigners`)
  throw before generating more than 255 combinations
  (`countOwnerCombinations`, `MAX_ACCOUNT_OWNERS`).

### Fixed

- `SchnorrSigner.hasNonces()` looked nonces up by the public key and always
  returned false.

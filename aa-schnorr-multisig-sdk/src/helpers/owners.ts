import { ethers } from "ethers"

/**
 * MultiSigSmartAccount.initialize iterates owners with a `uint8` counter, so an
 * owner list longer than 255 makes the counterfactual address undeployable
 * (funds sent to it are stuck). AA-8.
 */
export const MAX_ACCOUNT_OWNERS = 255

/** n choose k, stopping early once the result exceeds `cap`. */
function binomialCapped(n: number, k: number, cap: number): number {
  if (k < 0 || k > n) return 0
  const kk = Math.min(k, n - k)
  let result = 1
  for (let i = 1; i <= kk; i++) {
    result = (result * (n - kk + i)) / i
    if (result > cap) return cap + 1
  }
  return Math.round(result)
}

/**
 * Number of owner combinations the combination helpers produce for `keyCount`
 * keys: combinations of size >= x (default), or exactly x when `exact`.
 * Returns MAX_ACCOUNT_OWNERS + 1 as soon as the count exceeds the cap.
 */
export function countOwnerCombinations(keyCount: number, x: number = 1, exact: boolean = false): number {
  if (!Number.isInteger(keyCount) || keyCount < 0) throw new Error("Invalid key count")
  if (!Number.isInteger(x)) throw new Error("Invalid combination size")
  const cap = MAX_ACCOUNT_OWNERS
  if (exact) return binomialCapped(keyCount, x, cap)
  let total = 0
  for (let k = Math.max(x, 0); k <= keyCount; k++) {
    total += binomialCapped(keyCount, k, cap)
    if (total > cap) return cap + 1
  }
  return total
}

/**
 * Throws before any combination is generated if the resulting owner list
 * could not be deployed (> MAX_ACCOUNT_OWNERS entries).
 */
export function assertOwnerCombinationCount(keyCount: number, x: number = 1, exact: boolean = false): void {
  const count = countOwnerCombinations(keyCount, x, exact)
  if (count > MAX_ACCOUNT_OWNERS) {
    throw new Error(
      `Too many owner combinations for ${keyCount} keys (${exact ? "exactly" : "at least"} ${x} of ${keyCount}): ` +
        `more than ${MAX_ACCOUNT_OWNERS}. MultiSigSmartAccount.initialize would revert (uint8 owner loop), ` +
        "so the account address would be undeployable."
    )
  }
}

/**
 * Validate a MultiSigSmartAccount owner list before an address or initCode is
 * computed from it (AA-4 / AA-8): 1..255 entries, each a valid 20-byte
 * address, none the zero address (the on-chain verifier returns address(0) on
 * a failed Schnorr check, so a zero owner would accept garbage signatures),
 * and no duplicates. Returns the list unchanged.
 */
export function validateAccountOwners<T extends string>(owners: readonly T[]): readonly T[] {
  if (!Array.isArray(owners) || owners.length === 0) throw new Error("At least one account owner is required")
  if (owners.length > MAX_ACCOUNT_OWNERS) {
    throw new Error(`Too many account owners (${owners.length} > ${MAX_ACCOUNT_OWNERS}): the account would be undeployable`)
  }
  const seen = new Set<string>()
  owners.forEach((owner) => {
    if (typeof owner !== "string" || !ethers.isAddress(owner) || !/^0x[0-9a-fA-F]{40}$/.test(owner)) {
      throw new Error(`Invalid account owner address: ${String(owner)}`)
    }
    const normalized = owner.toLowerCase()
    if (normalized === ethers.ZeroAddress) throw new Error("The zero address cannot be an account owner")
    if (seen.has(normalized)) throw new Error(`Duplicate account owner: ${owner}`)
    seen.add(normalized)
  })
  return owners
}

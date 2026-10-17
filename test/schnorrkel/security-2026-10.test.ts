// Regression tests for the 2026-10 security review of the Schnorr multisig SDK:
//  AA-6  signer membership, per-signer partial-signature verification, key normalisation
//  AA-7 / EVM-10  nonce single-use (public-nonce keyed guard + persistent burned-nonce store)
//  AA-8  owner-combination cap (uint8 owner loop in initialize)
//  AA-4  (SDK side) owner lists with the zero address / duplicates are refused
import { expect } from "chai"
import { ethers } from "ethers"
import secp256k1 from "secp256k1"
import type { UserOperationStruct_v6 } from "@alchemy/aa-core"

import { _aCoefficient, _generateL, _generateNonce, generateRandomKeys } from "../../aa-schnorr-multisig-sdk/src/core"
import {
  createSchnorrSigner,
  getAllCombinedAddrFromKeys,
  getAllCombinedAddrFromKeysStrict,
} from "../../aa-schnorr-multisig-sdk/src/helpers/schnorr-helpers"
import { predictAccountAddrOffchain } from "../../aa-schnorr-multisig-sdk/src/helpers/create2"
import { MAX_ACCOUNT_OWNERS, countOwnerCombinations, validateAccountOwners } from "../../aa-schnorr-multisig-sdk/src/helpers/owners"
import { Schnorrkel } from "../../aa-schnorr-multisig-sdk/src/signers"
import type { NonceBurnStore, SchnorrSigner } from "../../aa-schnorr-multisig-sdk/src/signers"
import { Key, SchnorrSignature } from "../../aa-schnorr-multisig-sdk/src/types"
import { MultiSigUserOp } from "../../aa-schnorr-multisig-sdk/src/userOperation/MultiSigUserOp"

const N = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141")
const mod = (a: bigint) => ((a % N) + N) % N
const inv = (a: bigint) => {
  let [t, nt, r, nr] = [BigInt(0), BigInt(1), N, mod(a)]
  while (nr) {
    const q = r / nr
    ;[t, nt] = [nt, t - q * nt]
    ;[r, nr] = [nr, r - q * nr]
  }
  return mod(t)
}
const toBig = (b: Uint8Array) => BigInt(`0x${Buffer.from(b).toString("hex")}`)

const randomPriv = () => `0x${generateRandomKeys().privateKey.toHex()}` as `0x${string}`
const randomHash = () => ethers.keccak256(ethers.randomBytes(32))

function memoryStore(): NonceBurnStore & { burned: Set<string>; marks: number } {
  const burned: Set<string> = new Set()
  const store = {
    burned,
    marks: 0,
    async isNonceBurned(kPublicHex: string) {
      return burned.has(kPublicHex)
    },
    async markNonceBurned(kPublicHex: string) {
      store.marks++
      burned.add(kPublicHex)
    },
  }
  return store
}

const keys = (count: number) => Array.from({ length: count }, () => generateRandomKeys().publicKey)

function opRequest(): UserOperationStruct_v6 {
  return {
    sender: ethers.ZeroAddress,
    nonce: BigInt(0),
    initCode: "0x",
    callData: "0x",
    callGasLimit: "0x0",
    verificationGasLimit: "0x0",
    preVerificationGas: BigInt(0),
    maxFeePerGas: BigInt(0),
    maxPriorityFeePerGas: BigInt(0),
    paymasterAndData: "0x",
    signature: "0x",
  }
}

function sumAndVerify(op: MultiSigUserOp, publicKeys: Key[]): boolean {
  const outputs = op._getSignatures()
  const summed = Schnorrkel.sumSigs(outputs.map((output) => output.signature))
  return Schnorrkel.verifyHash(summed, op.opHash, outputs[0].finalPublicNonce, Schnorrkel.getCombinedPublicKey(publicKeys))
}

describe("security 2026-10: AA-6 MuSig2 hardening", () => {
  beforeEach(() => new Schnorrkel().resetUsedNonces())

  it("refuses to sign for a key list that does not contain the signer's own key", () => {
    const signer = createSchnorrSigner(randomPriv())
    const other1 = createSchnorrSigner(randomPriv())
    const other2 = createSchnorrSigner(randomPriv())
    other1.generatePubNonces()
    const own = signer.generatePubNonces()
    expect(() => signer.signMultiSigHash(randomHash(), [other1.getPubKey(), other2.getPubKey()], [own, other1.getPubNonces()])).to.throw(
      "Signer public key is not part of the provided public keys"
    )
  })

  it("refuses duplicate public keys and a nonce/key count mismatch", () => {
    const signer = createSchnorrSigner(randomPriv())
    const other = createSchnorrSigner(randomPriv())
    other.generatePubNonces()
    const own = signer.generatePubNonces()
    expect(() =>
      signer.signMultiSigHash(randomHash(), [signer.getPubKey(), signer.getPubKey(), other.getPubKey()], [own, own, other.getPubNonces()])
    ).to.throw("Duplicate public keys provided")

    const own2 = signer.generatePubNonces()
    expect(() => signer.signMultiSigHash(randomHash(), [signer.getPubKey(), other.getPubKey()], [own2])).to.throw(
      "Exactly one public nonce pair per public key"
    )
  })

  it("normalises uncompressed keys: same aggregate, valid signature, caller array not mutated", () => {
    const a = createSchnorrSigner(randomPriv())
    const b = createSchnorrSigner(randomPriv())
    const aUncompressed = new Key(Buffer.from(secp256k1.publicKeyConvert(a.getPubKey().buffer, false)))
    const compressedSet = [a.getPubKey(), b.getPubKey()]
    const mixedSet = [aUncompressed, b.getPubKey()]
    expect(Schnorrkel.getCombinedPublicKey(mixedSet).toHex()).to.equal(Schnorrkel.getCombinedPublicKey(compressedSet).toHex())

    const buffers = [b.getPubKey().buffer, a.getPubKey().buffer]
    const before = buffers.map((x) => x.toString("hex"))
    _generateL(buffers)
    expect(buffers.map((x) => x.toString("hex"))).to.deep.equal(before)
    expect(_aCoefficient(aUncompressed.buffer, _generateL(buffers)).toString("hex")).to.equal(
      _aCoefficient(a.getPubKey().buffer, _generateL(buffers)).toString("hex")
    )

    const nonces = [a.generatePubNonces(), b.generatePubNonces()]
    const hash = randomHash()
    const sa = a.signMultiSigHash(hash, mixedSet, nonces)
    const sb = b.signMultiSigHash(hash, compressedSet, nonces)
    const summed = Schnorrkel.sumSigs([sa.signature, sb.signature])
    expect(Schnorrkel.verifyHash(summed, hash, sa.finalPublicNonce, Schnorrkel.getCombinedPublicKey(compressedSet))).to.equal(true)
  })

  it("verifies each partial signature and attributes a bad one to its signer", () => {
    const signers: SchnorrSigner[] = [
      createSchnorrSigner(randomPriv()),
      createSchnorrSigner(randomPriv()),
      createSchnorrSigner(randomPriv()),
    ]
    const publicKeys = signers.map((s) => s.getPubKey())
    const publicNonces = signers.map((s) => s.generatePubNonces())
    const hash = randomHash()
    const outputs = signers.map((s) => s.signMultiSigHash(hash, publicKeys, publicNonces))

    signers.forEach((s, index) => {
      expect(
        Schnorrkel.verifyPartialSignatureHash(outputs[index].signature, hash, s.getPubKey(), publicNonces[index], publicKeys, publicNonces)
      ).to.equal(true)
    })
    // a partial checked against the wrong signer / wrong hash fails
    expect(
      Schnorrkel.verifyPartialSignatureHash(outputs[0].signature, hash, signers[1].getPubKey(), publicNonces[1], publicKeys, publicNonces)
    ).to.equal(false)
    expect(
      Schnorrkel.verifyPartialSignatureHash(
        outputs[0].signature,
        randomHash(),
        signers[0].getPubKey(),
        publicNonces[0],
        publicKeys,
        publicNonces
      )
    ).to.equal(false)

    const partials = signers.map((s, index) => ({
      publicKey: s.getPubKey(),
      publicNonces: publicNonces[index],
      signature: outputs[index].signature,
    }))
    const summed = Schnorrkel.sumVerifiedSigsHash(hash, publicKeys, publicNonces, partials)
    expect(Schnorrkel.verifyHash(summed, hash, outputs[0].finalPublicNonce, Schnorrkel.getCombinedPublicKey(publicKeys))).to.equal(true)

    const tampered = [...partials]
    tampered[2] = { ...tampered[2], signature: new SchnorrSignature(Buffer.from(ethers.randomBytes(32))) }
    expect(() => Schnorrkel.sumVerifiedSigsHash(hash, publicKeys, publicNonces, tampered)).to.throw(
      `Invalid partial signature from signer ${signers[2].getPubKey().toHex()}`
    )
  })

  it("MultiSigUserOp.getSummedSigData refuses an invalid partial signature, naming the signer", () => {
    const one = createSchnorrSigner(randomPriv())
    const two = createSchnorrSigner(randomPriv())
    const publicKeys = [one.getPubKey(), two.getPubKey()]
    const publicNonces = [one.generatePubNonces(), two.generatePubNonces()]
    const op = new MultiSigUserOp(publicKeys, publicNonces, randomHash() as `0x${string}`, opRequest())
    op.signMultiSigHash(one)
    op.signMultiSigHash(two)
    expect(op.getSummedSigData()).to.match(/^0x[0-9a-f]+$/)

    const good = op.signatures[two.getAddress()]
    op.signatures[two.getAddress()] = { ...good, signature: new SchnorrSignature(Buffer.from(ethers.randomBytes(32))) }
    expect(() => op.getSummedSigData()).to.throw(`Invalid partial signature from signer ${two.getAddress()}`)
  })
})

describe("security 2026-10: AA-7 / EVM-10 nonce single use", () => {
  beforeEach(() => new Schnorrkel().resetUsedNonces())

  it("EVM-10: the same nonce pair is refused under a different signing key in the same process", () => {
    const victimA = createSchnorrSigner(randomPriv()) // e.g. addressIndex 0
    const victimB = createSchnorrSigner(randomPriv()) // relay-chosen addressIndex 1
    const coSigner = createSchnorrSigner(randomPriv())
    const pair = _generateNonce()
    const k = new Key(Buffer.from(pair.k))
    const kTwo = new Key(Buffer.from(pair.kTwo))

    const noncesA = [victimA.restorePubNonces(k, kTwo), coSigner.generatePubNonces()]
    victimA.signMultiSigHash(randomHash(), [victimA.getPubKey(), coSigner.getPubKey()], noncesA)

    // keyed by hash(privateKey) this used to pass for victimB
    expect(() => victimB.restorePubNonces(k, kTwo)).to.throw("Nonce has already been used and cannot be reused.")
  })

  it("reuse.js PoC: with a persistent store the 2nd and 3rd signature with a burned pair are refused across restarts", async () => {
    const store = memoryStore()
    const victimPriv = randomPriv()
    const pair = _generateNonce()
    const k = new Key(Buffer.from(pair.k))
    const kTwo = new Key(Buffer.from(pair.kTwo))

    let signatures = 0
    /* eslint-disable no-await-in-loop -- sessions are sequential restarts by design */
    for (let session = 0; session < 3; session++) {
      // simulate a service-worker / app restart: in-memory guard and signer are gone
      new Schnorrkel().resetUsedNonces()
      const victim = createSchnorrSigner(victimPriv, { nonceStore: store })
      const attacker = createSchnorrSigner(randomPriv()) // fresh nonces every session
      const publicKeys = [victim.getPubKey(), attacker.getPubKey()]
      const attackerNonces = attacker.generatePubNonces()
      if (session === 0) {
        const own = await victim.restorePubNoncesAsync(k, kTwo)
        await victim.signMultiSigHashAsync(randomHash(), publicKeys, [own, attackerNonces])
        signatures++
        expect(store.burned.has(own.kPublic.toHex())).to.equal(true)
      } else {
        // the async restore consults the store...
        let restoreError = ""
        try {
          await victim.restorePubNoncesAsync(k, kTwo)
        } catch (error) {
          restoreError = (error as Error).message
        }
        expect(restoreError).to.equal("Nonce has already been used and cannot be reused.")
        // ...and so does signing, even if the pair was restored synchronously
        const own = victim.restorePubNonces(k, kTwo)
        let signError = ""
        try {
          await victim.signMultiSigHashAsync(randomHash(), publicKeys, [own, attackerNonces])
          signatures++
        } catch (error) {
          signError = (error as Error).message
        }
        expect(signError).to.equal("Nonce has already been used and cannot be reused.")
      }
    }
    /* eslint-enable no-await-in-loop */
    expect(signatures).to.equal(1)
  })

  it("burns the nonce in the store BEFORE signing; a failing store means no signature", async () => {
    const failing: NonceBurnStore = {
      isNonceBurned: async () => false,
      markNonceBurned: async () => {
        throw new Error("disk full")
      },
    }
    const signer = createSchnorrSigner(randomPriv(), { nonceStore: failing })
    const co = createSchnorrSigner(randomPriv())
    const nonces = [signer.generatePubNonces(), co.generatePubNonces()]
    let error = ""
    try {
      await signer.signMultiSigHashAsync(randomHash(), [signer.getPubKey(), co.getPubKey()], nonces)
    } catch (error_) {
      error = (error_ as Error).message
    }
    expect(error).to.equal("disk full")
    expect(signer.hasNonces()).to.equal(false)
  })

  it("synchronous signing is refused when a persistent store is configured", () => {
    const signer = createSchnorrSigner(randomPriv(), { nonceStore: memoryStore() })
    const co = createSchnorrSigner(randomPriv())
    const nonces = [signer.generatePubNonces(), co.generatePubNonces()]
    expect(() => signer.signMultiSigHash(randomHash(), [signer.getPubKey(), co.getPubKey()], nonces)).to.throw("use multiSigSignHashAsync")
  })

  it("async signing without a store behaves like the sync path (backward compatible)", async () => {
    const a = createSchnorrSigner(randomPriv())
    const b = createSchnorrSigner(randomPriv())
    const publicKeys = [a.getPubKey(), b.getPubKey()]
    const nonces = [a.generatePubNonces(), b.generatePubNonces()]
    const hash = randomHash()
    const sa = await a.signMultiSigHashAsync(hash, publicKeys, nonces)
    const sb = b.signMultiSigHash(hash, publicKeys, nonces)
    const summed = Schnorrkel.sumSigs([sa.signature, sb.signature])
    expect(Schnorrkel.verifyHash(summed, hash, sa.finalPublicNonce, Schnorrkel.getCombinedPublicKey(publicKeys))).to.equal(true)
    expect(a.hasNonces()).to.equal(false)
  })

  describe("MultiSigUserOp async signing with a NonceBurnStore", () => {
    it("signs with store-configured signers, burns both pairs, and produces a valid aggregate", async () => {
      const storeA = memoryStore()
      const storeB = memoryStore()
      const a = createSchnorrSigner(randomPriv(), { nonceStore: storeA })
      const b = createSchnorrSigner(randomPriv(), { nonceStore: storeB })
      const publicKeys = [a.getPubKey(), b.getPubKey()]
      const nonces = [a.generatePubNonces(), b.generatePubNonces()]
      const op = new MultiSigUserOp(publicKeys, nonces, randomHash() as `0x${string}`, opRequest())

      const outA = await op.signMultiSigHashAsync(a)
      const outB = await op.signMultiSigHashAsync(b)
      expect(op.signatures[a.getAddress()]).to.equal(outA)
      expect(op.signatures[b.getAddress()]).to.equal(outB)
      expect(storeA.burned.has(nonces[0].kPublic.toHex())).to.equal(true)
      expect(storeB.burned.has(nonces[1].kPublic.toHex())).to.equal(true)
      expect(op.getSummedSigData()).to.match(/^0x[0-9a-f]+$/)
      expect(sumAndVerify(op, publicKeys)).to.equal(true)
      expect(a.hasNonces()).to.equal(false)
    })

    it("works across a JSON round trip (wallet signs, Key signs the deserialized op)", async () => {
      const wallet = createSchnorrSigner(randomPriv(), { nonceStore: memoryStore() })
      const key = createSchnorrSigner(randomPriv(), { nonceStore: memoryStore() })
      const publicKeys = [wallet.getPubKey(), key.getPubKey()]
      const nonces = [wallet.generatePubNonces(), key.generatePubNonces()]
      const op = new MultiSigUserOp(publicKeys, nonces, randomHash() as `0x${string}`, opRequest())
      await op.signMultiSigHashAsync(wallet)

      const received = MultiSigUserOp.fromJson(structuredClone(op.toJson())) as MultiSigUserOp
      await received.signMultiSigHashAsync(key)
      expect(received.getSummedSigData()).to.match(/^0x[0-9a-f]+$/)
    })

    it("the synchronous MultiSigUserOp path refuses a store-configured signer and records nothing", () => {
      const store = memoryStore()
      const a = createSchnorrSigner(randomPriv(), { nonceStore: store })
      const b = createSchnorrSigner(randomPriv())
      const nonces = [a.generatePubNonces(), b.generatePubNonces()]
      const op = new MultiSigUserOp([a.getPubKey(), b.getPubKey()], nonces, randomHash() as `0x${string}`, opRequest())
      expect(() => op.signMultiSigHash(a)).to.throw("use MultiSigUserOp.signMultiSigHashAsync")
      expect(op.signatures).to.deep.equal({})
      expect(store.marks).to.equal(0)
    })

    it("a failing store means no signature and nothing recorded on the op", async () => {
      const failing: NonceBurnStore = {
        isNonceBurned: async () => false,
        markNonceBurned: async () => {
          throw new Error("disk full")
        },
      }
      const a = createSchnorrSigner(randomPriv(), { nonceStore: failing })
      const b = createSchnorrSigner(randomPriv())
      const nonces = [a.generatePubNonces(), b.generatePubNonces()]
      const op = new MultiSigUserOp([a.getPubKey(), b.getPubKey()], nonces, randomHash() as `0x${string}`, opRequest())
      let error = ""
      try {
        await op.signMultiSigHashAsync(a)
      } catch (error_) {
        error = (error_ as Error).message
      }
      expect(error).to.equal("disk full")
      expect(op.signatures).to.deep.equal({})
    })

    it("refuses a pair already burned in the store (restart replay via MultiSigUserOp)", async () => {
      const store = memoryStore()
      const victimPriv = randomPriv()
      const pair = _generateNonce()
      const k = new Key(Buffer.from(pair.k))
      const kTwo = new Key(Buffer.from(pair.kTwo))

      const first = createSchnorrSigner(victimPriv, { nonceStore: store })
      const co1 = createSchnorrSigner(randomPriv())
      const op1 = new MultiSigUserOp(
        [first.getPubKey(), co1.getPubKey()],
        [first.restorePubNonces(k, kTwo), co1.generatePubNonces()],
        randomHash() as `0x${string}`,
        opRequest()
      )
      await op1.signMultiSigHashAsync(first)

      new Schnorrkel().resetUsedNonces() // restart: only the store remembers
      const again = createSchnorrSigner(victimPriv, { nonceStore: store })
      const co2 = createSchnorrSigner(randomPriv())
      const op2 = new MultiSigUserOp(
        [again.getPubKey(), co2.getPubKey()],
        [again.restorePubNonces(k, kTwo), co2.generatePubNonces()],
        randomHash() as `0x${string}`,
        opRequest()
      )
      let error = ""
      try {
        await op2.signMultiSigHashAsync(again)
      } catch (error_) {
        error = (error_ as Error).message
      }
      expect(error).to.equal("Nonce has already been used and cannot be reused.")
      expect(op2.signatures).to.deep.equal({})
    })

    it("without a store the sync path is unchanged and mixes with the async path", async () => {
      const a = createSchnorrSigner(randomPriv())
      const b = createSchnorrSigner(randomPriv())
      const publicKeys = [a.getPubKey(), b.getPubKey()]
      const nonces = [a.generatePubNonces(), b.generatePubNonces()]
      const op = new MultiSigUserOp(publicKeys, nonces, randomHash() as `0x${string}`, opRequest())
      op.signMultiSigHash(a)
      await op.signMultiSigHashAsync(b)
      expect(sumAndVerify(op, publicKeys)).to.equal(true)
      expect(op.getSummedSigData()).to.match(/^0x[0-9a-f]+$/)
    })
  })

  it("why the store matters: the in-memory guard alone does not survive restarts (3 reuses leak the key)", () => {
    // reuse.js from the review, against the legacy (store-less) API.
    const victimPriv = randomPriv()
    const pair = _generateNonce()
    const rows: { s: bigint; b: bigint; c: bigint }[] = []
    for (let index = 0; index < 3; index++) {
      new Schnorrkel().resetUsedNonces() // restart
      const victim = createSchnorrSigner(victimPriv)
      const attacker = createSchnorrSigner(randomPriv())
      const pubKeys = [victim.getPubKey(), attacker.getPubKey()]
      const X = Schnorrkel.getCombinedPublicKey(pubKeys).buffer
      const L = _generateL(pubKeys.map((key) => key.buffer))
      const a = toBig(_aCoefficient(victim.getPubKey().buffer, L))
      const vpn = victim.restorePubNonces(new Key(Buffer.from(pair.k)), new Key(Buffer.from(pair.kTwo)))
      const apn = attacker.generatePubNonces()
      const msg = randomHash()
      const out = victim.signMultiSigHash(msg, pubKeys, [vpn, apn])
      const kAgg = secp256k1.publicKeyCombine([vpn.kPublic.buffer, apn.kPublic.buffer])
      const k2Agg = secp256k1.publicKeyCombine([vpn.kTwoPublic.buffer, apn.kTwoPublic.buffer])
      const b = toBig(ethers.getBytes(ethers.solidityPackedKeccak256(["bytes", "bytes32", "bytes", "bytes"], [X, msg, kAgg, k2Agg])))
      rows.push({ s: toBig(out.signature.buffer), b, c: mod(toBig(out.challenge.buffer) * a) })
    }
    const [r1, r2, r3] = rows
    const d1 = { s: mod(r2.s - r1.s), b: mod(r2.b - r1.b), c: mod(r2.c - r1.c) }
    const d2 = { s: mod(r3.s - r1.s), b: mod(r3.b - r1.b), c: mod(r3.c - r1.c) }
    const x = mod((d1.s * d2.b - d2.s * d1.b) * inv(d1.c * d2.b - d2.c * d1.b))
    expect(`0x${x.toString(16).padStart(64, "0")}`).to.equal(victimPriv.toLowerCase())
  })
})

describe("security 2026-10: AA-8 owner-combination cap / AA-4 owner list validation", () => {
  it("counts combinations and caps them at 255", () => {
    expect(MAX_ACCOUNT_OWNERS).to.equal(255)
    expect(countOwnerCombinations(8, 4, true)).to.equal(70)
    expect(countOwnerCombinations(3, 1)).to.equal(7)
    expect(countOwnerCombinations(10, 5, true)).to.equal(252)
    expect(countOwnerCombinations(11, 5, true)).to.be.greaterThan(255)
    expect(countOwnerCombinations(9, 1)).to.be.greaterThan(255)
    expect(countOwnerCombinations(64, 1)).to.be.greaterThan(255)
  })

  it("refuses to generate an undeployable owner list (fails fast, no 2^n blow-up)", () => {
    expect(() => getAllCombinedAddrFromKeysStrict(keys(11), 5)).to.throw("Too many owner combinations")
    expect(() => getAllCombinedAddrFromKeys(keys(9), 1)).to.throw("Too many owner combinations")
    const started = Date.now()
    expect(() => getAllCombinedAddrFromKeys(keys(40), 2)).to.throw("Too many owner combinations")
    expect(Date.now() - started).to.be.lessThan(2000)
    expect(getAllCombinedAddrFromKeysStrict(keys(4), 2)).to.have.length(6)
  })

  it("refuses owner lists with the zero address, duplicates, bad addresses, none or too many", () => {
    const owner = ethers.Wallet.createRandom().address
    const other = ethers.Wallet.createRandom().address
    expect(validateAccountOwners([owner, other])).to.deep.equal([owner, other])
    expect(() => validateAccountOwners([])).to.throw("At least one account owner")
    expect(() => validateAccountOwners([owner, ethers.ZeroAddress])).to.throw("zero address")
    expect(() => validateAccountOwners([owner, owner.toLowerCase()])).to.throw("Duplicate account owner")
    expect(() => validateAccountOwners([owner, "0x1234"])).to.throw("Invalid account owner")
    const many = Array.from({ length: 256 }, () => ethers.Wallet.createRandom().address)
    expect(() => validateAccountOwners(many)).to.throw("Too many account owners")
  })

  it("predictAccountAddrOffchain refuses a backdoored owner list", () => {
    const factory = ethers.Wallet.createRandom().address
    const implementation = ethers.Wallet.createRandom().address
    const owners = getAllCombinedAddrFromKeysStrict(keys(3), 2)
    expect(predictAccountAddrOffchain(factory, implementation, owners, "salt")).to.match(/^0x[0-9a-fA-F]{40}$/)
    expect(() => predictAccountAddrOffchain(factory, implementation, [...owners, ethers.ZeroAddress], "salt")).to.throw("zero address")
    expect(() => predictAccountAddrOffchain(factory, implementation, [owners[0], owners[0]], "salt")).to.throw("Duplicate account owner")
  })
})

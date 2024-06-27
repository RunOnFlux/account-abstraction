import { expect } from "chai"
import { generateRandomKeys } from "../../aa-schnorr-multisig-sdk/src/core"
import { createSchnorrSigner } from "../../aa-schnorr-multisig-sdk/src/helpers/schnorr-helpers"
import { MultiSigUserOp } from "../../aa-schnorr-multisig-sdk/src/userOperation/MultiSigUserOp"
import { UserOperationStruct_v6 } from "@alchemy/aa-core"
import { Key, PublicNonces } from "../../aa-schnorr-multisig-sdk/src/types"
import { deepEqual, generateRandomHex, generateRandomBigInt } from "../utils/utils"

describe("testing multiSigUserOp", () => {
    it("should serialize and deserialize properly", () => {
        const publicKeys: Key[] = []
        const publicNonces: PublicNonces[] = []

        for (let i = 0; i < 3; i++) {
            const keyPair = generateRandomKeys()
            const signer = createSchnorrSigner(
                `0x${keyPair.privateKey.toHex()}`
            )
            signer.generatePubNonces()
            publicKeys.push(signer.getPubKey())
            publicNonces.push(signer.getPubNonces())
        }

        const opHash = generateRandomHex()

        const opRequest: UserOperationStruct_v6 = {
            sender: generateRandomHex(),
            nonce: generateRandomBigInt(),
            initCode: generateRandomHex(),
            callData: generateRandomHex(),
            callGasLimit: generateRandomHex(),
            verificationGasLimit: generateRandomHex(),
            preVerificationGas: generateRandomBigInt(),
            maxFeePerGas: generateRandomBigInt(),
            maxPriorityFeePerGas: generateRandomBigInt(),
            paymasterAndData: generateRandomHex(),
            signature: generateRandomHex(),
        }

        const multiSigUserOp = new MultiSigUserOp(
            publicKeys,
            publicNonces,
            opHash,
            opRequest
        )

        const serialized = multiSigUserOp.toJson()
        const deserialized = MultiSigUserOp.fromJson(serialized)

        expect(deepEqual(multiSigUserOp, deserialized)).to.be.true
    })
})

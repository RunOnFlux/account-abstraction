import { expect } from "chai"
import { _generateL } from "../../src/core"

describe("generateL", () => {
  it("should get the expected hash for L even if public keys switch places (test if sorting works correctly)", () => {
    const publicKeyOne = Buffer.from("02e823a040a5602776959fe78ce3e1856dd1f9ae3a113da602854c98bd67fafd8f", "hex")
    const publicKeyTwo = Buffer.from("02946ef03de338aed83037c2d344114c64f5cef75ffc498b0854dabdb98a3a8fc9", "hex")

    const lHash = _generateL([publicKeyOne, publicKeyTwo])
    const lHashSorted = _generateL([publicKeyTwo, publicKeyOne])

    expect(lHash).to.eql("0x5862551eb4dc671b6127b8234ce5eb443b55dc4f334566a7a9e7e5c17ee6bd92")
    expect(lHashSorted).to.eql("0x5862551eb4dc671b6127b8234ce5eb443b55dc4f334566a7a9e7e5c17ee6bd92")
  })
})

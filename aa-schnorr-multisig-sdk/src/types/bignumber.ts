import { BigNumberish } from "ethers"

export class BigNumber {
    readonly number: BigNumberish
  
    constructor(number: BigNumberish) {
      this.number = number
    }
  
    toString(): string {
      return this.number.toString()
    }
  
    static fromString(number: string): BigNumber {
      return new BigNumber(BigInt(number))
    }
  }
  
import { BigNumberish } from "ethers"

export class BigNumberSerializer {
    readonly number: BigNumberish
  
    constructor(number: BigNumberish) {
      this.number = number
    }
  
    toString(): string {
      return this.number.toString()
    }
  
    static fromString(number: string): BigNumberSerializer {
      return new BigNumberSerializer(BigInt(number))
    }
  }
  
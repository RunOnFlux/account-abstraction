
export interface SignatureOutput {
  finalPublicNonce: FinalPublicNonce, // the final public nonce
  challenge: Challenge, // the schnorr challenge
  signature: Signature, // the signature
}

export class FinalPublicNonce {
  readonly buffer: Buffer

  constructor(buffer: Buffer) {
    this.buffer = buffer
  }

  toHex(): string {
    return this.buffer.toString('hex')
  }

  static fromHex(hex: string): FinalPublicNonce {
    return new FinalPublicNonce(Buffer.from(hex, 'hex'))
  }
}

export class Challenge {
  readonly buffer: Buffer

  constructor(buffer: Buffer) {
    this.buffer = buffer
  }

  toHex(): string {
    return this.buffer.toString('hex')
  }

  static fromHex(hex: string): FinalPublicNonce {
    return new FinalPublicNonce(Buffer.from(hex, 'hex'))
  }
}

export class Signature {
  readonly buffer: Buffer

  constructor(buffer: Buffer) {
    this.buffer = buffer
  }

  toHex(): string {
    return this.buffer.toString('hex')
  }

  static fromHex(hex: string): FinalPublicNonce {
    return new FinalPublicNonce(Buffer.from(hex, 'hex'))
  }
}


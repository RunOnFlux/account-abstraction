export class Key {
  readonly buffer: Buffer

  constructor(buffer: Buffer) {
    this.buffer = buffer
  }

  toHex(): string {
    return  this.buffer.toString('hex')
  }

  static fromHex(hex: string): Key {
    return new Key(Buffer.from(hex, 'hex'))
  }
}

import { Key } from './key'

export class KeyPair {
    privateKey: Key
    publicKey: Key

    constructor({ publicKey, privateKey }: { publicKey: Buffer, privateKey: Buffer }) {
        this.privateKey = new Key(privateKey)
        this.publicKey = new Key(publicKey)
    }

    static fromJson(params: string): KeyPair {
        try {
            const data = JSON.parse(params)
            const publicKey = Key.fromHex(data.publicKey)
            const privateKey = Key.fromHex(data.privateKey)

            return new KeyPair({ publicKey: publicKey.buffer, privateKey: privateKey.buffer })
        } catch (error) {
            throw new Error('Invalid JSON')
        }
    }

    toJson(): string {
        return JSON.stringify({
            publicKey: this.publicKey.toHex(),
            privateKey: this.privateKey.toHex(),
        })
    }
}

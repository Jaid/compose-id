import getMachineId from '#src/lib/getMachineId.ts'
import getSessionId from '#src/lib/getSessionId.ts'
import textEncoder from '#src/lib/singleton/textEncoder.ts'

const sessionIdHeadBits = 5n
const sessionIdHeadShift = 32 - Number(sessionIdHeadBits)
const sessionIdTailBits = 11n
const sessionIdTailMask = 0x7_FF
const timestampBits = 42n
const machineIdHeadBits = 6n
const machineIdHeadShift = 32 - Number(machineIdHeadBits)
const machineIdTailBits = 10n
const machineIdTailMask = 0x3_FF
const randomBits = 14n
const rawIdBytes = 11
const stringIdCharacters = 15
const timestampMask = (1n << timestampBits) - 1n
const randomMask = (1n << randomBits) - 1n
export class IdComposer {
  private static readonly base62Alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  private static readonly base62Radix = 62n
  static base62(rawId: Uint8Array) {
    if (rawId.length !== rawIdBytes) {
      throw new TypeError(`Expected ${rawIdBytes} bytes`)
    }
    let value = 0n
    for (const byte of rawId) {
      value = value << 8n | BigInt(byte)
    }
    const encoded = Array.from({length: stringIdCharacters})
    for (let index = encoded.length - 1; index >= 0; index--) {
      encoded[index] = IdComposer.base62Alphabet[Number(value % IdComposer.base62Radix)]
      value /= IdComposer.base62Radix
    }
    return encoded.join('')
  }
  static getRandomUint16() {
    const randomBytes = crypto.getRandomValues(new Uint8Array(2))
    const randomDataView = new DataView(randomBytes.buffer, randomBytes.byteOffset, randomBytes.byteLength)
    return randomDataView.getUint16(0)
  }
  static hashToUint32(source: string) {
    const bytes = textEncoder.encode(source)
    let hash = 0x81_1C_9D_C5
    for (const byte of bytes) {
      hash ^= byte
      hash = Math.imul(hash, 0x01_00_01_93)
    }
    return hash >>> 0
  }
  readonly machineId: number
  readonly sessionId: number
  private nextRandom: bigint
  constructor(sessionId?: string, machineId?: string) {
    this.machineId = IdComposer.hashToUint32(machineId ?? getMachineId())
    this.sessionId = IdComposer.hashToUint32(sessionId ?? getSessionId())
    this.nextRandom = BigInt(IdComposer.getRandomUint16()) & randomMask
  }
  make() {
    const machineIdHead = BigInt(this.machineId >>> machineIdHeadShift)
    const machineIdTail = BigInt(this.machineId & machineIdTailMask)
    const sessionIdHead = BigInt(this.sessionId >>> sessionIdHeadShift)
    const sessionIdTail = BigInt(this.sessionId & sessionIdTailMask)
    const timestamp = BigInt(Date.now()) & timestampMask
    const random = this.takeRandom()
    let composedId = sessionIdHead
    composedId = composedId << timestampBits | timestamp
    composedId = composedId << machineIdHeadBits | machineIdHead
    composedId = composedId << randomBits | random
    composedId = composedId << machineIdTailBits | machineIdTail
    composedId = composedId << sessionIdTailBits | sessionIdTail
    const result = new Uint8Array(rawIdBytes)
    for (let index = result.length - 1; index >= 0; index--) {
      result[index] = Number(composedId & 0xFFn)
      composedId >>= 8n
    }
    return result
  }
  makeString() {
    return IdComposer.base62(this.make())
  }
  private takeRandom() {
    const random = this.nextRandom
    const nextRandom = random + 1n
    this.nextRandom = nextRandom & randomMask
    return random
  }
}
export const idComposer = new IdComposer
/**
 * @returns a base62-encoded id with a fixed width of 15 characters.
 *
 * The 11 raw bytes are composed of:
 * • first 5 bits of the session ID blob
 * • 42 bits timestamp (uint42, milliseconds since Unix epoch)
 * • first 6 bits of the machine ID blob
 * • 14 bits of random data
 * • last 10 bits of the machine ID blob
 * • last 11 bits of the session ID blob
 *
 * So the bits look like this:
 *    01       02       03       04       05       06       07       08       09       10       11
 * SSSSSTTT TTTTTTTT TTTTTTTT TTTTTTTT TTTTTTTT TTTTTTTM MMMMMRRR RRRRRRRR RRRMMMMM MMMMMSSS SSSSSSSS
*/
const composeIdString = () => {
  return idComposer.makeString()
}
composeIdString.raw = () => {
  return idComposer.make()
}

export default composeIdString

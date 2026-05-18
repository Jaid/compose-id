import {encodeBase62} from '#src/base62.ts'
import getMachineId from '#src/lib/getMachineId.ts'
import getSessionId from '#src/lib/getSessionId.ts'
import {hashedIdBits, hashedIdBitsBigint, hashedIdMask, randomBits, randomMask, rawIdBytes, rawIdMaxExclusive, timestampBits, timestampMask} from '#src/lib/idFormat.ts'
import {obfuscate} from '#src/lib/obfuscate.ts'
import textEncoder from '#src/lib/singleton/textEncoder.ts'

const assertRawIdValue = (value: bigint) => {
  if (value < 0n || value >= rawIdMaxExclusive) {
    throw new RangeError(`Expected a bigint that fits into ${rawIdBytes} bytes`)
  }
}
const bigintToRawId = (value: bigint) => {
  assertRawIdValue(value)
  const rawId = new Uint8Array(rawIdBytes)
  for (let index = rawId.length - 1; index >= 0; index--) {
    rawId[index] = Number(value & 0xFFn)
    value >>= 8n
  }
  return rawId
}
const packRawValue = (machineId: number, sessionId: number, timestamp: bigint, random: bigint) => {
  let value = BigInt(machineId & hashedIdMask)
  value <<= hashedIdBitsBigint
  value |= BigInt(sessionId & hashedIdMask)
  value <<= timestampBits
  value |= timestamp & timestampMask
  value <<= randomBits
  value |= random & randomMask
  return value
}

export class IdComposer {
  static getRandomUint16() {
    const randomBytes = crypto.getRandomValues(new Uint8Array(2))
    const randomDataView = new DataView(randomBytes.buffer, randomBytes.byteOffset, randomBytes.byteLength)
    return randomDataView.getUint16(0)
  }
  static hashToUint16(source: string) {
    const bytes = textEncoder.encode(source)
    let hash = 0x81_1C_9D_C5
    for (const byte of bytes) {
      hash ^= byte
      hash = Math.imul(hash, 0x01_00_01_93)
    }
    hash >>>= 0
    return (hash ^ hash >>> hashedIdBits) & 0xFF_FF
  }
  readonly machineId: number
  readonly sessionId: number
  private nextRandom: bigint
  constructor(sessionId?: string, machineId?: string) {
    this.machineId = IdComposer.hashToUint16(machineId ?? getMachineId())
    this.sessionId = IdComposer.hashToUint16(sessionId ?? getSessionId())
    this.nextRandom = BigInt(IdComposer.getRandomUint16()) & randomMask
  }
  make() {
    const packed = packRawValue(this.machineId, this.sessionId, BigInt(Date.now()), this.takeRandom())
    const obfuscated = obfuscate(packed)
    return obfuscated
  }
  makeBytes() {
    const int = this.make()
    return bigintToRawId(int)
  }
  makeString() {
    return encodeBase62(this.make())
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
 * @returns a base62-encoded id with a fixed width of 15 characters
 *
 * The 11 raw bytes are an obfuscated representation of:
 * - 16 bits of a hashed machine ID
 * - 16 bits of a hashed session ID
 * - 42 bits timestamp (uint42, milliseconds since Unix epoch)
 * - 14 bits of randomness
 */
const composeId = () => {
  return idComposer.makeString()
}
composeId.bytes = () => {
  return idComposer.makeBytes()
}
composeId.int = () => {
  return idComposer.make()
}

export default composeId

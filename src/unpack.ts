import {decodeBase62} from '#src/base62.ts'
import {hashedIdBitsBigint, hashedIdMaskBigint, randomBits, randomMask, rawIdBytes, rawIdMaxExclusive, timestampBits, timestampMask} from '#src/lib/idFormat.ts'
import {deobfuscate} from '#src/lib/obfuscate.ts'

export type UnpackedId = {
  machineId: number
  random: number
  sessionId: number
  timestamp: number
}

const assertRawIdValue = (value: bigint) => {
  if (value < 0n || value >= rawIdMaxExclusive) {
    throw new RangeError(`Expected a bigint that fits into ${rawIdBytes} bytes`)
  }
}
const rawIdToBigint = (rawId: Uint8Array) => {
  if (rawId.length !== rawIdBytes) {
    throw new TypeError(`Expected ${rawIdBytes} bytes`)
  }
  let value = 0n
  for (const byte of rawId) {
    value = value << 8n | BigInt(byte)
  }
  return value
}
const unpackValue = (value: bigint): UnpackedId => {
  const random = Number(value & randomMask)
  value >>= randomBits
  const timestamp = Number(value & timestampMask)
  value >>= timestampBits
  const sessionId = Number(value & hashedIdMaskBigint)
  value >>= hashedIdBitsBigint
  const machineId = Number(value & hashedIdMaskBigint)
  return {
    machineId,
    sessionId,
    timestamp,
    random,
  }
}

export const unpackInt = (value: bigint) => {
  assertRawIdValue(value)
  return unpackValue(deobfuscate(value))
}

export const unpackBytes = (rawId: Uint8Array) => {
  return unpackInt(rawIdToBigint(rawId))
}

export const unpackString = (id: string) => {
  return unpackInt(decodeBase62(id))
}

const unpack = (id: Uint8Array | bigint | string): UnpackedId => {
  if (typeof id === 'string') {
    return unpackString(id)
  }
  if (id instanceof Uint8Array) {
    return unpackBytes(id)
  }
  if (typeof id === 'bigint') {
    return unpackInt(id)
  }
  throw new TypeError('Expected a base62 string, Uint8Array or bigint')
}

export default unpack

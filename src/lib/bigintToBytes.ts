import {rawIdBits, rawIdBytes} from '#src/lib/idFormat.ts'

export const rawIdMaxExclusive = 1n << rawIdBits

/**
 * @param value a BigInt that represents 11 bytes of data
 */
export default (value: bigint) => {
  const rawId = new Uint8Array(rawIdBytes)
  for (let index = rawId.length - 1; index >= 0; index--) {
    rawId[index] = Number(value & 0xFFn)
    value >>= 8n
  }
  return rawId
}

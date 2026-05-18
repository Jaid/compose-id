import textEncoder from '#src/lib/singleton/textEncoder.ts'

/**
 * non-cryptographic hash function that produces creates 2 bytes from an input of arbitrary length
 */
export const hashToUint16 = (bytes: Uint8Array) => {
  const outputBits = 16
  let hash = 0x81_1C_9D_C5
  for (const byte of bytes) {
    hash = Math.imul(hash ^ byte, 0x01_00_01_93)
  }
  hash ^= hash >>> outputBits
  hash = Math.imul(hash, 0x85_EB_CA_6B)
  hash ^= hash >>> 13
  hash = Math.imul(hash, 0xC2_B2_AE_35) >>> outputBits
  return hash
}

export const hashStringToUint16 = (source: string) => {
  return hashToUint16(textEncoder.encode(source))
}

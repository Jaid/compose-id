import textEncoder from '#src/lib/singleton/textEncoder.ts'

const hashToUint32 = (source: Uint8Array | string) => {
  const bytes = typeof source === 'string' ? textEncoder.encode(source) : source
  let hash = 0x81_1C_9D_C5
  for (const byte of bytes) {
    hash ^= byte
    hash = Math.imul(hash, 0x01_00_01_93)
  }
  return hash >>> 0
}

export default hashToUint32

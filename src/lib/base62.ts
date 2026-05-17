const base62Alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const base62 = BigInt(base62Alphabet.length)
const encodedLengthCache = new Map<number, number>
const getMinimumBase62Length = (byteLength: number) => {
  if (byteLength <= 0) {
    return 0
  }
  const cachedLength = encodedLengthCache.get(byteLength)
  if (cachedLength) {
    return cachedLength
  }
  const maxValueExclusive = 1n << BigInt(byteLength * 8)
  let encodedLength = 0
  let encodedCapacity = 1n
  while (encodedCapacity < maxValueExclusive) {
    encodedCapacity *= base62
    encodedLength++
  }
  encodedLengthCache.set(byteLength, encodedLength)
  return encodedLength
}
const encodeBase62 = (bytes: Uint8Array): string => {
  if (!bytes.length) {
    return ''
  }
  let value = 0n
  for (const byte of bytes) {
    value = value << 8n | BigInt(byte)
  }
  let encoded = ''
  while (value > 0n) {
    const remainder = Number(value % base62)
    encoded = base62Alphabet[remainder] + encoded
    value /= base62
  }
  const minimumLength = getMinimumBase62Length(bytes.length)
  return (encoded || base62Alphabet[0]).padStart(minimumLength, base62Alphabet[0])
}

export default encodeBase62

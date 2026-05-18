import HybridIdComposer from '#src/lib/composer/HybridIdComposer.ts'

export const idComposer = new HybridIdComposer
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

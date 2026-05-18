const rawIdBits = 88n
const rawIdMask = (1n << rawIdBits) - 1n
/**
 * @description `'https://www.npmjs.com/package/compose-id'` hashed with Blake3
 */
const obfuscationMultiplier = 0x7F_A6_B4_52_D9_A1_83_FD_5E_EBn
const obfuscationMultiplierInverse = 0x17_B6_B9_D0_B5_91_6B_79_C3_59_C3n
const obfuscationRotationBits = 29n
const obfuscationRotationTailBits = rawIdBits - obfuscationRotationBits
const rotl88 = (value: bigint) => {
  return (value << obfuscationRotationBits | value >> obfuscationRotationTailBits) & rawIdMask
}
const rotr88 = (value: bigint) => {
  return (value >> obfuscationRotationBits | value << obfuscationRotationTailBits) & rawIdMask
}

export const obfuscate = (value: bigint) => {
  return rotl88(value * obfuscationMultiplier & rawIdMask)
}

export const deobfuscate = (value: bigint) => {
  return rotr88(value) * obfuscationMultiplierInverse & rawIdMask
}

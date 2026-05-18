import {stringIdCharacters} from '#src/lib/idFormat.ts'

export const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
export const radix = 62n

export const encodeBase62 = (value: bigint) => {
  const encoded = Array.from({length: stringIdCharacters})
  for (let index = encoded.length - 1; index >= 0; index--) {
    encoded[index] = alphabet[Number(value % radix)]
    value /= radix
  }
  return encoded.join('')
}

export const decodeBase62 = (id: string) => {
  if (id.length !== stringIdCharacters) {
    throw new TypeError(`Expected ${stringIdCharacters} characters`)
  }
  let value = 0n
  for (const character of id) {
    const digit = alphabet.indexOf(character)
    if (digit === -1) {
      throw new TypeError(`Invalid base62 character: ${character}`)
    }
    value = value * radix + BigInt(digit)
  }
  return value
}

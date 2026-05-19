import {afterEach, expect, mock, spyOn, test} from 'bun:test'

import {encodeBase62} from '../src/base62.ts'
import HybridIdComposer from '../src/lib/composer/HybridIdComposer.ts'
import {hashStringToUint16, hashToUint16} from '../src/lib/hash.ts'
import composeId from '../src/main.ts'
import unpack from '../src/unpack.ts'

const mockRandomValues = (...values: Array<Array<number>>) => {
  let callIndex = 0
  spyOn(crypto, 'getRandomValues').mockImplementation((typedArray: Uint8Array) => {
    const value = values[Math.min(callIndex, values.length - 1)]
    callIndex++
    typedArray.set(value)
    return typedArray
  })
}
const createComposer = (machineId = 'machine-alpha', sessionId = 'session-beta') => {
  return new HybridIdComposer(machineId, sessionId)
}
const getExpectedUnpackedId = (machineId: string, sessionId: string, timestamp: number, random: number) => {
  return {
    machineId: hashStringToUint16(machineId),
    sessionId: hashStringToUint16(sessionId),
    timestamp,
    random,
  }
}
afterEach(() => {
  mock.restore()
})
test('hashes UTF-8 bytes and strings consistently', () => {
  const source = 'machine-alpha'
  const bytes = (new TextEncoder).encode(source)
  expect(hashToUint16(bytes)).toBe(hashStringToUint16(source))
})
test('default export exposes string, byte and integer helpers', () => {
  const byteId = composeId.bytes()
  const intId = composeId.int()
  const encodedId = composeId()
  expect(byteId).toBeInstanceOf(Uint8Array)
  expect(byteId).toHaveLength(11)
  expect(typeof intId).toBe('bigint')
  expect(encodedId).toHaveLength(15)
  expect(encodedId).toMatch(/^[0-9A-Za-z]{15}$/)
  expect(composeId).not.toHaveProperty('unpack')
})
test('returns deterministic integer, byte and string ids', () => {
  spyOn(Date, 'now').mockImplementation(() => 1_714_687_601_234)
  mockRandomValues([0x12, 0x34], [0x12, 0x34], [0x12, 0x34])
  const intComposer = createComposer()
  const byteComposer = createComposer()
  const stringComposer = createComposer()
  const intId = intComposer.make()
  const byteId = byteComposer.makeBytes()
  const encodedId = stringComposer.makeString()
  const expectedUnpackedId = getExpectedUnpackedId('machine-alpha', 'session-beta', 1_714_687_601_234, 4660)
  expect(intId).toBe(0x39_39_D4_C1_AE_A9_B7_89_EE_91_90n)
  expect([...byteId]).toEqual([57, 57, 212, 193, 174, 169, 183, 137, 238, 145, 144])
  expect(encodeBase62(intId)).toBe(encodedId)
  expect(unpack(intId)).toEqual(expectedUnpackedId)
  expect(unpack(byteId)).toEqual(expectedUnpackedId)
  expect(unpack(encodedId)).toEqual(expectedUnpackedId)
  expect(encodedId).toBe('5ZrJqtLcrk6KXia')
  expect(encodedId).toHaveLength(15)
  expect(encodedId).toMatch(/^[0-9A-Za-z]{15}$/)
})
test('preserves the session hash through raw obfuscation', () => {
  const machineId = 'machine-alpha'
  const firstSessionId = 'session-beta'
  const secondSessionId = 'session-gamma'
  spyOn(Date, 'now').mockImplementation(() => 1_714_687_601_234)
  mockRandomValues([0x00, 0x00], [0x00, 0x00])
  const firstUnpackedId = unpack(createComposer(machineId, firstSessionId).make())
  const secondUnpackedId = unpack(createComposer(machineId, secondSessionId).make())
  expect(firstUnpackedId).toEqual(getExpectedUnpackedId(machineId, firstSessionId, 1_714_687_601_234, 0))
  expect(secondUnpackedId).toEqual(getExpectedUnpackedId(machineId, secondSessionId, 1_714_687_601_234, 0))
  expect(secondUnpackedId.sessionId).not.toBe(firstUnpackedId.sessionId)
  expect(secondUnpackedId.machineId).toBe(firstUnpackedId.machineId)
  expect(secondUnpackedId.timestamp).toBe(firstUnpackedId.timestamp)
  expect(secondUnpackedId.random).toBe(firstUnpackedId.random)
})
test('preserves the machine hash through raw obfuscation', () => {
  const firstMachineId = 'machine-alpha'
  const secondMachineId = 'machine-gamma'
  const sessionId = 'session-beta'
  spyOn(Date, 'now').mockImplementation(() => 1_714_687_601_234)
  mockRandomValues([0x00, 0x00], [0x00, 0x00])
  const firstUnpackedId = unpack(createComposer(firstMachineId, sessionId).make())
  const secondUnpackedId = unpack(createComposer(secondMachineId, sessionId).make())
  expect(firstUnpackedId).toEqual(getExpectedUnpackedId(firstMachineId, sessionId, 1_714_687_601_234, 0))
  expect(secondUnpackedId).toEqual(getExpectedUnpackedId(secondMachineId, sessionId, 1_714_687_601_234, 0))
  expect(secondUnpackedId.machineId).not.toBe(firstUnpackedId.machineId)
  expect(secondUnpackedId.sessionId).toBe(firstUnpackedId.sessionId)
  expect(secondUnpackedId.timestamp).toBe(firstUnpackedId.timestamp)
  expect(secondUnpackedId.random).toBe(firstUnpackedId.random)
})
test('obfuscates nearby timestamps across almost the entire string', () => {
  mockRandomValues([0x00, 0x00], [0x00, 0x00])
  const dateNowSpy = spyOn(Date, 'now')
  const composer = createComposer()
  dateNowSpy.mockImplementation(() => 1_714_687_601_234)
  const firstId = composer.makeString()
  dateNowSpy.mockImplementation(() => 1_714_687_601_239)
  const secondId = createComposer().makeString()
  const differentCharacterCount = [...firstId].filter((character, index) => character !== secondId[index]).length
  expect(differentCharacterCount).toBeGreaterThanOrEqual(14)
})
test('advances the random section between consecutive ids from the same composer', () => {
  spyOn(Date, 'now').mockImplementation(() => 1_714_687_601_234)
  mockRandomValues([0x12, 0x34])
  const composer = createComposer()
  const firstUnpackedId = unpack(composer.make())
  const secondUnpackedId = unpack(composer.make())
  expect(firstUnpackedId.random).toBe(4660)
  expect(secondUnpackedId.random).toBe(4661)
  expect(secondUnpackedId.random).not.toBe(firstUnpackedId.random)
  expect(secondUnpackedId.sessionId).toBe(firstUnpackedId.sessionId)
  expect(secondUnpackedId.machineId).toBe(firstUnpackedId.machineId)
  expect(secondUnpackedId.timestamp).toBe(firstUnpackedId.timestamp)
})
test('uses only the lower 42 bits of the timestamp', () => {
  const dateNowSpy = spyOn(Date, 'now')
  mockRandomValues([0x00, 0x00], [0x00, 0x00])
  dateNowSpy.mockImplementation(() => 123_456)
  const lowTimestampId = createComposer().make()
  dateNowSpy.mockImplementation(() => Number((1n << 42n) + 123_456n))
  const overflowTimestampId = createComposer().make()
  expect(overflowTimestampId).toBe(lowTimestampId)
})
test('uses only the lower 14 bits of the initial random seed', () => {
  spyOn(Date, 'now').mockImplementation(() => 1_714_687_601_234)
  mockRandomValues([0x00, 0x00], [0xC0, 0x00])
  const lowRandomId = createComposer().make()
  const highBitRandomId = createComposer().make()
  expect(highBitRandomId).toBe(lowRandomId)
})
test('treats shortened base62 strings like left-padded ids', () => {
  expect(unpack('short')).toEqual(unpack('0000000000short'))
})
test('rejects invalid unpack inputs', () => {
  expect(() => unpack(Uint8Array.of(1, 2, 3))).toThrow('Expected 11 bytes')
  expect(() => unpack('00000000000000_')).toThrow('Expected a bigint that fits into 11 bytes')
  expect(() => unpack('zzzzzzzzzzzzzzz')).toThrow('Expected a bigint that fits into 11 bytes')
  expect(() => unpack(-1n)).toThrow('Expected a bigint that fits into 11 bytes')
  expect(() => unpack(1n << 88n)).toThrow('Expected a bigint that fits into 11 bytes')
})

import {afterEach, expect, mock, spyOn, test} from 'bun:test'

import composeId, {IdComposer} from '../src/main.ts'

const mockRandomValues = (...values: Array<Array<number>>) => {
  let callIndex = 0
  spyOn(crypto, 'getRandomValues').mockImplementation((typedArray: Uint8Array) => {
    const value = values[Math.min(callIndex, values.length - 1)]
    callIndex++
    typedArray.set(value)
    return typedArray
  })
}
const createComposer = (sessionId = 'session-beta', machineId = 'machine-alpha') => {
  return new IdComposer(sessionId, machineId)
}
const getExpectedUnpackedId = (machineId: string, sessionId: string, timestamp: number, random: number) => {
  return {
    machineId: IdComposer.hashToUint16(machineId),
    sessionId: IdComposer.hashToUint16(sessionId),
    timestamp,
    random,
  }
}
afterEach(() => {
  mock.restore()
})
test('default export exposes a base62 composer and a raw variant', () => {
  const rawId = composeId.raw()
  const encodedId = composeId()
  expect(rawId).toBeInstanceOf(Uint8Array)
  expect(rawId).toHaveLength(11)
  expect(encodedId).toHaveLength(15)
  expect(encodedId).toMatch(/^[0-9A-Za-z]{15}$/)
})
test('returns a deterministic 11-byte id and a fixed-width base62 string', () => {
  spyOn(Date, 'now').mockImplementation(() => 1_714_687_601_234)
  mockRandomValues([0x12, 0x34], [0x12, 0x34])
  const rawComposer = createComposer()
  const encodedComposer = createComposer()
  const rawId = rawComposer.make()
  const encodedId = encodedComposer.makeString()
  expect([...rawId]).toEqual([139, 30, 118, 176, 212, 164, 234, 70, 149, 98, 206])
  expect(IdComposer.unpackRaw(rawId)).toEqual(getExpectedUnpackedId('machine-alpha', 'session-beta', 1_714_687_601_234, 4660))
  expect(IdComposer.base62(rawId)).toBe(encodedId)
  expect(IdComposer.unpack(encodedId)).toEqual(IdComposer.unpackRaw(rawId))
  expect(encodedId).toBe('DYnlpx1f15z9dIk')
  expect(encodedId).toHaveLength(15)
  expect(encodedId).toMatch(/^[0-9A-Za-z]{15}$/)
})
test('mashes the session hash into the leading and trailing sections', () => {
  const machineId = 'machine-alpha'
  const firstSessionId = 'session-beta'
  const secondSessionId = 'session-gamma'
  spyOn(Date, 'now').mockImplementation(() => 1_714_687_601_234)
  mockRandomValues([0x00, 0x00], [0x00, 0x00])
  const firstUnpackedId = IdComposer.unpackRaw(createComposer(firstSessionId, machineId).make())
  const secondUnpackedId = IdComposer.unpackRaw(createComposer(secondSessionId, machineId).make())
  expect(firstUnpackedId).toEqual(getExpectedUnpackedId(machineId, firstSessionId, 1_714_687_601_234, 0))
  expect(secondUnpackedId).toEqual(getExpectedUnpackedId(machineId, secondSessionId, 1_714_687_601_234, 0))
  expect(secondUnpackedId.sessionId).not.toBe(firstUnpackedId.sessionId)
  expect(secondUnpackedId.machineId).toBe(firstUnpackedId.machineId)
  expect(secondUnpackedId.timestamp).toBe(firstUnpackedId.timestamp)
  expect(secondUnpackedId.random).toBe(firstUnpackedId.random)
})
test('mashes the machine hash around the random section', () => {
  const firstMachineId = 'machine-alpha'
  const secondMachineId = 'machine-gamma'
  const sessionId = 'session-beta'
  spyOn(Date, 'now').mockImplementation(() => 1_714_687_601_234)
  mockRandomValues([0x00, 0x00], [0x00, 0x00])
  const firstUnpackedId = IdComposer.unpackRaw(createComposer(sessionId, firstMachineId).make())
  const secondUnpackedId = IdComposer.unpackRaw(createComposer(sessionId, secondMachineId).make())
  expect(firstUnpackedId).toEqual(getExpectedUnpackedId(firstMachineId, sessionId, 1_714_687_601_234, 0))
  expect(secondUnpackedId).toEqual(getExpectedUnpackedId(secondMachineId, sessionId, 1_714_687_601_234, 0))
  expect(secondUnpackedId.machineId).not.toBe(firstUnpackedId.machineId)
  expect(secondUnpackedId.sessionId).toBe(firstUnpackedId.sessionId)
  expect(secondUnpackedId.timestamp).toBe(firstUnpackedId.timestamp)
  expect(secondUnpackedId.random).toBe(firstUnpackedId.random)
})
test('advances the random section between consecutive ids from the same composer', () => {
  spyOn(Date, 'now').mockImplementation(() => 1_714_687_601_234)
  mockRandomValues([0x12, 0x34])
  const composer = createComposer()
  const firstUnpackedId = IdComposer.unpackRaw(composer.make())
  const secondUnpackedId = IdComposer.unpackRaw(composer.make())
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
  expect([...overflowTimestampId]).toEqual([...lowTimestampId])
})
test('uses only the lower 14 bits of the initial random seed', () => {
  spyOn(Date, 'now').mockImplementation(() => 1_714_687_601_234)
  mockRandomValues([0x00, 0x00], [0xC0, 0x00])
  const lowRandomId = createComposer().make()
  const highBitRandomId = createComposer().make()
  expect([...highBitRandomId]).toEqual([...lowRandomId])
})
test('rejects invalid unpack inputs', () => {
  expect(() => IdComposer.unpackRaw(Uint8Array.of(1, 2, 3))).toThrow('Expected 11 bytes')
  expect(() => IdComposer.unpack('short')).toThrow('Expected 15 characters')
  expect(() => IdComposer.unpack('00000000000000_')).toThrow('Invalid base62 character')
  expect(() => IdComposer.unpack('zzzzzzzzzzzzzzz')).toThrow('Expected a base62 string that fits into 11 bytes')
})

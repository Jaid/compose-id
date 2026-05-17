import {afterEach, expect, mock, spyOn, test} from 'bun:test'

import hashToUint32 from '../src/lib/hashToUint32.ts'
import composeId, {IdComposer} from '../src/main.ts'

const machineIdHeadShift = 26
const machineIdTailMask = 0x3_FFn
const sessionIdHeadShift = 27
const sessionIdHeadMask = 0x1Fn
const sessionIdTailMask = 0x7_FFn
const timestampMask = (1n << 42n) - 1n
const randomMask = 0x3F_FF_FFn
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
const getHashSlices = (machineId: string, sessionId: string) => {
  const machineIdBlob = hashToUint32(machineId)
  const sessionIdBlob = hashToUint32(sessionId)
  return {
    machineIdHead: machineIdBlob >>> machineIdHeadShift,
    machineIdTail: Number(BigInt(machineIdBlob) & machineIdTailMask),
    sessionIdHead: sessionIdBlob >>> sessionIdHeadShift,
    sessionIdTail: Number(BigInt(sessionIdBlob) & sessionIdTailMask),
  }
}
const decodeRawId = (rawId: Uint8Array) => {
  let value = 0n
  for (const byte of rawId) {
    value = value << 8n | BigInt(byte)
  }
  return {
    sessionIdHead: Number(value >> 91n & sessionIdHeadMask),
    timestamp: Number(value >> 49n & timestampMask),
    machineIdHead: Number(value >> 43n & 0x3Fn),
    random: Number(value >> 21n & randomMask),
    machineIdTail: Number(value >> 11n & machineIdTailMask),
    sessionIdTail: Number(value & sessionIdTailMask),
  }
}
afterEach(() => {
  mock.restore()
})
test('default export exposes a base62 composer and a raw variant', () => {
  const rawId = composeId.raw()
  const encodedId = composeId()
  expect(rawId).toBeInstanceOf(Uint8Array)
  expect(rawId).toHaveLength(12)
  expect(encodedId).toHaveLength(17)
  expect(encodedId).toMatch(/^[0-9A-Za-z]{17}$/)
})
test('returns a deterministic 12-byte id and a fixed-width base62 string', () => {
  const composer = createComposer()
  spyOn(Date, 'now').mockImplementation(() => 1_714_687_601_234)
  mockRandomValues([0x12, 0x34, 0x56, 0x78], [0x12, 0x34, 0x56, 0x78])
  const rawId = composer.make()
  const encodedId = composer.makeString()
  expect([...rawId]).toEqual([155, 30, 118, 176, 212, 164, 254, 138, 207, 28, 120, 204])
  expect(decodeRawId(rawId)).toEqual({
    sessionIdHead: 19,
    timestamp: 1_714_687_601_234,
    machineIdHead: 31,
    random: 3_430_008,
    machineIdTail: 911,
    sessionIdTail: 204,
  })
  expect(encodedId).toBe('10Qym9qzZgbFdDnZc')
  expect(encodedId).toHaveLength(17)
  expect(encodedId).toMatch(/^[0-9A-Za-z]{17}$/)
})
test('mashes the session hash into the leading and trailing sections', () => {
  const machineId = 'machine-alpha'
  const firstSessionId = 'session-beta'
  const secondSessionId = 'session-gamma'
  spyOn(Date, 'now').mockImplementation(() => 1_714_687_601_234)
  mockRandomValues([0x00, 0x00, 0x00, 0x00], [0x00, 0x00, 0x00, 0x00])
  const firstSections = decodeRawId(createComposer(firstSessionId, machineId).make())
  const secondSections = decodeRawId(createComposer(secondSessionId, machineId).make())
  const firstHashSlices = getHashSlices(machineId, firstSessionId)
  const secondHashSlices = getHashSlices(machineId, secondSessionId)
  expect(firstSections.sessionIdHead).toBe(firstHashSlices.sessionIdHead)
  expect(firstSections.sessionIdTail).toBe(firstHashSlices.sessionIdTail)
  expect(secondSections.sessionIdHead).toBe(secondHashSlices.sessionIdHead)
  expect(secondSections.sessionIdTail).toBe(secondHashSlices.sessionIdTail)
  expect(secondSections.sessionIdHead).not.toBe(firstSections.sessionIdHead)
  expect(secondSections.sessionIdTail).not.toBe(firstSections.sessionIdTail)
  expect(secondSections.machineIdHead).toBe(firstSections.machineIdHead)
  expect(secondSections.machineIdTail).toBe(firstSections.machineIdTail)
  expect(secondSections.timestamp).toBe(firstSections.timestamp)
  expect(secondSections.random).toBe(firstSections.random)
})
test('mashes the machine hash around the random section', () => {
  const firstMachineId = 'machine-alpha'
  const secondMachineId = 'machine-gamma'
  const sessionId = 'session-beta'
  spyOn(Date, 'now').mockImplementation(() => 1_714_687_601_234)
  mockRandomValues([0x00, 0x00, 0x00, 0x00], [0x00, 0x00, 0x00, 0x00])
  const firstSections = decodeRawId(createComposer(sessionId, firstMachineId).make())
  const secondSections = decodeRawId(createComposer(sessionId, secondMachineId).make())
  const firstHashSlices = getHashSlices(firstMachineId, sessionId)
  const secondHashSlices = getHashSlices(secondMachineId, sessionId)
  expect(firstSections.machineIdHead).toBe(firstHashSlices.machineIdHead)
  expect(firstSections.machineIdTail).toBe(firstHashSlices.machineIdTail)
  expect(secondSections.machineIdHead).toBe(secondHashSlices.machineIdHead)
  expect(secondSections.machineIdTail).toBe(secondHashSlices.machineIdTail)
  expect(secondSections.machineIdHead).not.toBe(firstSections.machineIdHead)
  expect(secondSections.machineIdTail).not.toBe(firstSections.machineIdTail)
  expect(secondSections.sessionIdHead).toBe(firstSections.sessionIdHead)
  expect(secondSections.sessionIdTail).toBe(firstSections.sessionIdTail)
  expect(secondSections.timestamp).toBe(firstSections.timestamp)
  expect(secondSections.random).toBe(firstSections.random)
})
test('uses only the lower 42 bits of the timestamp', () => {
  const composer = createComposer()
  const dateNowSpy = spyOn(Date, 'now')
  mockRandomValues([0x00, 0x00, 0x00, 0x00], [0x00, 0x00, 0x00, 0x00])
  dateNowSpy.mockImplementation(() => 123_456)
  const lowTimestampId = composer.make()
  dateNowSpy.mockImplementation(() => Number((1n << 42n) + 123_456n))
  const overflowTimestampId = composer.make()
  expect([...overflowTimestampId]).toEqual([...lowTimestampId])
})
test('uses only the lower 22 bits of randomness', () => {
  const composer = createComposer()
  spyOn(Date, 'now').mockImplementation(() => 1_714_687_601_234)
  mockRandomValues([0x00, 0x00, 0x00, 0x00], [0x3F, 0xC0, 0x00, 0x00])
  const lowRandomId = composer.make()
  const highBitRandomId = composer.make()
  expect([...highBitRandomId]).toEqual([...lowRandomId])
})

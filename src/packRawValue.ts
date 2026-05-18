import {hashedIdBitsBigint, hashedIdMask, randomBits, randomMask, timestampBits, timestampMask} from '#src/lib/idFormat.ts'

export default (machineId: number, sessionId: number, timestamp: bigint, random: bigint) => {
  let value = BigInt(machineId & hashedIdMask)
  value <<= hashedIdBitsBigint
  value |= BigInt(sessionId & hashedIdMask)
  value <<= timestampBits
  value |= timestamp & timestampMask
  value <<= randomBits
  value |= random & randomMask
  return value
}

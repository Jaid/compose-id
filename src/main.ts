import base62 from '#src/lib/base62.ts'
import getMachineId from '#src/lib/getMachineId.ts'
import {getRandomUint30} from '#src/lib/getRandomUint30.ts'
import getSessionId from '#src/lib/getSessionId.ts'
import hashToUint32 from '#src/lib/hashToUint32.ts'

const sessionIdHeadBits = 5n
const sessionIdHeadShift = 32 - Number(sessionIdHeadBits)
const sessionIdTailBits = 11n
const sessionIdTailMask = 0x7_FF
const timestampBits = 42n
const machineIdHeadBits = 6n
const machineIdHeadShift = 32 - Number(machineIdHeadBits)
const machineIdTailBits = 10n
const machineIdTailMask = 0x3_FF
const randomBits = 22n
const rawIdBytes = 12
const timestampMask = (1n << timestampBits) - 1n
const randomMask = (1n << randomBits) - 1n
export class IdComposer {
  machineId: number
  sessionId: number
  constructor(sessionId?: string, machineId?: string) {
    this.machineId = hashToUint32(machineId ?? getMachineId())
    this.sessionId = hashToUint32(sessionId ?? getSessionId())
  }
  make() {
    const machineIdHead = BigInt(this.machineId >>> machineIdHeadShift)
    const machineIdTail = BigInt(this.machineId & machineIdTailMask)
    const sessionIdHead = BigInt(this.sessionId >>> sessionIdHeadShift)
    const sessionIdTail = BigInt(this.sessionId & sessionIdTailMask)
    const timestamp = BigInt(Date.now()) & timestampMask
    const random = BigInt(getRandomUint30()) & randomMask
    let composedId = sessionIdHead
    composedId = composedId << timestampBits | timestamp
    composedId = composedId << machineIdHeadBits | machineIdHead
    composedId = composedId << randomBits | random
    composedId = composedId << machineIdTailBits | machineIdTail
    composedId = composedId << sessionIdTailBits | sessionIdTail
    const result = new Uint8Array(rawIdBytes)
    for (let index = result.length - 1; index >= 0; index--) {
      result[index] = Number(composedId & 0xFFn)
      composedId >>= 8n
    }
    return result
  }
  /**
   * @returns a base62-encoded id with a fixed width of 17 characters.
   *
   * The 12 raw bytes are composed of:
   * • first 5 bits of the session ID blob
   * • 42 bits timestamp (uint42, milliseconds since Unix epoch)
   * • first 6 bits of the machine ID blob
   * • 22 bits of random data
   * • last 10 bits of the machine ID blob
   * • last 11 bits of the session ID blob
   *
   * So the bits look like this:
   *    01       02       03       04       05       06       07       08       09       10       11       12
   * SSSSSTTT TTTTTTTT TTTTTTTT TTTTTTTT TTTTTTTT TTTTTTTM MMMMMRRR RRRRRRRR RRRRRRRR RRRMMMMM MMMMMSSS SSSSSSSS
  */
  makeString() {
    return base62(this.make())
  }
}
const composer = new IdComposer
const composeIdString = () => {
  return composer.makeString()
}
composeIdString.raw = () => {
  return composer.make()
}

export default composeIdString

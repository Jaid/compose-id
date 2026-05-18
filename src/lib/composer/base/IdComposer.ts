import {encodeBase62} from '#src/base62.ts'
import bigintToBytes from '#src/lib/bigintToBytes.ts'
import getRandomUint16 from '#src/lib/getRandomUint16.ts'
import {randomMask} from '#src/lib/idFormat.ts'
import {obfuscate} from '#src/lib/obfuscate.ts'
import packRawValue from '#src/packRawValue.ts'

export default class IdComposer {
  readonly machineId: number
  readonly sessionId: number
  private nextRandom: bigint
  constructor(machineId: number, sessionId: number) {
    this.machineId = machineId
    this.sessionId = sessionId
    this.nextRandom = BigInt(getRandomUint16()) & randomMask
  }
  make() {
    const timestamp = BigInt(Date.now())
    const randomNumber = this.roll()
    const packed = packRawValue(this.machineId, this.sessionId, timestamp, randomNumber)
    const obfuscated = obfuscate(packed)
    return obfuscated
  }
  makeBytes() {
    const int = this.make()
    return bigintToBytes(int)
  }
  makeString() {
    const id = this.make()
    const encoded = encodeBase62(id)
    return encoded
  }
  private roll() {
    const random = this.nextRandom
    const nextRandom = random + 1n
    this.nextRandom = nextRandom & randomMask
    return random
  }
}

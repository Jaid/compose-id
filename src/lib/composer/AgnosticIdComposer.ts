import IdComposer from '#src/lib/composer/base/IdComposer.ts'
import getRandomUint16 from '#src/lib/getRandomUint16.ts'
import {hashStringToUint16} from '#src/lib/hash.ts'

export default class AgnosticIdComposer extends IdComposer {
  constructor(machineIdOverride?: string, sessionIdOverride?: string) {
    const machineId = hashStringToUint16(machineIdOverride ?? Object.keys(globalThis).join('\0'))
    const sessionId = sessionIdOverride ? hashStringToUint16(sessionIdOverride) : getRandomUint16()
    super(machineId, sessionId)
  }
}

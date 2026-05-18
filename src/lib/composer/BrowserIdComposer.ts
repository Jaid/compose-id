import getMachineId from '#src/lib/browser/getMachineId.ts'
import getSessionId from '#src/lib/browser/getSessionId.ts'
import IdComposer from '#src/lib/composer/base/IdComposer.ts'
import {hashStringToUint16} from '#src/lib/hash.ts'

export default class BrowserIdComposer extends IdComposer {
  constructor(machineIdOverride?: string, sessionIdOverride?: string) {
    const machineId = machineIdOverride ?? getMachineId()
    const machineIdHash = hashStringToUint16(machineId)
    const sessionId = sessionIdOverride ?? getSessionId()
    const sessionIdHash = hashStringToUint16(sessionId)
    super(machineIdHash, sessionIdHash)
  }
}

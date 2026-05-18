import IdComposer from '#src/lib/composer/base/IdComposer.ts'
import getMachineId from '#src/lib/getMachineId.ts'
import getSessionId from '#src/lib/getSessionId.ts'
import {hashStringToUint16} from '#src/lib/hash.ts'

export default class HybridIdComposer extends IdComposer {
  constructor(machineIdOverride?: string, sessionIdOverride?: string) {
    const machineId = machineIdOverride ?? getMachineId()
    const machineIdHash = hashStringToUint16(machineId)
    const sessionId = sessionIdOverride ?? getSessionId()
    const sessionIdHash = hashStringToUint16(sessionId)
    super(machineIdHash, sessionIdHash)
  }
}

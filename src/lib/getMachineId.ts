import getBrowserMachineId from '#src/lib/browser/getMachineId.ts'
import getDesktopMachineId from '#src/lib/desktop/getMachineId.ts'

const getMachineId = () => {
  const override = typeof process === 'undefined' ? undefined :  process.env.MACHINE_ID
  if (override) {
    return override
  }
  if (typeof process !== 'undefined' && (process.versions.bun || process.versions.node)) {
    return getDesktopMachineId()
  }
  return getBrowserMachineId()
}

export default getMachineId

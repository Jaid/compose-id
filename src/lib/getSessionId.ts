import getBrowserSessionId from '#src/lib/browser/getSessionId.ts'
import getDesktopSessionId from '#src/lib/desktop/getSessionId.ts'

const getSessionId = () => {
  const override = typeof process === 'undefined' ? undefined : process.env.SESSION_ID
  if (override) {
    return override
  }
  if (typeof process !== 'undefined' && (process.versions.bun || process.versions.node)) {
    return getDesktopSessionId()
  }
  return getBrowserSessionId()
}

export default getSessionId

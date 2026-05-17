import flattenString from 'flatten-string'

let browserSessionSeed: string | undefined
const getBrowserSessionSeed = () => {
  browserSessionSeed ??= crypto.randomUUID()
  return browserSessionSeed
}
const getBrowserSessionId = () => {
  const browserGlobal = globalThis as typeof globalThis & {
    location?: {
      origin?: string
    }
  }
  const origin = browserGlobal.location?.origin || ''
  const userAgent = typeof navigator === 'undefined' ? '' : navigator.userAgent
  const timeOrigin = typeof performance === 'undefined' ? '' : String(performance.timeOrigin)
  return flattenString.zero([
    `origin:${origin}`,
    `userAgent:${userAgent}`,
    `timeOrigin:${timeOrigin}`,
    `seed:${getBrowserSessionSeed()}`,
  ])
}

export default getBrowserSessionId

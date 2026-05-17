import flattenString from 'flatten-string'

const getSessionId = () => {
  const timeOrigin = typeof performance === 'undefined' ? '' : String(performance.timeOrigin)
  return flattenString.zero([
    `pid:${process.pid}`,
    `exec:${process.execPath}`,
    `execArgv:${process.execArgv.join('\0')}`,
    `argv:${process.argv.join('\0')}`,
    `timeOrigin:${timeOrigin}`,
  ])
}

export default getSessionId

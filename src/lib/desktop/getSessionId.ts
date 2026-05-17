import flattenString from 'flatten-string'

const getSessionId = () => {
  const timeOrigin = typeof performance === 'undefined' ? '' : String(performance.timeOrigin)
  return flattenString.zero(process.pid, process.execPath, process.execArgv, process.argv, timeOrigin)
}

export default getSessionId

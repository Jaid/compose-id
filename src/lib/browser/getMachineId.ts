type NavigatorWithUserAgentData = Navigator & {
  userAgentData?: {
    toJSON: () => unknown
  }
}

const getBrowserMachineId = () => {
  if (typeof navigator === 'undefined') {
    return ''
  }
  const navigatorWithUserAgentData = navigator as NavigatorWithUserAgentData
  if (navigatorWithUserAgentData.userAgentData) {
    return JSON.stringify(navigatorWithUserAgentData.userAgentData.toJSON())
  }
  return navigator.userAgent
}

export default getBrowserMachineId

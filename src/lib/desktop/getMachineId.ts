import os from 'node:os'

import flattenString from 'flatten-string'

const emptyMacAddress = '00:00:00:00:00:00'
const getMacAddresses = () => {
  const networkInterfaceMacAddresses = Object.values(os.networkInterfaces())
    .flatMap(networkInterfaces => networkInterfaces ?? [])
    .filter(networkInterface => !networkInterface.internal)
    .map(networkInterface => networkInterface.mac.toLowerCase())
    .filter(macAddress => macAddress && macAddress !== emptyMacAddress)
  const uniqueMacAddresses = [...new Set(networkInterfaceMacAddresses)].toSorted()
  return uniqueMacAddresses
}
const getMachineId = () => {
  const uniqueMacAddresses = getMacAddresses()
  return flattenString.zero([
    `hostname:${os.hostname()}`,
    `platform:${process.platform}`,
    `arch:${process.arch}`,
    uniqueMacAddresses.length ? `mac:${uniqueMacAddresses.join(',')}` : undefined,
  ])
}

export default getMachineId

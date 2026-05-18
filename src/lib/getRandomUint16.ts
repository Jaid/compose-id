export default () => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(2))
  const randomDataView = new DataView(randomBytes.buffer, randomBytes.byteOffset, randomBytes.byteLength)
  return randomDataView.getUint16(0)
}

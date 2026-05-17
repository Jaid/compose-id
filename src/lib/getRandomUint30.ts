export const randomMask = 0x3F_FF_FF_FF

export const getRandomUint30 = () => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(4))
  const randomDataView = new DataView(randomBytes.buffer, randomBytes.byteOffset, randomBytes.byteLength)
  return randomDataView.getUint32(0) & randomMask
}

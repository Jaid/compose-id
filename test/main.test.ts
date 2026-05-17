import {expect, test} from 'bun:test'

const {default: composeId} = await import('#src/main.ts')

test('should run', () => {
  const result = composeId()
  expect(result).toBe('compose-id') // TODO Test actual functionality
})

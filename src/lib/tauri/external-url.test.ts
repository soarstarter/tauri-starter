import { describe, expect, it } from 'vitest'
import { getAllowedExternalUrl } from './external-url'

describe('getAllowedExternalUrl', () => {
  it('allows intended external protocols', () => {
    expect(getAllowedExternalUrl('https://example.com/document?q=1')).toBe('https://example.com/document?q=1')
    expect(getAllowedExternalUrl('mailto:support@example.com')).toBe('mailto:support@example.com')
  })

  it.each(['file:///tmp/private.txt', 'javascript:alert(1)', 'http://example.com', 'not-a-url'])(
    'rejects unsafe or malformed value %s',
    (value) => {
      expect(() => getAllowedExternalUrl(value)).toThrow()
    }
  )
})

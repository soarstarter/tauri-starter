import { describe, expect, it } from 'vitest'
import { redactSensitive } from './log-redact'

describe('redactSensitive', () => {
  it('redacts sensitive object keys and inline values', () => {
    expect(
      redactSensitive({
        accessToken: 'abc123',
        message: 'password=hunter2 api_key=abc Authorization: Bearer token-123',
        url: 'https://user:pass@example.com/path',
      })
    ).toEqual({
      accessToken: '[redacted]',
      message: 'password=[redacted] api_key=[redacted] Authorization: Bearer [redacted]',
      url: 'https://[redacted]@example.com/path',
    })
  })
})

const SENSITIVE_KEY_PATTERN = /password|secret|token|apikey|api_key|auth|cookie|session|credential|pin/i
const SENSITIVE_VALUE_PATTERN =
  /((?:password|secret|token|api[_-]?key|authorization|cookie|session|credential|pin)\s*[=:]\s*)(?!bearer\b)([^\s,;&]+)/gi
const BEARER_VALUE_PATTERN = /(bearer\s+)([a-z0-9._~+/=-]+)/gi
const URL_CREDENTIALS_PATTERN = /(https?:\/\/)[^/\s:@]+:[^/\s@]+@/gi

const redactString = (value: string): string =>
  value
    .replace(SENSITIVE_VALUE_PATTERN, '$1[redacted]')
    .replace(BEARER_VALUE_PATTERN, '$1[redacted]')
    .replace(URL_CREDENTIALS_PATTERN, '$1[redacted]@')

const redactValue = (value: unknown, key: string | undefined, seen: WeakMap<object, unknown>): unknown => {
  if (key && SENSITIVE_KEY_PATTERN.test(key)) return '[redacted]'
  if (typeof value === 'string') return redactString(value)
  if (!value || typeof value !== 'object') return value

  if (value instanceof Error) {
    const redactedError = new Error(redactString(value.message))
    redactedError.name = value.name
    if (value.stack) redactedError.stack = redactString(value.stack)
    return redactedError
  }

  const previous = seen.get(value)
  if (previous) return previous

  if (Array.isArray(value)) {
    const redactedArray: unknown[] = []
    seen.set(value, redactedArray)
    for (const item of value) redactedArray.push(redactValue(item, undefined, seen))
    return redactedArray
  }

  const redactedObject: Record<string, unknown> = {}
  seen.set(value, redactedObject)
  for (const [entryKey, entryValue] of Object.entries(value)) {
    redactedObject[entryKey] = redactValue(entryValue, entryKey, seen)
  }
  return redactedObject
}

export const redactSensitive = <T>(value: T): T => redactValue(value, undefined, new WeakMap()) as T

export const redactContext = (
  context: Record<string, string | number | boolean> | undefined
): Record<string, string | number | boolean> | undefined => {
  return context ? redactSensitive(context) : context
}

import { commands } from '@/lib/bindings'
import type { SecureKey } from '@/lib/settings/schema'

const SECURE_KEYS: readonly SecureKey[] = ['access-token', 'refresh-token', 'showcase-secret']

export const secureApi = {
  get: (key: SecureKey) => commands.secureGet(key),
  set: (key: SecureKey, value: string) => commands.secureSet(key, value),
  delete: (key: SecureKey) => commands.secureDelete(key),
  keysPresent: async (): Promise<SecureKey[]> => {
    const entries = await Promise.all(SECURE_KEYS.map(async (key) => ({ key, result: await commands.secureGet(key) })))
    return entries.filter(({ result }) => result.ok && result.value !== null).map(({ key }) => key)
  },
}

export type SecureApi = typeof secureApi

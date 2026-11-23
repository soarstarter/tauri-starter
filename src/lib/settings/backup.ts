import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'
import { z } from 'zod'
import { APP_ID, APP_NAME, PRODUCT_SLUG } from '@/shared/constants'
import { tauri } from '@/lib/tauri'
import { appSettingsSchema, secureKeySchema, type AppSettings, type SecureKey } from './schema'
import { CURRENT_SETTINGS_VERSION, getSettings, restoreSettings } from './store'

export const BACKUP_FORMAT_VERSION = 1

export const backupFileSchema = z.object({
  kind: z.literal('settings-backup'),
  formatVersion: z.number().int().positive(),
  appId: z.string(),
  appVersion: z.string(),
  exportedAt: z.string(),
  settingsVersion: z.number().int().positive(),
  // Unknown settings keys are stripped by the object schema, so a backup from a
  // build with extra settings still imports.
  settings: appSettingsSchema,
  /**
   * Names only — which secure keys exist on the source device. Never values.
   * Names this build doesn't know are dropped rather than failing the import.
   */
  secureKeysPresent: z
    .array(z.string())
    .transform((keys) => keys.filter((key): key is SecureKey => secureKeySchema.safeParse(key).success)),
})

export type BackupFile = z.infer<typeof backupFileSchema>

interface BuildBackupInput {
  appId: string
  appVersion: string
  settingsVersion: number
  settings: AppSettings
  secureKeysPresent: SecureKey[]
  now?: Date
}

export const buildBackup = (input: BuildBackupInput): BackupFile => ({
  kind: 'settings-backup',
  formatVersion: BACKUP_FORMAT_VERSION,
  appId: input.appId,
  appVersion: input.appVersion,
  exportedAt: (input.now ?? new Date()).toISOString(),
  settingsVersion: input.settingsVersion,
  settings: appSettingsSchema.parse(input.settings),
  secureKeysPresent: input.secureKeysPresent,
})

export const parseBackup = (raw: unknown): BackupFile => backupFileSchema.parse(raw)

export type DataExportResult = { canceled: boolean; path: string | null }
export type DataImportResult =
  | { status: 'canceled' }
  | { status: 'ok'; settings: AppSettings; secureKeysPresent: SecureKey[] }
  | { status: 'error'; message: string }

const backupFilters = [{ name: `${APP_NAME} settings backup`, extensions: ['json'] }]

export const exportSettingsBackup = async (): Promise<DataExportResult> => {
  const path = await save({
    title: 'Export settings backup',
    defaultPath: `${PRODUCT_SLUG}-settings-backup.json`,
    filters: backupFilters,
  })
  if (!path) return { canceled: true, path: null }

  const backup = buildBackup({
    appId: APP_ID,
    appVersion: await tauri.app.version(),
    settingsVersion: CURRENT_SETTINGS_VERSION,
    settings: await getSettings(),
    secureKeysPresent: await tauri.secure.keysPresent(),
  })

  await writeTextFile(path, `${JSON.stringify(backup, null, 2)}\n`)
  return { canceled: false, path }
}

export const importSettingsBackup = async (): Promise<DataImportResult> => {
  const path = await open({
    title: 'Import settings backup',
    multiple: false,
    filters: backupFilters,
  })
  if (!path || Array.isArray(path)) return { status: 'canceled' }

  try {
    const backup = parseBackup(JSON.parse(await readTextFile(path)))
    const settings = await restoreSettings(backup.settings)
    return { status: 'ok', settings, secureKeysPresent: backup.secureKeysPresent }
  } catch (error) {
    return { status: 'error', message: error instanceof Error ? error.message : 'Invalid backup file' }
  }
}

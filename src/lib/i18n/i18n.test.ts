import { describe, expect, it, vi } from 'vitest'
import { bootstrapI18n } from './bootstrap'
import i18n, { initI18n } from './index'

describe('renderer i18n', () => {
  it('initI18n loads English by default and returns translated keys', () => {
    initI18n('en')
    expect(i18n.t('settings:title')).toBe('Settings')
    expect(i18n.t('common:menu.file')).toBe('File')
  })

  it('changes language to zh and updates translations', async () => {
    initI18n('en')
    await i18n.changeLanguage('zh')
    expect(i18n.t('settings:title')).toBe('设置')
    expect(i18n.t('common:menu.file')).toBe('文件')
    await i18n.changeLanguage('en')
  })
})

describe('bootstrapI18n fallback chain', () => {
  it('uses settings.locale when it is an explicit language', async () => {
    const setSettings = vi.fn(() => Promise.resolve({}))
    const result = await bootstrapI18n({
      getSettings: () => Promise.resolve({ locale: 'zh' }),
      getSystemLocale: () => Promise.resolve('en-US'),
      setSettings,
    })
    expect(result).toEqual({ language: 'zh', source: 'settings' })
    expect(setSettings).not.toHaveBeenCalled()
    expect(i18n.language).toBe('zh')
    await i18n.changeLanguage('en')
  })

  it('falls back to the system locale when settings.locale is "system" and persists the result', async () => {
    const setSettings = vi.fn(() => Promise.resolve({}))
    const result = await bootstrapI18n({
      getSettings: () => Promise.resolve({ locale: 'system' }),
      getSystemLocale: () => Promise.resolve('zh-CN'),
      setSettings,
    })
    expect(result.language).toBe('zh')
    expect(result.source).toBe('system')
    expect(setSettings).toHaveBeenCalledWith({ locale: 'zh' })
    await i18n.changeLanguage('en')
  })

  it('falls back to en when the system locale is unsupported', async () => {
    const setSettings = vi.fn(() => Promise.resolve({}))
    const result = await bootstrapI18n({
      getSettings: () => Promise.resolve({ locale: 'system' }),
      getSystemLocale: () => Promise.resolve('fr-FR'),
      setSettings,
    })
    expect(result.language).toBe('en')
    expect(result.source).toBe('fallback')
    expect(setSettings).toHaveBeenCalledWith({ locale: 'en' })
  })

  it('falls back to en when getSystemLocale throws', async () => {
    const setSettings = vi.fn(() => Promise.resolve({}))
    const result = await bootstrapI18n({
      getSettings: () => Promise.resolve({ locale: 'system' }),
      getSystemLocale: () => Promise.reject(new Error('boom')),
      setSettings,
    })
    expect(result.language).toBe('en')
    expect(result.source).toBe('fallback')
  })
})

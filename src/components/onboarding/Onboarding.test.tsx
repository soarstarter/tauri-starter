/* @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { Onboarding } from './Onboarding'
import type { EulaConfig } from './onboarding-state'
import { initI18n } from '@/lib/i18n'

const noEula: EulaConfig = { url: '', version: 1, required: false }
const withEula: EulaConfig = { url: 'https://example.com/eula', version: 2, required: true }

beforeAll(() => {
  initI18n('en')
})

afterEach(() => {
  cleanup()
})

describe('Onboarding', () => {
  it('walks through steps and finishes with version 0 when no EULA is configured', () => {
    const onComplete = vi.fn()
    render(<Onboarding eula={noEula} onComplete={onComplete} openExternal={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Get started' }))

    expect(onComplete).toHaveBeenCalledWith(0)
  })

  it('gates finishing on EULA acceptance and reports the version', () => {
    const onComplete = vi.fn()
    const openExternal = vi.fn()
    render(<Onboarding eula={withEula} onComplete={onComplete} openExternal={openExternal} />)

    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))

    // EULA link opens externally.
    fireEvent.click(screen.getByRole('button', { name: 'Read the agreement' }))
    expect(openExternal).toHaveBeenCalledWith('https://example.com/eula')

    // Finish stays disabled until the checkbox is checked.
    const finish = screen.getByRole('button', { name: 'Get started' })
    expect(finish).toBeDisabled()
    fireEvent.click(finish)
    expect(onComplete).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('checkbox'))
    expect(finish).toBeEnabled()
    fireEvent.click(finish)
    expect(onComplete).toHaveBeenCalledWith(2)
  })
})

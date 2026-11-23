/* @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { OfflineBanner } from './OfflineBanner'
import { initI18n } from '@/lib/i18n'

const setOnline = (value: boolean) => {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value)
}

beforeAll(() => {
  initI18n('en')
})

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  cleanup()
})

describe('OfflineBanner', () => {
  it('renders nothing while the browser reports online', () => {
    setOnline(true)
    render(<OfflineBanner />)
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument()
  })

  it('renders the banner while offline', () => {
    setOnline(false)
    render(<OfflineBanner />)
    expect(screen.getByTestId('offline-banner')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/offline/i)
  })

  it('reacts to online/offline events', () => {
    setOnline(true)
    render(<OfflineBanner />)
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument()

    act(() => {
      setOnline(false)
      window.dispatchEvent(new Event('offline'))
    })
    expect(screen.getByTestId('offline-banner')).toBeInTheDocument()

    act(() => {
      setOnline(true)
      window.dispatchEvent(new Event('online'))
    })
    expect(screen.queryByTestId('offline-banner')).not.toBeInTheDocument()
  })
})

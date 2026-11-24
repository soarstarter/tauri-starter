import '@testing-library/jest-dom/vitest'

// Node 25 and later define their own global `localStorage` and `sessionStorage`, which are
// unusable unless Node starts with `--localstorage-file`. Vitest's jsdom environment only
// replaces a global Node already has when the name is on its built-in list, and these two are
// not, so tests would get Node's objects instead of jsdom's. Point them back at jsdom's.
const jsdomWindow = (globalThis as { jsdom?: { window: Window } }).jsdom?.window
if (jsdomWindow) {
  for (const key of ['localStorage', 'sessionStorage'] as const) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      get: () => jsdomWindow[key],
    })
  }
}

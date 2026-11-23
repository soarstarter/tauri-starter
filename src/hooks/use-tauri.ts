import { tauri, type Tauri } from '@/lib/tauri'

type TauriKey = keyof Tauri

/**
 * Access the typed native API, mirroring the Electron template's `useConveyor`.
 *
 *   const app = useTauri('app') // -> tauri.app
 *   const api = useTauri()      // -> the whole tauri surface
 *
 * The surface is a module singleton, so this is a thin typed accessor (no React
 * state); it stays a hook so call sites read the same as the Electron template.
 */
export function useTauri(): Tauri
export function useTauri<K extends TauriKey>(key: K): Tauri[K]
export function useTauri<K extends TauriKey>(key?: K): Tauri | Tauri[K] {
  return key ? tauri[key] : tauri
}

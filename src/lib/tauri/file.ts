import { open } from '@tauri-apps/plugin-dialog'
import { readFile } from '@tauri-apps/plugin-fs'

// Image MIME types the app accepts for user-supplied pictures. Kept here as the
// single source of truth — mirrors the Electron template's `file-schema`
// `imageMimeType`. The file picker below maps file extensions back to it.
export const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export type ImageMimeType = (typeof IMAGE_MIME_TYPES)[number]

const EXTENSION_MIME: Record<string, ImageMimeType> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
}

const mimeForExtensions = (accept: readonly ImageMimeType[]): string[] => {
  const exts = new Set<string>()
  for (const [ext, mime] of Object.entries(EXTENSION_MIME)) {
    if (accept.includes(mime)) exts.add(ext)
  }
  return [...exts]
}

const mimeFromPath = (path: string): ImageMimeType | null => {
  const ext = path.split('.').pop()?.toLowerCase() ?? ''
  return EXTENSION_MIME[ext] ?? null
}

export interface OpenImageOptions {
  /** Allowed MIME types (also drives the dialog's extension filter). */
  accept: readonly ImageMimeType[]
  /** Reject files larger than this many bytes before returning. */
  maxBytes: number
}

export type OpenImageResult =
  { canceled: true } | { canceled: false; bytes: Uint8Array; mimeType: ImageMimeType; path: string }

/**
 * Native image picker built on the dialog + fs plugins — the Tauri successor to
 * the Electron template's `conveyor.file.openImage`. Opens a single-file dialog
 * filtered to the accepted image extensions, reads the bytes, and infers the
 * MIME type from the extension. Enforces `maxBytes` and the `accept` allowlist
 * here so a mismatched pick is rejected before the caller ever sees its bytes.
 */
export const openImage = async ({ accept, maxBytes }: OpenImageOptions): Promise<OpenImageResult> => {
  const selected = await open({
    multiple: false,
    directory: false,
    filters: [{ name: 'Images', extensions: mimeForExtensions(accept) }],
  })
  if (!selected || Array.isArray(selected)) return { canceled: true }

  const mimeType = mimeFromPath(selected)
  if (!mimeType || !accept.includes(mimeType)) {
    throw new Error('Unsupported image type')
  }

  const bytes = await readFile(selected)
  if (bytes.byteLength > maxBytes) {
    throw new Error(`Image exceeds ${maxBytes} bytes`)
  }

  return { canceled: false, bytes, mimeType, path: selected }
}

export const fileApi = {
  openImage,
} as const

export type FileApi = typeof fileApi

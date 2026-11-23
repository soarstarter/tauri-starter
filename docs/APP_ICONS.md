# App & Tray Icons

How to change the desktop (dock / taskbar / installer) icon and the system-tray
icon, and how to regenerate every derived asset from a single source image.

## App icon — `pnpm tauri icon`

Tauri generates the entire per-platform icon set from **one square source PNG**
(1024×1024 recommended, with transparency). Unlike the Electron template you do
not hand-run `sips`/`iconutil`/`png-to-ico` — the Tauri CLI does it:

```sh
pnpm tauri icon path/to/your-icon.png
```

This regenerates everything under [`src-tauri/icons/`](../src-tauri/icons/):

```
src-tauri/icons/
  32x32.png              # Linux / small
  128x128.png            # Linux
  128x128@2x.png         # Linux retina
  icon.icns              # packaged macOS app bundle icon
  icon.ico               # packaged Windows app + installer icon
  icon.png               # generic 512-ish source-derived PNG
  Square*Logo.png        # Windows Store / MSIX tiles
  StoreLogo.png
  android/  ios/         # mobile targets (unused for desktop-only builds)
```

`tauri.conf.json` references the desktop subset explicitly:

```jsonc
"bundle": {
  "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png",
           "icons/icon.icns", "icons/icon.ico"],
  "windows": {
    "nsis": { "installerIcon": "icons/icon.ico", "uninstallerIcon": "icons/icon.ico" }
  }
}
```

After regenerating, run the app (`pnpm dev`) to confirm the dock/taskbar icon,
and cut a build to check the installer icon.

## Tray icon

The system tray is created in
[`src/lib/tray/app-tray.ts`](../src/lib/tray/app-tray.ts). It imports the tray
PNGs as Vite assets, loads their bytes at runtime, and passes those bytes to
Tauri's `TrayIcon` API.

The dedicated monochrome tray assets live in
[`resources/build/tray/`](../resources/build/tray/):

```
resources/build/tray/
  icon-template.svg      # SOURCE — monochrome mark for the macOS menu bar
  icon-template.png      # 22x22  — macOS menu-bar template (@1x)
  icon-template-2x.png   # 44x44  — macOS menu-bar template (@2x / retina)
  icon-light.png         # 22x22  — Windows/Linux tray (light)
  icon-dark.png          # 22x22  — Windows/Linux tray (dark)
```

macOS uses `icon-template.png` with `iconAsTemplate: true` so the OS tints the
mark to match the menu bar. Windows and Linux use `icon-light.png` or
`icon-dark.png` without template tinting, selected from the OS color scheme and
refreshed if that color scheme changes.

### Tray design conventions

- **Template** (`icon-template.svg`): the mark **only** (no background square),
  solid black `#000` on a transparent canvas. macOS uses the alpha channel and
  recolors it (white on dark bars, black on light). Pad the `viewBox` so the mark
  fills ~60% of the icon — it should read comfortably next to neighboring
  menu-bar icons. Widen the `viewBox` to shrink the mark; tighten it to enlarge.
- **Light/dark** (`icon-light.png` / `icon-dark.png`): colored 22×22 PNGs for
  Windows/Linux, selected by the OS theme.

Only the `*.svg` is hand-edited; regenerate the PNGs from it (macOS `sips` works
without extra tooling):

```sh
cd resources/build/tray
sips -s format png --resampleHeightWidth 22 22 icon-template.svg --out icon-template.png
sips -s format png --resampleHeightWidth 44 44 icon-template.svg --out icon-template-2x.png
```

> Keep the source SVGs simple (avoid filters/masks) so they rasterize identically
> across renderers.

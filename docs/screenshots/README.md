# Screenshots

The root README shows `home.png` (hero), `showcase.png`, and `settings.png`
from this folder. They are shots of the stock template — recapture them from
your **rebranded** app so the marketing assets match your product.

## What to capture

Capture these on a clean window (hide personal data), at 2× scale where possible,
and save them here with the filenames below. Only the first three ship today and
are wired into the README; the rest are optional extras:

| File                  | View                 | How to get there                                |
| --------------------- | -------------------- | ----------------------------------------------- |
| `home.png`            | Home (README hero)   | Sidebar → Home                                  |
| `showcase.png`        | Showcase catalog     | Sidebar → Showcase                              |
| `settings.png`        | Settings center      | Sidebar → Settings (show the tabs + search box) |
| `command-palette.png` | Command palette      | Press `Cmd/Ctrl+K`                              |
| `onboarding.png`      | First-run onboarding | Reset settings, then relaunch                   |

A short GIF (`overview.gif`) of navigating the Settings center, toggling the
accent color, and opening the Showcase makes a strong hero asset.

## Wiring them into the README

Once captured, reference any extra shots from the **Screenshots** section of the root
`README.md`, e.g.:

```md
<p align="center"><img src="docs/screenshots/settings.png" width="720" /></p>
```

## Capturing on macOS

With `pnpm dev` running, `screencapture -o -l <window-id> docs/screenshots/home.png` captures just the app window. Jump
to another page by launching the app again with a route, which the running instance picks up:
`src-tauri/target/debug/tauri-starter --route=/settings`.

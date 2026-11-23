# Capabilities — the Tauri ACL

In the Electron template, the security boundary between the renderer and the OS
was the **preload script**: a hand-written bridge that decided which main-process
functions the web content could reach. Tauri replaces that with a declarative
**capabilities ACL**. Instead of exposing functions imperatively, you grant a
window a fixed set of _permissions_, and the webview can call **only** the
commands and plugin APIs those permissions cover. Anything not granted is
rejected by the Rust core before your code runs.

This is a strictly tighter model: there is no ambient `window.__TAURI__` surface
that "just works" — every capability is enumerated in
[`src-tauri/capabilities/`](../src-tauri/capabilities/) and checked at runtime.

## Where it lives

The app ships a single capability file,
[`src-tauri/capabilities/default.json`](../src-tauri/capabilities/default.json),
scoped to the `main` window:

```jsonc
{
  "identifier": "default",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-minimize",
    "core:webview:allow-set-webview-zoom",
    "deep-link:default",
    "store:default",
    // …
    {
      "identifier": "opener:allow-open-url",
      "allow": [{ "url": "https://**" }, { "url": "mailto:*" }],
    },
  ],
}
```

Permission identifiers are `plugin:permission` (e.g. `store:default`,
`notification:default`) or `core:namespace:allow-<command>` for the built-in
core APIs (window, webview, event). The generated schema at
`src-tauri/gen/schemas/` gives editor autocompletion for every available id.

## The two rules this template follows

1. **No wildcards.** We never grant `"*"` or a plugin's blanket `allow-all`
   permission. Each entry is the _narrowest_ permission that unlocks exactly what
   a shipped feature needs — e.g. `core:window:allow-minimize` rather than a
   catch-all window permission, and `global-shortcut:allow-register` /
   `allow-unregister-all` rather than the full plugin surface.

2. **Scope where the permission supports it.** Permissions that accept a scope
   object are constrained to concrete resources. The opener is the clearest
   example: `opener:allow-open-url` is restricted to `https://**` and `mailto:*`,
   so the guarded external-link helper can open web links and mail but nothing
   can hand the OS an arbitrary `file://` or custom-scheme URL.

## How permissions map to features

| Feature                           | Permissions granted                                                          |
| --------------------------------- | ---------------------------------------------------------------------------- |
| Window controls / custom titlebar | `core:window:allow-minimize/maximize/close/start-dragging/…`                 |
| Webview zoom                      | `core:webview:allow-set-webview-zoom`                                        |
| Typed events (intents, status)    | `core:event:allow-listen`, `core:event:allow-unlisten`                       |
| Deep links                        | `deep-link:default`                                                          |
| Window-state persistence          | `window-state:default`                                                       |
| Settings store                    | `store:default`                                                              |
| Backup export/import              | `dialog:default`, `fs:allow-read/write-text-file`, `fs:allow-read-file`      |
| Launch at login                   | `autostart:default`                                                          |
| Logging                           | `log:default`                                                                |
| Notifications                     | `notification:default`                                                       |
| Global shortcuts                  | `global-shortcut:allow-register`, `allow-unregister-all`                     |
| Diagnostics                       | `os:default`                                                                 |
| Guarded external links            | scoped `opener:allow-open-url` (`https`/`mailto`) + `opener:allow-open-path` |

Secure storage does **not** appear here: it is exposed as custom
`#[tauri::command]`s (`secure_get`/`secure_set`/`secure_delete`) over the
`keyring` crate, keyed by a Rust enum so the webview can't probe arbitrary
credential names. Custom commands are gated by being registered in the
`invoke_handler`, not by a plugin permission.

## Extending permissions safely

When you add a command or reach for a new plugin API and hit an ACL denial:

1. **Find the narrowest permission** that covers the call. Check the plugin's
   docs or the autocompletion from `gen/schemas/` — prefer a specific
   `allow-<command>` over the plugin's `default` bundle, and a `default` bundle
   over anything named `allow-all`.
2. **Add a scope** if the permission takes one (paths, URLs, event names).
   Constrain it to the concrete resources your feature touches.
3. **Add it to `default.json`** (or a new capability file for a different
   window). Keep the entries grouped and commented like the existing ones.
4. **Justify it in review.** The cross-cutting PR checklist requires every new
   command to ship with "a capability entry scoped to exactly what it needs."
5. **Re-run the gate.** `pnpm tauri build --no-bundle` validates the capability
   file against the generated schema.

## Further reading

- Tauri v2 security & capabilities: <https://tauri.app/security/capabilities/>
- Permissions reference: <https://tauri.app/security/permissions/>

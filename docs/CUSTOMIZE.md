# Customizing This Template

Two jobs turn the template into your app: give it your brand, then remove the Showcase. Do them in that order; the
brand change is small and easy to check on its own.

## Rebrand

Brand identity lives in `shared/constants.ts`. The frontend reads it, so changing it there updates the About page, Help
links, mailto subjects, and the deep-link scheme the app parses. The Rust side and the bundler cannot import TypeScript,
so a few files carry the same values by hand.

| What                       | Where                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| App id, name, slug, scheme | `APP_ID`, `APP_NAME`, `PRODUCT_SLUG`, `PROTOCOL_SCHEME` in `shared/constants.ts`                                       |
| Support and project links  | `SUPPORT_EMAIL`, `REPO_URL`, `HOMEPAGE_URL`, `LICENSE_URL` in `shared/constants.ts`                                    |
| Optional EULA gate         | `EULA_URL` and `EULA_VERSION` in `shared/constants.ts`                                                                 |
| Bundle identity            | `productName`, `identifier`, window `title`, deep-link `schemes`, and `bundle` metadata in `src-tauri/tauri.conf.json` |
| macOS window title         | `title` in `src-tauri/tauri.macos.conf.json`                                                                           |
| Rust crate                 | `name`, `description`, `authors`, and the `[lib]` name in `src-tauri/Cargo.toml` (and `src-tauri/src/main.rs`)         |
| Keychain entries           | `SERVICE_NAME` in `src-tauri/src/commands/secure.rs`                                                                   |
| Log file name              | the `LogDir` target in `src-tauri/src/lib.rs` and the file name in `src-tauri/src/commands/logs.rs`                    |
| npm metadata               | `name`, `version`, `description`, `author`, `homepage`, `repository`, `bugs` in `package.json`                         |
| Window title before load   | `<title>` in `index.html`                                                                                              |
| Display name in the UI     | `appName` in `src/locales/*/common.json`                                                                               |
| Icons                      | `src-tauri/icons/` and `resources/build/` — see [APP_ICONS.md](APP_ICONS.md)                                           |
| Deep-link examples         | `src/lib/intents/parse.test.ts` and the Showcase components gallery                                                    |

Tauri keeps settings and logs in folders named after `identifier`, and secure storage is keyed by `SERVICE_NAME`, so a
renamed build starts with fresh settings and an empty keychain slot.

Check the result with `pnpm dev` (window title, About, Help links) and `pnpm build` (bundle name, protocol
registration).

## Remove the Showcase

1. Set the showcase flag to `false` in `.env`:

   ```sh
   VITE_SHOWCASE_ENABLED=false
   ```

   This controls the frontend routes, sidebar zone, Home sections, and
   command-palette group. The native menu is built in TypeScript, so its
   Template menu reads the same flag.

2. Run the app (`pnpm dev`) and confirm the Template sidebar zone, Showcase
   routes, palette showcase group, Template menu, and Home showcase sections are
   all hidden.

3. Delete the demo-only folders. `src/showcase/` also holds `pro-catalog.ts`,
   the list of commercial-edition capabilities shown at the end of the
   Showcase, so it goes with the rest:

   ```sh
   rm -rf src/routes/showcase src/showcase
   ```

4. Remove the `[template-demo]` touchpoints from core files (each is marked with
   a `// [template-demo] Safe to delete — see docs/CUSTOMIZE.md.` comment):
   - The `showcaseConfig.enabled` route block and showcase lazy imports in
     [`src/App.tsx`](../src/App.tsx).
   - The `template` sidebar group in
     [`src/components/layout/sidebar-items.ts`](../src/components/layout/sidebar-items.ts).
   - The showcase source and catalog import in
     [`src/components/command-palette/command-sources.ts`](../src/components/command-palette/command-sources.ts).
   - The Showcase-derived Home sections and catalog imports in
     [`src/routes/HomePage.tsx`](../src/routes/HomePage.tsx).
   - The Template menu block in [`src/lib/menu/app-menu.ts`](../src/lib/menu/app-menu.ts)
     and its labels in [`src/lib/menu/labels.ts`](../src/lib/menu/labels.ts).
   - The showcase flag plumbing in [`shared/config.ts`](../shared/config.ts) and
     [`shared/feature-flags.ts`](../shared/feature-flags.ts).
   - The `/showcase*` route entries in
     [`src/lib/intents/routes.ts`](../src/lib/intents/routes.ts).
   - The showcase locale imports and namespace registration in
     [`src/lib/i18n/resources.ts`](../src/lib/i18n/resources.ts).
   - Showcase-specific tests in `shared/config.test.ts`,
     `shared/feature-flags.test.ts`, `src/lib/intents/parse.test.ts`,
     `src/components/layout/sidebar-items.test.ts`,
     `src/components/command-palette/command-sources.test.ts`, and
     `src/showcase/capability-catalog.test.ts`.
   - Showcase-facing labels in `src/locales/*/common.json` once no remaining UI
     reads them.

5. Delete the showcase locale files:

   ```sh
   rm src/locales/en/showcase.json src/locales/zh/showcase.json
   ```

6. Add your product pages to the `workspace` sidebar group and register their
   routes in [`src/App.tsx`](../src/App.tsx).

7. Run the verification pass:

   ```sh
   pnpm format:check
   pnpm lint:check
   pnpm typecheck
   pnpm test:unit
   ```

## Audit Helper

Search for the marker to find demo-related leftovers:

```sh
rg "template-demo"
```

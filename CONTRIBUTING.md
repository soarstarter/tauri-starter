# Contributing

Thanks for helping improve Tauri Starter.

## How this repository is maintained

Tauri Starter is the open-source edition of SoarStarter's Tauri template. New features are built in the commercial
edition first and then synced here, so this repository mostly receives those syncs plus community fixes. Pull requests
that are merged here are also ported back, so the two editions stay in step.

That makes some contributions a better fit than others:

- **Welcome:** bug fixes, documentation fixes, accessibility and platform-compatibility fixes, test coverage, and small
  improvements to existing features.
- **Please open an issue first:** new features, new dependencies (npm packages or Rust crates), new Tauri plugins or
  capability grants, or changes to the Rust commands, settings schema, or folder layout. A short discussion avoids work
  that cannot be merged.
- **Out of scope:** features that need a backend service (accounts, payments, cloud sync, telemetry) or a release
  pipeline (signing, update feeds). This edition is intentionally fully local.

## Development setup

Requires Node.js `^20.19.0 || >=22.12.0`, pnpm 11, and the Rust toolchain plus your platform's system dependencies from
the [Tauri prerequisites guide](https://tauri.app/start/prerequisites/).

```bash
pnpm install
pnpm dev
```

## Before you open a pull request

Run the same checks as CI:

```bash
pnpm check:lite
pnpm format:check
pnpm lint:check
pnpm typecheck
pnpm test:unit
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml
```

`cargo test` also regenerates `src/lib/bindings.ts` from the Rust commands. Commit that file whenever it changes; CI
fails if it drifts from the Rust source. Never edit it by hand.

`pnpm check:lite` keeps this repository free of commercial-edition code. It needs
[gitleaks](https://github.com/gitleaks/gitleaks) for its secret scan; without it, run
`pnpm check:lite --skip-secrets` locally and let CI run the full check. The same check runs as a pre-push hook, which
`pnpm install` enables.

For UI or native changes, also check the behavior in `pnpm dev` and include a screenshot or short recording in the pull
request.

## Conventions

- TypeScript in the frontend; Prettier formatting (2 spaces, single quotes, no semicolons, 120 columns). Rust follows
  `rustfmt` and passes `clippy` with warnings denied.
- Components use `PascalCase.tsx`; hooks use `use-kebab-case.ts`; other modules use `kebab-case.ts`.
- New native calls are `#[tauri::command]` + `#[specta::specta]` functions in `src-tauri/src/commands/`, registered in
  `src-tauri/src/lib.rs`, with a test. Plugin permissions go in `src-tauri/capabilities/default.json`, scoped to exactly
  what the feature needs.
- Put frontend tests next to the code they cover as `*.test.ts` or `*.test.tsx`, and Rust tests in a `#[cfg(test)]`
  module.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org) (`fix: …`, `feat: …`, `docs: …`).

By contributing, you agree that your contribution is licensed under the [MIT License](LICENSE).

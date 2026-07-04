# SlideWeb

<p align="center">
  <img src="assets/slide-web-icon.png" alt="SlideWeb app icon" width="128" />
</p>

SlideWeb is a small Electron companion app that lives at the side of the
screen. It lets you keep web pages one shortcut away, add pages from a compact
sidebar, and search with Google or Baidu before pinning a result.

## Features

- Slide-over Electron window with a narrow tab rail.
- Persistent web tabs with favicon-based sidebar icons.
- Add URLs directly, or search first and pin a selected result.
- Search results stay inside the add popup, including verification and captcha
  flows.
- Settings update immediately without a separate save step.
- Configurable global show/hide shortcut.
- GitHub Actions release workflow for macOS and Windows packages.

## Tech Stack

- Electron 34
- React 18
- TypeScript
- electron-vite
- electron-builder
- Vitest
- pnpm 11.7.0

## Requirements

- Node.js 22
- pnpm 11.7.0

## Getting Started

```bash
pnpm install
pnpm dev
```

The app starts an Electron development process and a Vite renderer dev server.

## Scripts

```bash
pnpm dev        # Start the Electron app in development mode
pnpm build      # Build main, preload, and renderer bundles into out/
pnpm start      # Preview the built Electron app
pnpm typecheck  # Run TypeScript checks
pnpm test       # Run Vitest tests
pnpm dist       # Build packaged artifacts for the current platform
pnpm dist:mac   # Build macOS DMG/ZIP artifacts
pnpm dist:win   # Build Windows NSIS/ZIP artifacts
```

## Project Layout

```text
src/main/       Electron main process: window, views, tabs, search, IPC
src/preload/    Safe bridge exposed as window.slideweb
src/renderer/   React UI for rail, add popup, settings, and empty state
src/shared/     Shared types and navigation/search URL helpers
assets/         README images and project visual assets
build/          macOS signing entitlements
docs/           Release and signing notes
```

## Release Builds

Releases are built by `.github/workflows/release.yml` when a version tag such as
`v1.0.1` is pushed, and can also be started manually with `workflow_dispatch`.

The workflow builds macOS and Windows artifacts, uploads them as workflow
artifacts, and creates a GitHub Release named after the package version, such as
`v1.0.1`.

macOS packages can be unsigned, but public distribution should use Developer ID
signing and Apple notarization. See `docs/release.md` for the required GitHub
Secrets.

## Testing

Run the fast checks before shipping changes:

```bash
pnpm typecheck
pnpm test
pnpm build
```

Navigation and search-engine behavior is covered in
`src/shared/navigation.test.ts`. Add tests there when changing URL detection,
redirect handling, captcha handling, or search result pinning behavior.

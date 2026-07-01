# Agent Guide

This file is for future coding agents working on Slide Web.

## First Read

- `README.md` for project usage, scripts, and release overview.
- `docs/release.md` before touching macOS signing or notarization.
- `src/shared/types.ts` before adding IPC methods or renderer APIs.
- `src/shared/navigation.ts` before changing search, redirect, or captcha flows.

## Architecture Notes

- `src/main/index.ts` owns the Electron `BaseWindow`, `WebContentsView` layout,
  persisted tabs, global shortcut, search popup WebContentsView, and IPC
  handlers.
- `src/preload/index.ts` exposes the typed `window.slideweb` bridge. Keep this
  bridge narrow and explicit.
- `src/renderer/src/App.tsx` owns high-level React state and overlay visibility.
- `src/renderer/src/components/` contains rail, add popup, settings, preview,
  and empty-state UI.
- `src/shared/navigation.ts` is shared by renderer/main and has tests. Prefer
  putting URL classification logic there instead of duplicating it.

## Important Behavior

- Search results open inside an AddBar popup WebContentsView. Do not replace it
  with a normal renderer iframe.
- Search-engine internal pages, redirects, consent pages, captcha pages, and
  verification pages should stay inside the popup.
- Only real external main-frame navigations from search should add a tab to the
  sidebar.
- Tab favicon domains come from each tab's stored `host`; main-process tab views
  must sync final navigation URLs after redirects.
- Settings changes are immediate. Do not reintroduce a save/done button unless
  the product behavior changes intentionally.
- The sidebar should not create horizontal scrolling; long tab titles belong in
  the floating rail tooltip.

## Commands

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
```

Use `pnpm dev` to run the app locally. Restart it after main-process changes.

## Editing Rules

- Do not edit generated output in `out/`, `release/`, or `node_modules/`.
- Keep TypeScript strict and avoid widening IPC payloads casually.
- Update `src/shared/types.ts`, `src/preload/index.ts`, and `src/main/index.ts`
  together when adding a new renderer-facing API.
- Add or update Vitest coverage when changing `src/shared/navigation.ts`.
- Preserve Electron security defaults: `contextIsolation: true` and
  `sandbox: true`.
- Keep release artifacts out of git; `release/` is ignored.

## Release Notes

- Packaging is configured in the `build` field of `package.json`.
- GitHub Actions creates releases on pushes to `main` or `master`.
- macOS signing uses `CSC_LINK` and `CSC_KEY_PASSWORD`.
- macOS notarization prefers `APPLE_API_KEY_BASE64`, `APPLE_API_KEY_ID`, and
  `APPLE_API_ISSUER`.

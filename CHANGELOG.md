# Changelog

All notable changes to this project are documented here.
This file follows the versioned format used by GitHub Releases and Conventional Commits-style sections.

## [v1.0.6](https://github.com/lynnjinjie/slide-web/compare/v1.0.5...v1.0.6) - 2026-07-16

### Features

- add a native tab context menu with reload and close actions

### Bug Fixes

- keep the tab close button fully visible without reintroducing horizontal sidebar scrolling

## [v1.0.5](https://github.com/lynnjinjie/slide-web/compare/v1.0.4...v1.0.5) - 2026-07-06

### Features

- add light, dark, and system theme switching in Settings
- persist the selected theme and apply system appearance changes immediately

### Bug Fixes

- keep back and forward tooltips visible when they would otherwise be clipped by the sidebar

## [v1.0.4](https://github.com/lynnjinjie/slide-web/compare/v1.0.3...v1.0.4) - 2026-07-06

### Bug Fixes

- prefer site-provided favicons and keep Google favicon lookup only as a fallback
- persist resolved tab favicon URLs and clear stale icons after cross-domain navigation

## [v1.0.3](https://github.com/lynnjinjie/slide-web/compare/v1.0.2...v1.0.3) - 2026-07-04

### Bug Fixes

- show a friendly manual-install message when macOS in-app updates cannot pass Developer ID signature validation
- document that macOS in-app updates require compatible Developer ID signing

## [v1.0.2](https://github.com/lynnjinjie/slide-web/compare/v1.0.1...v1.0.2) - 2026-07-04

### Features

- add a low-noise update reminder badge on the settings icon for available or downloaded updates ([efda73f](https://github.com/lynnjinjie/slide-web/commit/efda73f20948f174dc5c372974f7bc83fa475114))

### Build

- run the release workflow only after pushing version tags ([44d484e](https://github.com/lynnjinjie/slide-web/commit/44d484e50eaa9590bee4aa511172d3276926b8b1))
- generate grouped changelog notes for GitHub Releases from commits between tags ([44d484e](https://github.com/lynnjinjie/slide-web/commit/44d484e50eaa9590bee4aa511172d3276926b8b1))

## [v1.0.1](https://github.com/lynnjinjie/slide-web/compare/v1.0.0...v1.0.1) - 2026-07-04

### Bug Fixes

- fix app updater download by providing `app-update.yml` and a runtime updater config fallback ([b4d8c89](https://github.com/lynnjinjie/slide-web/commit/b4d8c89c09f0568b70628550aff28a7f4e6468dd))
- render GitHub release notes as plain text instead of showing raw HTML tags ([b4d8c89](https://github.com/lynnjinjie/slide-web/commit/b4d8c89c09f0568b70628550aff28a7f4e6468dd))

### Build

- rename the packaged app and release title to `SlideWeb` without spaces ([944edc5](https://github.com/lynnjinjie/slide-web/commit/944edc58e30e923684b41f8455e8a4c350425510))

## [v1.0.0](https://github.com/lynnjinjie/slide-web/compare/v0.1.0...v1.0.0) - 2026-07-04

### Features

- add in-app update checking, download, and install flow backed by GitHub Releases ([8b426a7](https://github.com/lynnjinjie/slide-web/commit/8b426a760ee90395bee39301db8b7619aee88674))
- add a settings switch to hide the app when it loses focus ([94c2912](https://github.com/lynnjinjie/slide-web/commit/94c291201973966556aba8f40d8ae8ea42f92825))

### Bug Fixes

- fix macOS application icon assets for Finder, Dock, and launchers ([d4b8db6](https://github.com/lynnjinjie/slide-web/commit/d4b8db6eab3cebd806f6be33d07a6441bf68b51c))
- make the settings panel scrollable when its content exceeds the window height ([94c2912](https://github.com/lynnjinjie/slide-web/commit/94c291201973966556aba8f40d8ae8ea42f92825))

### Documentation

- document the app, release workflow, and signing requirements ([94c2912](https://github.com/lynnjinjie/slide-web/commit/94c291201973966556aba8f40d8ae8ea42f92825))

## [v0.1.0](https://github.com/lynnjinjie/slide-web/releases/tag/v0.1.0) - 2026-07-02

### Features

- add GitHub Actions release packaging for macOS and Windows artifacts ([54e92a6](https://github.com/lynnjinjie/slide-web/commit/54e92a60a3bee0194d830bfd1ab46d40445f9ebe))
- add application icon assets and wire them into packaged builds ([55dead0](https://github.com/lynnjinjie/slide-web/commit/55dead0b0c1b4a091a4a5575dfe428203685183a))

### Bug Fixes

- fix GitHub release asset upload handling ([3728484](https://github.com/lynnjinjie/slide-web/commit/37284843ca682157d17523c479cbd8f04178a100))
- use package versions for release tags ([63ce684](https://github.com/lynnjinjie/slide-web/commit/63ce684ce1425e8e383be639e3a212e70bc7c59e))
- fix unsigned macOS release signing for CI-built artifacts ([e5b8626](https://github.com/lynnjinjie/slide-web/commit/e5b862696c975d1df13609944f8f6bd4c18aed26))

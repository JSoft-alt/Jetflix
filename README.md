# Jetflix

Jetflix is a cross-platform Electron desktop app for browsing, streaming, and downloading movies, TV series, and anime.

## Development

Requirements: Node.js 22.12 or newer and npm.

```bash
npm ci
npm start
```

## Build an installer

Build the installer/package for the current operating system:

```bash
npm run dist
```

Artifacts are written to `dist/`. The native targets are:

- macOS: universal `.dmg` (Intel and Apple silicon)
- Windows: `.exe` NSIS installer
- Linux: `.AppImage`, `.deb`, `.rpm`, and `.pacman`

`npm run dist:all` requests every target locally, but desktop installers rely on platform-native tooling. For a reliable all-platform build, push this repository to GitHub and run the included native matrix workflow with one command:

```bash
npm run release:all
```

This requires GitHub CLI to be installed and authenticated, and `origin` must point to the private Jetflix repository. The **Build installers** workflow uploads each platform's installer as a private Actions artifact. Pushing a version tag such as `v1.0.0` also publishes the installers to a private repository release.

Automatic in-app update checks are intentionally disabled for private-repository builds because an installed desktop app cannot securely read private releases without user authentication. The private workflow still builds and stores installers. A separate authenticated or public release channel must be configured before enabling automatic updates.

### Optional public-release signing

Unsigned installers are fine for local testing. For trusted public releases, add these GitHub Actions repository secrets before running the workflow:

- macOS: `MAC_CSC_LINK`, `MAC_CSC_KEY_PASSWORD`, `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID`
- Windows: `WIN_CSC_LINK` and `WIN_CSC_KEY_PASSWORD`

When the macOS credentials are present, electron-builder signs and notarizes the app. Without credentials, the workflow still produces unsigned installers.

## Brand assets

The original black-background master is preserved as `public/logo-source.png`. The user-supplied transparent master is preserved as `public/logo-transparent-source.png`, with a centered square derivative at `public/logo-transparent.png` for the in-app logo slot. Operating-system and installer icons retain the required square black field. No asset has an added wordmark.

## License

Jetflix remains licensed under GPL-3.0. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

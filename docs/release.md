# Release Signing

GitHub Actions builds unsigned artifacts by default. To produce macOS releases
that pass Gatekeeper without manual overrides, configure these repository
secrets:

## macOS Code Signing

- `CSC_LINK`: Base64-encoded `Developer ID Application` `.p12` certificate, or a
  secure URL to that certificate.
- `CSC_KEY_PASSWORD`: Password for the `.p12` certificate.

## macOS Notarization

Prefer App Store Connect API key notarization:

- `APPLE_API_KEY_BASE64`: Base64-encoded `.p8` App Store Connect API key.
- `APPLE_API_KEY_ID`: App Store Connect API key ID.
- `APPLE_API_ISSUER`: App Store Connect issuer UUID.

Alternatively, use Apple ID credentials:

- `APPLE_ID`: Apple Developer account email.
- `APPLE_APP_SPECIFIC_PASSWORD`: App-specific password, not the Apple ID password.
- `APPLE_TEAM_ID`: Apple Developer team ID.

If signing or notarization secrets are missing, the workflow still builds the
artifacts and prints a warning that the macOS release is unsigned or
unnotarized.

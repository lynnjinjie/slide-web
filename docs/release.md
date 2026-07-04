# Release Signing

GitHub Actions can build ad-hoc signed macOS artifacts without Apple secrets, but
public macOS releases still need Developer ID signing and Apple notarization to
open without Gatekeeper prompts.

If a downloaded macOS build shows `"SlideWeb.app" is damaged and can't be
opened`, the app is usually blocked by quarantine/Gatekeeper rather than
actually corrupted. For local testing of an unsigned or ad-hoc signed build, run:

```bash
xattr -dr com.apple.quarantine "/Applications/SlideWeb.app"
```

For public distribution without manual overrides, configure these repository
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

If signing or notarization secrets are missing, the workflow still builds macOS
artifacts with an ad-hoc signature and prints a warning that the release is not
Developer ID signed or notarized.

## macOS In-App Updates

macOS in-app updates use Squirrel.Mac, which validates the downloaded `.app`
against the currently installed app's code signature. Both the installed app and
the update must be signed with a compatible Developer ID certificate.

Ad-hoc signed or unsigned macOS builds can be installed manually, but they cannot
reliably update themselves in-app. Users on those builds should download and
install the next release manually. After a Developer ID signed build is installed,
future signed releases can be installed through the app update flow.

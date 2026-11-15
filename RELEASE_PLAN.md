# RELEASE PLAN — shipping AI Usage Tracker to other people

You have a working local app. Publishing changes the problem: strangers' machines, SmartScreen,
updates, trust, and support. This plan takes it from `pnpm tauri dev` to a signed, auto-updating
v1.0 that anyone can install in two clicks.

**Scope:** Windows 10/11 x64. Everything below assumes that.

---

## 0. Decide three things first (they're expensive to change later)

| Decision | Options | Recommendation | If you get it wrong |
|---|---|---|---|
| **Bundle identity** | `productName`, `identifier` | `AI Usage` + `io.github.<yourname>.aiusage` — **set it before the first public release** | Changing it later orphans `%APPDATA%` data and breaks update continuity |
| **Open source?** | Public MIT repo / private | **Public MIT** | Unlocks free OSS code signing (Certum, SignPath) and is the only realistic way to answer "why does a widget read my credentials file?" |
| **Signing budget** | Certum OSS (≈€30–70/yr) · OV cert ($200–400/yr) · Azure Trusted Signing ($9.99/mo, country-restricted) · unsigned | **Certum OSS certificate** if the repo is public; otherwise ship unsigned with a clear warning | Unsigned = "Windows protected your PC" on every install; many users stop there |

`identifier` and `productName` are baked into the installer, the registry entries, the app-data
folder, and the updater. Pick them now.

---

## 1. Release blockers in the current code

Fix these before anyone else runs it. They're specific to what this app does.

### 1.1 A machine without Claude or Antigravity must not crash

Your sources assume files and processes exist. A fresh install on a stranger's PC has neither
`~/.claude/.credentials.json` nor `agy.exe`. Audit every path:

```powershell
cd src-tauri
Select-String -Path .\src\**\*.rs -Pattern "unwrap\(\)|expect\(" | Select-Object -First 50
```

Every `unwrap()` on a file read, a process lookup, a JSON field, or a DB row must become a status:

```rust
SourceHealth::NeedsSetup("Claude Code not detected — install it or connect an API key")
```

Rule: **the app must open and render on a bare Windows VM with nothing installed.** Empty states are
a feature, not an edge case.

### 1.2 `netsh` parsing breaks on non-English Windows

`netsh wlan show interfaces` is **localized**. A German or Japanese Windows returns different labels,
so the Wi-Fi pill will show garbage or a parse error for a large share of users.

Two options:

1. **Cut the Wi-Fi feature for 1.0** (recommended). It's unrelated to AI usage, adds a
   privacy smell to a tool that already reads a credentials file, and increases antivirus surface.
   Reviewers will ask "why does my usage tracker monitor my network?" — you don't want that question.
2. Keep it, but use the `WlanApi` Win32 API (locale-independent) or hide the pill entirely when
   parsing fails. Never render a broken number.

### 1.3 The credentials read needs to be explained, not hidden

This is the single biggest trust hurdle. A tool that reads `%USERPROFILE%\.claude\.credentials.json`
and makes HTTPS calls looks exactly like an infostealer to a security reviewer.

Ship all four:

- **Source visible** — the function is ~15 lines; link it directly in the README.
- **PRIVACY.md** stating: reads `claudeAiOauth.accessToken` and `expiresAt` only; never writes,
  refreshes, or logs the token; the token is sent only to `api.anthropic.com`; no analytics, no
  crash reporting, no cloud.
- **An in-app "What this app reads" screen** on first run, with the exact paths.
- **A visible "Local only" badge** in Settings.

### 1.4 Hardcoded developer paths

```powershell
Select-String -Path .\src\**\*,.\src-tauri\src\**\*,.\*.md -Pattern "C:\\Users\\|file:///C:"
```

Your project summary contains `file:///C:/Users/USER/...` links. Scrub them from anything that ships
(README, docs, comments). They leak your username and machine layout.

### 1.5 Debug leftovers

```powershell
Select-String -Path .\src\**\*.tsx -Pattern "console\.log|USE_MOCKS"
Select-String -Path .\src-tauri\src -Pattern "dbg!|println!"
```

`USE_MOCKS` must be `false` and unreachable in a release build. `console.log` in a WebView is visible
to anyone who opens devtools.

### 1.6 `localStorage` for the user's name

It works, but it's invisible data: clearing WebView storage silently resets it, and it won't survive
a profile reset. Move it into the `settings` table with everything else. One storage system.

---

## 2. Packaging

### 2.1 Identity and metadata

```jsonc
"productName": "AI Usage",
"version": "1.0.0",
"identifier": "io.github.yourname.aiusage",
"bundle": {
  "publisher": "Your Name",
  "copyright": "© 2026 Your Name",
  "category": "Utility",
  "shortDescription": "Local-only usage tracker for Claude Code, Antigravity, and Codex.",
  "longDescription": "A frameless always-on-top widget that shows tokens, tasks, cost, and quota windows across your AI tools. Runs entirely on your machine.",
  "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.ico"],
  "targets": ["nsis"],
  "createUpdaterArtifacts": true,
  "windows": {
    "webviewInstallMode": { "type": "embedBootstrapper" },
    "nsis": {
      "installMode": "currentUser",
      "installerIcon": "icons/icon.ico",
      "languages": ["English"],
      "displayLanguageSelector": false
    }
  }
}
```

Why these:

- `installMode: "currentUser"` → no UAC prompt, installs to `%LOCALAPPDATA%`. Right for a widget.
- `embedBootstrapper` → WebView2 installs from the bundle if missing; works offline-ish and avoids a
  silent failure on stripped Windows installs. `downloadBootstrapper` (default) needs internet on
  first run.
- `createUpdaterArtifacts: true` → generates the `.sig` files the updater needs. Required.

`version` here is the single source of truth for the installer, the About box, and updates.

### 2.2 Icons

```powershell
pnpm tauri icon .\design\icon-1024.png
```

Source a 1024×1024 PNG with transparency, square, no text. Tauri generates every size plus `.ico`.
An app with a default Tauri icon reads as unfinished.

### 2.3 Portable ZIP (for Scoop and "no install" users)

Add a CI step that zips `src-tauri/target/release/ai_usage.exe` as
`AI-Usage_1.0.0_x64-portable.zip`. Document that **auto-update does not work** in portable mode —
updates require the NSIS install.

---

## 3. Signing — two different signatures, don't confuse them

| | **Authenticode** (Windows) | **Updater signature** (Tauri) |
|---|---|---|
| What it signs | the `.exe` / installer | the update artifact (`latest.json` payload) |
| What it stops | SmartScreen warnings, AV distrust | tampered or spoofed updates |
| Who issues it | a CA (Certum, DigiCert, Azure Trusted Signing) | **you** — `pnpm tauri signer generate` |
| Cost | €30–400/yr | free |
| Required? | strongly recommended | **mandatory** if you ship auto-update |

### 3.1 Authenticode options

| Option | Cost | Reality check |
|---|---|---|
| **Certum Open Source Developer** | ≈ €30–70/yr | Requires a public OSS repo. Cheapest legitimate path. Works with SimplySign cloud HSM. Recommended. |
| **SignPath.io Foundation** | free | Free signing for OSI-licensed OSS, hosted in their CI. Great if you don't want to buy a cert. |
| **OV certificate** (Sectigo/DigiCert) | $200–400/yr | Requires a registered business in most cases. Builds SmartScreen reputation over downloads. |
| **EV certificate** | $300–600/yr + hardware token | Instant reputation, but overkill for a widget. |
| **Azure Trusted Signing** | $9.99/mo | Cheap and CI-friendly, but identity validation is country- and history-restricted. Check eligibility before planning around it. |
| **Unsigned** | $0 | Every user sees "Windows protected your PC → More info → Run anyway". Conversion killer. |

**Reality check:** even a brand-new OV cert starts with zero SmartScreen reputation. Warnings fade
after a few hundred downloads. EV is the only way to skip that curve.

### 3.2 Updater keys (do this once, back it up)

```powershell
pnpm tauri signer generate -w $env:USERPROFILE\.tauri\ai-usage.key
```

- Public key → `plugins.updater.pubkey` in `tauri.conf.json`.
- Private key + password → GitHub secrets: `TAURI_SIGNING_PRIVATE_KEY`,
  `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`.
- **Back up the private key offline.** Lose it and existing installs can never update again — users
  must manually reinstall.

---

## 4. Auto-update

```jsonc
"plugins": {
  "updater": {
    "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6...",
    "endpoints": [
      "https://github.com/YOURNAME/ai-usage/releases/latest/download/latest.json"
    ]
  }
}
```

Frontend, on boot (after a 10 s delay so it never competes with first paint):

```ts
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const update = await check();
if (update) {
  await update.downloadAndInstall();
  await relaunch();
}
```

Rules:

- **Never update silently mid-session.** Prompt: "v1.0.1 is available — update now / later." A widget
  that restarts under the user is a bug.
- Check at most once per 6 hours; store `last_update_check` in `settings`.
- If the signature check fails, log it and do nothing. Never install an unsigned update.
- Users on the portable ZIP must be told updates are manual.

### Update test (do this before every release)

1. Install v1.0.0 from the installer.
2. Publish v1.0.1 as a draft, then publish it.
3. Confirm the prompt appears, install, relaunch, version shows 1.0.1.
4. Tamper with a `.sig` file → confirm the app refuses and stays on the old version.

---

## 5. CI/CD

`.github/workflows/release.yml`:

```yaml
name: release
on:
  push:
    tags: ['v*']
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with: { version: 9 }

      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }

      - uses: dtolnay/rust-toolchain@stable

      - uses: swatinem/rust-cache@v2
        with: { workspaces: './src-tauri -> target' }

      - run: pnpm install --frozen-lockfile
      - run: pnpm exec tsc --noEmit
      - run: cargo test --manifest-path src-tauri/Cargo.toml

      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          tagName: v__VERSION__
          releaseName: 'AI Usage v__VERSION__'
          releaseBody: |
            See the assets below to download and install.
            Windows 10/11 x64 · local-only · no telemetry.
          releaseDraft: true
          prerelease: false
          includeUpdaterJson: true
```

`includeUpdaterJson: true` is what generates `latest.json` — without it, auto-update silently never
fires.

Release process:

```powershell
# bump version in tauri.conf.json AND package.json
git commit -am "chore: release v1.0.1"
git tag v1.0.1
git push origin v1.0.1
# CI builds a DRAFT release; test the installer from it, then publish
```

Keep releases as **drafts** until you've installed and run them yourself. A published bad build goes
to every user within hours.

---

## 6. Distribution

| Channel | Effort | Notes |
|---|---|---|
| **GitHub Releases** | low | Primary. Direct `.exe` download + `latest.json`. |
| **winget** | low | `wingetcreate update --urls <installer-url> --version 1.0.0 --submit`, or write the 3-file manifest and PR to `microsoft/winget-pkgs`. Requires a stable URL and a hash. |
| **Scoop** | low | Publish the portable ZIP + a bucket JSON. Devs will find this before they find your site. |
| **Landing page** | medium | GitHub Pages + a 6-second GIF of the widget snapping to an edge. One install button. |
| **Microsoft Store** | high | MSIX, certification, review cycles. Skip for 1.0. |

Landing page copy that works:

> A tiny always-on-top widget that shows how much Claude Code, Antigravity, and Codex you've used —
> tokens, cost, and how much quota is left before you hit a limit.
> Runs entirely on your PC. No account. No telemetry. Reads your local usage files only.

---

## 7. Trust, legal, and the "is this malware?" problem

A small unsigned binary that reads a credential file, spawns `netsh`, enumerates processes, and makes
TLS calls to localhost is a textbook heuristic match. Expect false positives.

Mitigations, in order of impact:

1. **Sign the binary.** Biggest single factor.
2. **Open source it.** Reviewers can read the 40 lines that touch credentials.
3. **Submit false positives** to Microsoft: <https://www.microsoft.com/en-us/wdsi/filesubmission>
   ("I believe this file is incorrectly detected"). Turnaround is usually a few days.
4. **Publish a VirusTotal link** in the README for each release. Transparency beats reassurance.
5. **Reduce risky surface** — cut the Wi-Fi/netsh feature (§1.2).
6. **Never bundle a phone-home.** One network call to an unknown host and you're done.

Files to add:

| File | Contents |
|---|---|
| `LICENSE` | MIT |
| `PRIVACY.md` | exact paths read, exact hosts contacted, what's stored locally, how to delete it |
| `SECURITY.md` | how to report a vulnerability, PGP or email |
| `README.md` | one-paragraph pitch, GIF, install, "What this app reads", FAQ, disclaimer |
| `THIRD_PARTY.md` | generated: `cargo about generate`, `pnpm licenses list` |

README disclaimer (non-negotiable):

> AI Usage is an independent project. It is not affiliated with, endorsed by, or sponsored by
> Anthropic or Google. "Claude", "Antigravity", and "Codex" are trademarks of their respective
> owners and are used only to describe compatibility.

Don't put Anthropic's or Google's logos in the app or on the site. Use text: "Works with Claude Code".

---

## 8. First-run experience for strangers

Your current app assumes the happy path. A new user may have none of the three tools installed.

Design the first run as a **checklist**, not an error:

```
● Claude Code      detected · 83% session · 2h 14m
● Antigravity      not running — start it to see quotas
● Codex            not installed
[ What this app reads ]        [ Rescan ]
```

Also add:

- **Diagnostics button** in Settings: copies app version, OS build, provider statuses, last poll
  errors, and DB path to the clipboard. Turns every bug report into something actionable, with zero
  telemetry.
- **Reset app data** in Settings (deletes DB, re-runs migrations). Support cost drops to near zero.
- **Poll failure handling:** after 3 consecutive failures, show `paused` with a reason, not a spinner.

---

## 9. Beta, then launch

### 9.1 Test matrix (do all of it, once)

| Test | Why |
|---|---|
| Fresh Windows 11 VM, no Rust/Node/Claude | must open, show empty states, not crash |
| Windows 10 22H2 | older WebView2, different DPI behaviour |
| 125% / 150% / 175% scaling | snapping gaps show up here first |
| Two monitors, different scaling | the classic snap bug |
| No internet | app opens, quota shows `paused`, no hang |
| Non-English Windows | `netsh` parse failure must degrade, dates must format locally |
| Corporate proxy / TLS inspection | vendor API call fails cleanly, not a panic |
| Non-admin user | per-user install works |
| Uninstall | removes app, leaves or cleans `%APPDATA%` deliberately (document which) |

### 9.2 Private beta

Recruit 5–10 people who actually use Claude Code or Antigravity. Ship a `v0.9.0` draft release to
them directly. Watch for: crashes on startup, wrong percentages, snap jitter, AV flags.

Nothing teaches you more than one person with a 4K monitor at 175% scaling.

### 9.3 Timeline

| Week | Work |
|---|---|
| 1 | §1 blockers, §2 identity/icons, §7 docs, §8 first-run |
| 2 | §3 signing, §4 updater, §5 CI, first signed build |
| 3 | §9.1 matrix, private beta, fix |
| 4 | public v1.0.0 + winget + Scoop + landing page |

### 9.4 Costs

| Item | Year 1 |
|---|---|
| GitHub, CI, Releases | $0 |
| Certum OSS certificate | €30–70 |
| Domain (optional) | $12 |
| **Total** | **≈ $50–90** |

---

## 10. Release checklist (paste into the PR)

```
[ ] version bumped in tauri.conf.json and package.json
[ ] identifier/productName final (never changes after this release)
[ ] pnpm exec tsc --noEmit clean
[ ] cargo test clean
[ ] no console.log / dbg! / USE_MOCKS=false verified
[ ] no C:\Users\... paths in src, docs, comments
[ ] every provider path returns a status when missing
[ ] installer built, installed on a clean VM, widget runs
[ ] update from previous version tested end-to-end
[ ] README screenshots match this build
[ ] CHANGELOG entry written
[ ] VirusTotal scan linked
[ ] release published (not draft) and latest.json present
[ ] winget/scoop manifests updated (if applicable)
```

---

## 11. After launch

- Pin an issue template: bug reports require the Diagnostics output.
- Track downloads per release from the GitHub API — it's the only metric you need, and it's free.
- Cut a patch release for every crash report that isn't machine-specific.
- Watch for the first "Windows says it's a virus" issue and answer it with the VirusTotal link, not
  defensiveness.
- Don't add features for a month. Ship 1.0.1, 1.0.2, 1.0.3 with fixes only.

---

## 12. What I'd cut from 1.0

| Feature | Why |
|---|---|
| Wi-Fi speed pill | unrelated, localized, adds AV surface and a privacy smell |
| Greeting with emoji | conflicts with the design language; keep the name, drop the 👋 |
| Three chart modes | ship Bar + Heatmap; Area is the weakest and doubles the chart code |
| Settings opacity slider | nice, but 60% opacity makes text unreadable; if you keep it, floor at 75% |

Smaller surface = fewer bug reports on day one, and every one of these can come back in 1.1.

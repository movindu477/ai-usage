# AI Usage Tracker

A lightweight, frameless, always-on-top floating desktop widget for Windows that tracks your AI quota, tokens, tasks, and spending across **Claude Code**, **Antigravity**, and **Codex** in real time.

Runs completely offline on your computer. No accounts, no cloud sync, and zero telemetry.

---

## Features

- **Always-on-Top Floating Widget**: Stays gently visible above your editors and terminals without stealing focus.
- **Multiple Display Modes**:
  - **Expanded** (`340×290`): Full dashboard with interactive charts, provider scopes, and reset countdowns.
  - **Compact** (`270×110`): Minimalist desktop HUD with headline metrics, micro sparkline, and quota bar.
  - **Rail** (`44×160`): Ultra-narrow vertical strip displaying current usage percentage.
  - **Plans View** (`340×420`): Deep breakdown of all provider tiers and individual model allocations.
- **Dynamic Visualizations**: Switch seamlessly between Stacked Bar Chart, Gradient Area Chart, and a 7-day Activity Heatmap matrix.
- **Zero Focus Stealing**: Never interrupts typing in your IDE, terminal, or browser.
- **Desktop Edge Snapping**: Smoothly docks to screen boundaries using native Win32 work-area positioning.
- **Instant Global Hotkey**: Press `Ctrl + Shift + U` to hide or show the widget anywhere.
- **In-App Privacy Transparency**: Inspect exactly which local files and localhost endpoints are read directly from the settings panel.

---

## What This App Reads

AI Usage Tracker operates with strict minimal permissions:

| Target | Access Type | Purpose | Source Reference |
|---|---|---|---|
| `~/.claude/.credentials.json` | Read-only | Reads the OAuth token and sends it strictly to `api.anthropic.com` to query quota resets. | [`read_claude_credentials()`](src-tauri/src/sources/claude_credentials.rs) |
| `~/.claude/projects/*/*.jsonl` | Read-only | Aggregates daily token totals and calculates cost estimates locally. | [`aggregate_claude_sessions()`](src-tauri/src/sources/claude_aggregate.rs) |
| Antigravity Language Server | Localhost (`127.0.0.1`) | Queries model limits and session status over Connect-RPC loopback. | [`discover_antigravity()`](src-tauri/src/sources/antigravity.rs) |
| Embedded SQLite DB | Read/Write (`%LOCALAPPDATA%`) | Stores aggregated rollups and UI preferences offline. | [`init_db()`](src-tauri/src/db/mod.rs) |

---

## Code Signing

Free code signing is provided by [SignPath.io](https://signpath.io/), with code signing certificates issued by the [SignPath Foundation](https://signpath.org/).

For detailed governance, signing roles, and security policies, please review [CODE_SIGNING.md](CODE_SIGNING.md).

---

## Installation & Running

### Option 1: Run the Precompiled Binary
Download the latest executable from releases and run:
```powershell
.\ai_usage.exe
```

### Option 2: Build from Source
Prerequisites: Node.js 20+, pnpm, and Rust (Cargo).

```powershell
# 1. Install frontend dependencies
pnpm install

# 2. Run in development mode
pnpm tauri dev

# 3. Build optimized release binary and installer
pnpm tauri build
```

---

## Diagnostics & Troubleshooting

If you encounter an issue or want to inspect current state:
1. Open the widget settings (top-right menu `...` → **Settings**).
2. Click **Diagnostics** to copy platform version, provider status, and database statistics to your clipboard.
3. Click **Reset All** if you ever wish to clear local cached records and start with a fresh database.

---

## Disclaimer

AI Usage is an independent open-source project. It is not affiliated with, endorsed by, or sponsored by Anthropic, Google, or OpenAI. "Claude", "Antigravity", and "Codex" are trademarks of their respective owners and are referenced solely for compatibility identification.

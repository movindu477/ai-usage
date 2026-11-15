# AI USAGE WIDGET — COMPLETE BUILD BRIEF

> **This file is a prompt.** Give it to the coding agent in this empty folder and say:
> *"Implement this file. Start at Phase 0 and continue through Phase 5, verifying each gate."*
> If your IDE auto-loads `AGENTS.md`, rename this file to `AGENTS.md` first.

You are the sole engineer on this project. Build the entire desktop app described below in one
continuous run. Do not ask clarifying questions — where something is ambiguous, the conservative
choice is documented here or in the "Failure modes" section at the end.

Target: **Windows 11**, PowerShell, local-only desktop app.
Stack: **Tauri 2 + React 19 + TypeScript + Vite + Tailwind v4 + SQLite**.

---

## 0. EXECUTION CONTRACT

1. Work in **six phases** (0–5). Each phase ends with a **Gate**. Run the gate's verification
   command, read the output, and continue automatically if it passes.
2. If a gate fails **twice**, stop and report: what you ran, the error, and what you tried. Do not
   silently skip a gate or fake a passing result.
3. Do not ask questions. If a decision is genuinely missing, pick the option marked **DEFAULT** or
   the simpler option, implement it, and list the decision in your final report.
4. Do not add libraries that are not in §3. Do not add a UI kit. Do not add a state-management
   library beyond what §3 lists.
5. Keep every file under ~300 lines. Split rather than grow.
6. All user-visible strings are English, sentence case, no emoji.
7. If you cannot launch a GUI in this environment, say so explicitly — never claim a visual gate
   passed without running it.
8. At the end of each phase, print: `PHASE n DONE — files: … — gate: PASS/skipped (reason)`.

---

## 1. PRODUCT

A small **always-on-top desktop widget** that tracks AI usage across providers and plans.

It answers three questions in under two seconds:

1. **How much have I used this week?** — tasks, tokens, or cost.
2. **Which model is eating my quota?** — per-model breakdown.
3. **How close am I to a limit, and when does it reset?** — plan quota windows with countdowns.

Supported sources:

| Provider | Plan / quota windows | Tokens & cost |
|---|---|---|
| **Claude** (Claude Code on a Pro/Max plan) | ✅ 5 h session %, weekly %, per-model weekly %, extra-usage credits | ✅ via OTLP / local JSONL |
| **Antigravity** | ✅ per-model remaining %, reset time, plan name | ❌ not exposed |
| **Anthropic API key** | ✅ rate-limit headers (optional proxy) | ✅ response `usage` |
| **Generic OTLP** | — | ✅ receiver on `127.0.0.1:4318` |

**Not in scope:** no chat UI, no proxy in v1, no cloud sync, no accounts, no telemetry of our own,
no scraping of authenticated web UIs. Ever.

---

## 2. HARD RULES

These are the difference between a shipped widget and a demo. Violating any one is a bug.

1. **Local only.** The app talks to `~/.claude/*`, localhost ports, and the two vendor endpoints in
   §8–§9. Nothing else. No analytics.
2. **Read-only credentials.** Never write, refresh, or log `~/.claude/.credentials.json`. Refreshing
   the token races Claude Code and logs the user out.
3. **Never steal focus.** No `set_focus()` on the widget, ever. Show with `show()` only, window
   created with `"focus": false`.
4. **No fake zeros.** Missing quota renders `—` plus a reason. Not `0%`, not an empty bar.
5. **Every percentage carries a countdown or a timestamp.** A bare `83%` is a bug.
6. **One quota colour rule, everywhere:** `< 70%` ok, `70–89%` warn, `≥ 90%` danger.
7. **Window geometry uses physical pixels; layout uses logical.** Never mix.
8. **Every data source fails soft.** A dead provider becomes a status string in the UI, never a
   panic, never a wrong number.
9. **The widget is never bigger than `380 × 480`** and never scrolls internally.
10. **After Phase 3, no mock data ships.** Mocks live only in `src/lib/mock.ts` and are imported only
    by `src/lib/ipc.ts`, behind a single `USE_MOCKS` constant that is `false` in Phase 3.

---

## 3. STACK

### Frontend

```jsonc
"dependencies": {
  "react": "^19", "react-dom": "^19",
  "@tauri-apps/api": "^2",
  "@tauri-apps/plugin-global-shortcut": "^2",
  "@tauri-apps/plugin-autostart": "^2",
  "recharts": "^3",
  "motion": "^12",
  "lucide-react": "^0.4xx",
  "zustand": "^5",
  "@tanstack/react-query": "^5",
  "date-fns": "^4",
  "clsx": "^2"
},
"devDependencies": {
  "typescript": "^5", "vite": "^7", "@vitejs/plugin-react": "^5",
  "tailwindcss": "^4", "@tailwindcss/vite": "^4",
  "@tauri-apps/cli": "^2"
}
```

### Rust (`src-tauri/Cargo.toml`)

```toml
[dependencies]
tauri = { version = "2", features = ["tray-icon"] }
tauri-plugin-global-shortcut = "2"
tauri-plugin-autostart = "2"
tauri-plugin-single-instance = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
rusqlite = { version = "0.32", features = ["bundled"] }
reqwest = { version = "0.12", features = ["json", "rustls-tls"] }
chrono = { version = "0.4", features = ["serde"] }
notify = "8"
anyhow = "1"
dirs = "5"

[target.'cfg(windows)'.dependencies]
windows = { version = "0.58", features = [
  "Win32_Foundation", "Win32_Graphics_Gdi", "Win32_UI_WindowsAndMessaging"
] }
```

### Why these

| Choice | Reason |
|---|---|
| Tauri 2 | ~10 MB installer, exposes frameless + always-on-top + click-through + monitor APIs |
| Recharts | Stacked bars in ~30 lines; swap to custom SVG only if the radius is wrong |
| rusqlite (bundled) | No system SQLite dependency |
| Zustand + React Query | Tiny UI state + cached IPC calls; not Redux |

---

## 4. STRUCTURE

Create exactly this shape (names may grow, not change):

```
src/
  App.tsx
  index.css                    ← design tokens live here
  lib/
    ipc.ts                     ← the ONLY module that calls invoke()
    mock.ts
    format.ts                  ← formatTokens, formatUsd, formatCountdown, quotaBand
    types.ts
  components/
    widget/Header.tsx
    widget/ProviderChips.tsx
    widget/MetricSwitch.tsx
    widget/UsageChart.tsx
    widget/QuotaStrip.tsx
    plans/PlansView.tsx
    plans/ProviderSection.tsx
    plans/WindowRow.tsx
    plans/ModelRow.tsx
    common/Card.tsx
  modes/Expanded.tsx
  modes/Compact.tsx
  modes/Rail.tsx
  modes/Settings.tsx
src-tauri/src/
  main.rs  lib.rs
  window/{mod.rs, snap.rs, tray.rs}
  db/{mod.rs, schema.rs, queries.rs}
  sources/{mod.rs, claude_credentials.rs, claude_usage.rs, claude_jsonl.rs, antigravity.rs}
  commands.rs
  state.rs
```

---

## 5. PHASE 0 — SCAFFOLD AND WINDOW SHELL

### 5.1 Prerequisites — verify, don't assume

```powershell
node -v      # >= 20
pnpm -v      # >= 9   (npm i -g pnpm)
rustc -V     # >= 1.77 (winget install Rustlang.Rustup; rustup default stable)
```

Also required: **Visual Studio Build Tools** with *Desktop development with C++* (for `link.exe`),
and the **WebView2 runtime** (preinstalled on Win 11).

### 5.2 Scaffold

Scaffold into a temp folder, then move it up, so this brief cannot be overwritten:

```powershell
pnpm create tauri-app@latest .scaffold --template react-ts --manager pnpm --yes
Get-ChildItem .scaffold -Force | Where-Object { $_.Name -ne '.git' } |
  Move-Item -Destination . -Force
Remove-Item .scaffold -Recurse -Force
pnpm install
pnpm add recharts motion lucide-react zustand @tanstack/react-query date-fns clsx
pnpm add -D tailwindcss @tailwindcss/vite
```

If the scaffold command refuses to run, add `--force`.

### 5.3 Window configuration

`src-tauri/tauri.conf.json`:

```json
{
  "productName": "AI Usage",
  "identifier": "com.local.aiusage",
  "build": {
    "beforeDevCommand": "pnpm dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "pnpm build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "label": "widget",
        "title": "AI Usage",
        "width": 380,
        "height": 340,
        "resizable": false,
        "decorations": false,
        "transparent": true,
        "shadow": false,
        "alwaysOnTop": true,
        "skipTaskbar": true,
        "focus": false,
        "visible": false
      }
    ],
    "security": { "csp": null }
  },
  "bundle": { "active": true, "targets": ["nsis"] }
}
```

`index.html`: `<body style="margin:0;background:transparent">`.
`index.css` must set `html, body, #root { background: transparent }`.

### 5.4 Boot order — no flash, no focus steal

In `lib.rs` setup:

```rust
.setup(|app| {
    let win = app.get_webview_window("widget").unwrap();
    // restore saved position here (settings table or default bottom-right of work area)
    win.show()?;          // never set_focus()
    Ok(())
})
```

### 5.5 Tray + hotkey + single instance

- Tray menu: **Show / Hide**, **Pin** (toggle always-on-top), **Quit**.
- Global shortcut `CommandOrControl+Shift+U` toggles visibility.
- `tauri-plugin-single-instance`: a second launch focuses the existing widget instead of opening a
  new one.

**GATE 0:** `pnpm tauri dev` → a frameless, transparent, rounded card floats above other windows;
no taskbar entry; absent from Alt-Tab; clicking another app does not hide it; tray Quit works.
Report whether you could observe this visually.

---

## 6. PHASE 1 — DESIGN SYSTEM AND STATIC UI

Build the full UI against `src/lib/mock.ts`. No backend yet.

### 6.1 `src/index.css` — tokens (use these values exactly)

```css
@import "tailwindcss";

@theme {
  --color-bg-card: #0b0b0f;
  --color-bg-elevated: #121217;
  --color-text-1: #f4f4f6;
  --color-text-2: rgba(238, 238, 245, 0.62);
  --color-text-3: rgba(238, 238, 245, 0.36);
  --color-accent-1: #7c5cff;   /* Task Automation / Claude */
  --color-accent-2: #ff8a4c;   /* User Queries / Antigravity */
  --color-accent-3: #2e2e38;   /* System Actions */
  --color-quota-ok: #7c5cff;
  --color-quota-warn: #ffb020;
  --color-quota-danger: #ff5d5d;
  --color-success: #3ddc97;
  --radius-card: 20px;
  --radius-control: 10px;
  --font-sans: "Inter", ui-sans-serif, system-ui, "Segoe UI Variable", sans-serif;
}

:root {
  --surface-1: rgba(255,255,255,.04);
  --surface-2: rgba(255,255,255,.07);
  --border: rgba(255,255,255,.09);
  --border-strong: rgba(255,255,255,.15);
}

html, body, #root {
  height: 100%; margin: 0; background: transparent;
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  overflow: hidden; user-select: none; cursor: default;
  color: var(--color-text-1);
}
.card {
  background: var(--color-bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-card);
  box-shadow: 0 18px 50px rgba(0,0,0,.55), inset 0 1px 0 rgba(255,255,255,.06);
}
.num { font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```

Load Inter in `index.html`:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

Typography: 9 / 10 / 11 / 12 / 13 / 28 px. Weights 400/500/600 only. 4 px spacing grid. Card padding
16 px. Nothing above 13 px except the headline number.

### 6.2 Mock data

```ts
export const SERIES: Record<string, { automation: number[]; query: number[]; system: number[] }> = {
  all:         { automation: [180,211,190,205,302,225,220], query: [95,80,86,70,45,100,54], system: [45,30,32,31,59,26,22] },
  claude:      { automation: [100,138,132,120,205,160,172], query: [65,62,48,45,25,72,30],   system: [35,18,20,22,45,15,12] },
  antigravity: { automation: [64,55,44,70,78,52,38],       query: [22,18,26,25,20,28,24],   system: [8,12,9,9,14,11,10] },
  codex:       { automation: [16,18,14,15,19,13,10],       query: [8,0,12,0,0,0,0],         system: [2,0,3,0,0,0,0] },
};
export const X_LABELS = ["28","29","30","1","2","3","4"];
```

Quota mock:

| provider | plan | account | windows |
|---|---|---|---|
| Claude | Max 20× | you@example.com | Session (5h) 83% · 2h 14m · Week all models 14% · 4d 11h · Opus 4.5 71% · 4d 11h |
| Antigravity | Pro | you@gmail.com | Gemini 3 Pro 38% · 6d 2h · Claude Sonnet 52% · 5d 19h · Gemini 3 Flash 12% · 6d 2h |
| Codex | Plus | — | error: "Session expired — sign in again" |

Headline numbers: `12,450 tasks` / `4.82M tokens` / `$37.20`.

### 6.3 Expanded card — 380 × 340

```
Weekly AI Agent Activity                     [▮ Bar Chart ▾] [⋯]
12,450  tasks
🗓 Apr 28, 2025 → May 04, 2025
(● All) (● Claude) (● Antigravity) (● Codex)
● Task Automation  ● User Queries  ● System Actions
┌─────────────────── chart ───────────────────┐
CLAUDE · SESSION  ▓▓▓▓▓▓▓░░░  83%  · 2h 14m
```

Row by row:

| Row | Spec |
|---|---|
| Header | Title 12px/500 `--text-2`, tracking .01em. Right: `share` icon button 26×26 · segmented pill (14px chart icon in accent, "Bar Chart" 11px, chevron 12px; h26, `--surface-1`, 1px `--border`, r10, padding 6×10) with a Bar/Area/Heatmap dropdown · `more-horizontal` ghost 26×26 |
| Metric | `12,450` 28px/600, lh 1.1 · `tasks` 11px `--text-3` baseline-aligned 6px right · 10px chevron at 40% · click cycles tasks → tokens → cost (180 ms crossfade + 4 px slide) |
| Range | `calendar` 12px `--text-3` · "Apr 28, 2025" 11px `--text-2` · `arrow-right` 11px · "May 04, 2025" 11px `--text-2`; hover chip `--surface-1` r8 |
| Chips | All / Claude / Antigravity / Codex. h22, padding 0 8px, r10, 11px/500, 6px dot in provider accent. Selected: `--surface-2` + `--text-1` + 1px `--border-strong`. Unselected: transparent + `--text-3` |
| Legend | 7×7 swatch r2 + 10px `--text-2`, gap 16. Click toggles a series off at 35% opacity |
| Chart | flex-1, min-h 120. Recharts stacked bars, bottom→top automation/query/system. Y ticks [0,150,300] 9px `--text-3`, no axis/tick lines, **no gridlines**, width 24. X labels 10px `--text-3`, tickMargin 8. Bar width 22, barCategoryGap 18%, no inner gap. **3 px top radius on the topmost segment only.** Baseline 1px `rgba(255,255,255,.07)`. Hover: `activeBar` +8% brightness, custom tooltip (`--bg-elevated`, r10, 1px border, 10px padding, 11px: date, then dot+label+right-aligned value). Mount: grow 420 ms, 24 ms stagger |
| Quota strip | h24. Left label 9px uppercase tracking .04em `--text-3` (`CLAUDE · SESSION`, or the most constrained window when scope = All). Middle 3px track `rgba(255,255,255,.08)` + fill in quota colour. Right `83%` 9px/600 quota colour + `· 2h 14m` 9px `--text-3`. Whole strip is a button → Plans |

Header carries `data-tauri-drag-region`; every button inside carries `data-tauri-drag-region={false}`.

### 6.4 Plans view — 380 × 480

Header: "Plans & usage" 12px/500 · right: 6px success dot + "updated 12s" 9px `--text-3` + refresh
icon 24×24.

Per provider block, separated by a 1px `rgba(255,255,255,.06)` divider, 14px vertical margin:

- Line 1: 6px accent dot · name 12px/600 · plan badge 9px/600 uppercase tracking .06em `--text-2`
  in `--surface-2` r4 padding 1×6 · account email 9px `--text-3` right-aligned, ellipsis at 120px.
- Window rows, h22, grid `96px 1fr 34px 56px`: label 10px `--text-2` · 3px bar r2 (fill = quota
  colour) · pct 10px/600 quota colour · countdown 9px `--text-3` right-aligned.
- Divider, then model usage rows: name 10px `--text-2` left; `1.24M tok · $8.41` 9px right-aligned,
  tokens `--text-2`, cost `--text-3`. No bars on these rows.
- Error block (Codex): warning dot + "Session expired — sign in again" 10px, a 10px "Reconnect" link
  in `--accent-1`, block at 70% opacity.

Footer: "Auto-refresh · 5 min" 9px `--text-3` left; "Refresh now" ghost button h26 right.

Sort windows: `session_5h` → `week_all` → `week_model` → `credits`. Sort models by usage desc.
Stale data: dim to 60%, header shows "last known 9m ago".

### 6.5 Compact, Rail, Settings, Empty

- **Compact 320×160** — provider name 10px `--text-3`, 26px number + unit, 7-day sparkline (1.5px
  violet stroke, 12% area fill, no axes), 3px quota bar at the bottom.
- **Rail 44×160** — docked right, 20px radius on left corners. 6px accent dot, "12.4k" rotated 90°
  12px tabular, 3px vertical quota track at 62%. Hover expands to a 320×160 preview.
- **Settings 380×440** — Providers list (20px dot, name 12px, subtitle 10px: "Connected · synced 2m
  ago" / "Needs setup", 32×18 switch); Appearance (opacity slider 60–100%, "Snap to edges" toggle);
  Polling (1/5/15 min); Shortcut keycaps "Ctrl" "Shift" "U"; footer primary "Done" + ghost
  "Rescan providers".
- **Empty** — dashed 1px placeholder bars at 12% opacity, "No activity yet" 12px `--text-2`,
  "Connect a provider to start tracking" 10px `--text-3`.

### 6.6 Motion and accessibility

150 ms transitions on background/border/opacity. Focus ring 1.5 px `rgba(124,92,255,.6)`, offset 2,
no browser outline. No scale transforms on the card. Body text ≥ 4.5:1. Countdowns use
`aria-live="polite"` only when crossing a threshold. Everything respects reduced motion.

**GATE 1:** `pnpm tauri dev` → the card matches the spec at 380×340; switching provider chips changes
the number, chart, and quota strip together; the Plans view opens and fits in 380×480 with no
scrollbar; no stray colours; no console errors. Test at 125% and 150% Windows scaling — nothing clips.

---

## 7. PHASE 2 — DATA LAYER

### 7.1 Schema (`src-tauri/src/db/schema.rs`)

```sql
CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, kind TEXT NOT NULL,
  accent TEXT NOT NULL, enabled INTEGER NOT NULL DEFAULT 1,
  config_json TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY, provider_id TEXT NOT NULL REFERENCES providers(id),
  name TEXT NOT NULL, tier TEXT, account TEXT, detected_at INTEGER
);

CREATE TABLE IF NOT EXISTS models (
  provider_id TEXT NOT NULL, model_id TEXT NOT NULL,
  display_name TEXT NOT NULL, family TEXT,
  PRIMARY KEY (provider_id, model_id)
);

CREATE TABLE IF NOT EXISTS usage_events (
  id INTEGER PRIMARY KEY,
  provider_id TEXT NOT NULL,
  model_id TEXT,
  ts_utc INTEGER NOT NULL,
  category TEXT NOT NULL,            -- 'automation' | 'query' | 'system'
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  cache_read_tokens INTEGER DEFAULT 0,
  cache_write_tokens INTEGER DEFAULT 0,
  requests INTEGER DEFAULT 1,
  cost_usd REAL,                     -- NULL = unknown, never fabricate
  session_id TEXT,
  source TEXT NOT NULL,              -- 'otel' | 'jsonl' | 'proxy' | 'manual'
  dedupe_key TEXT UNIQUE
);
CREATE INDEX IF NOT EXISTS idx_usage_ts ON usage_events(ts_utc);

CREATE TABLE IF NOT EXISTS quota_windows (
  id INTEGER PRIMARY KEY,
  provider_id TEXT NOT NULL,
  plan_id TEXT,
  model_key TEXT NOT NULL DEFAULT '*',   -- '*' = account-wide (never NULL, so UNIQUE works)
  kind TEXT NOT NULL,                    -- session_5h | week_all | week_model | credits_month | rolling
  label TEXT NOT NULL,
  used_pct REAL,
  resets_at_utc INTEGER,
  source TEXT NOT NULL,                  -- 'oauth_usage' | 'ag_status' | 'ratelimit' | 'manual'
  fetched_at_utc INTEGER NOT NULL,
  stale INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  raw_json TEXT,
  UNIQUE (provider_id, model_key, kind)
);

CREATE TABLE IF NOT EXISTS daily_rollup (
  day TEXT NOT NULL, provider_id TEXT NOT NULL, model_id TEXT NOT NULL DEFAULT '*',
  category TEXT NOT NULL,
  requests INTEGER, tokens_in INTEGER, tokens_out INTEGER, cost_usd REAL,
  PRIMARY KEY (day, provider_id, model_id, category)
);

CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS widget_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  monitor_name TEXT, edge TEXT, offset_ratio REAL,
  mode TEXT DEFAULT 'expanded', opacity REAL DEFAULT 1,
  click_through INTEGER DEFAULT 0, pinned INTEGER DEFAULT 1,
  selected_provider TEXT DEFAULT 'all', metric TEXT DEFAULT 'tasks'
);
```

Upsert quota rows idempotently:

```sql
INSERT INTO quota_windows
  (provider_id, plan_id, model_key, kind, label, used_pct, resets_at_utc,
   source, fetched_at_utc, stale, error, raw_json)
VALUES (?,?,?,?,?,?,?,?,?,0,NULL,?)
ON CONFLICT(provider_id, model_key, kind) DO UPDATE SET
  used_pct = excluded.used_pct, resets_at_utc = excluded.resets_at_utc,
  fetched_at_utc = excluded.fetched_at_utc, stale = 0, error = NULL,
  raw_json = excluded.raw_json;
```

DB path: `app_data_dir()/usage.db`. Seed providers `claude`, `antigravity`, `codex` on first run.
Store UTC everywhere; bucket UI days by **local** date.

### 7.2 IPC commands

```rust
get_overview(scope, range) -> { metric, unit, delta_pct }
get_series(scope, range)   -> [{ day, automation, query, system }]
get_plans()                -> [{ provider, plan, account, windows[], models[], fetched_at, stale, error }]
get_binding_window(scope)  -> { label, used_pct, resets_at, stale }
refresh(provider?)         -> ()
set_mode / set_pinned / set_opacity / set_scope / set_metric
```

`src/lib/ipc.ts` is the only module allowed to import `invoke`. Every command returns typed data,
never `any`.

### 7.3 Poller skeleton

- Claude quota: every 300 s, floor 60 s, single in-flight, ±10% jitter, exponential backoff to 15 min
  on failure, honour `Retry-After`.
- Antigravity: every 120 s while the process is alive.
- Rollup: every 5 min recompute today's `daily_rollup`.

**GATE 2:** DB file is created under `%APPDATA%`; restarting the app does not duplicate
`quota_windows` rows; `get_plans()` returns seeded providers with empty windows.

---

## 8. PHASE 3 — REAL CLAUDE DATA

### 8.1 Credentials (read-only)

Path: `~/.claude/.credentials.json` (Windows: `%USERPROFILE%\.claude\.credentials.json`).

```json
{ "claudeAiOauth": { "accessToken": "...", "refreshToken": "...", "expiresAt": 1763000000000,
                     "subscriptionType": "max", "rateLimitTier": "default_claude_max_20x" } }
```

```rust
fn claude_token() -> Result<(String, i64)> {
    let p = dirs::home_dir().ok_or(anyhow!("no home"))?.join(".claude").join(".credentials.json");
    let v: serde_json::Value = serde_json::from_str(&std::fs::read_to_string(p)?)?;
    let o = &v["claudeAiOauth"];
    Ok((o["accessToken"].as_str().ok_or(anyhow!("no token"))?.to_owned(),
        o["expiresAt"].as_i64().unwrap_or(0)))
}
```

If `expiresAt` is in the past → `NeedsSetup("open Claude Code to refresh")`. Do **not** refresh the
token yourself.

### 8.2 Usage endpoint

```
GET https://api.anthropic.com/api/oauth/usage
Authorization: Bearer <accessToken>
anthropic-beta: oauth-2025-04-20
anthropic-version: 2023-06-01
```

Response (every key optional — new ones appear without notice):

```json
{
  "five_hour":  { "utilization": 83.0, "resets_at": "2026-11-14T06:30:00+00:00" },
  "seven_day":  { "utilization": 14.0, "resets_at": "2026-11-18T11:00:00+00:00" },
  "seven_day_opus": null,
  "seven_day_sonnet": null,
  "extra_usage": { "is_enabled": false, "monthly_limit": null, "used_credits": null }
}
```

Mapping:

| Key | `kind` | `model_key` | `label` |
|---|---|---|---|
| `five_hour` | `session_5h` | `*` | Session (5h) |
| `seven_day` | `week_all` | `*` | Week, all models |
| `seven_day_<x>` (non-null) | `week_model` | `<x>` | Title-cased `<x>` |
| `extra_usage` (only if `is_enabled`) | `credits_month` | `*` | Extra usage |

Status handling:

| Status | Behaviour |
|---|---|
| 200 | parse, `stale = 0`, `error = NULL` |
| 401 | `NeedsSetup("session expired")`, keep old values |
| 429 | read `Retry-After` seconds, `stale = 1`, `error = "rate limited"`, back off, keep old values |
| other | `error = status`, `stale = 1` |

**Normalize the ambiguous field in exactly one place.** Public write-ups disagree on whether
`utilization` means % used or % remaining. Implement:

```rust
fn normalize_utilization(raw: f64) -> f64 {
    raw.clamp(0.0, 100.0)   // flip to `100.0 - raw` ONLY if you verified against `claude /usage`
}
```

Verify once by running a live call and comparing with `claude /usage`. Put the finding in a comment.

### 8.3 Tokens from local JSONL

Watch `~/.claude/projects/**/*.jsonl`. Lines with `"type":"assistant"` contain
`message.usage{input_tokens, output_tokens, cache_read_input_tokens, cache_creation_input_tokens}`,
`message.model`, `timestamp`, `requestId`. Dedupe on `requestId`. Import incrementally by byte
offset per file so restarts are cheap. Import the last 30 days on first run.

Category mapping: `automation` for tool-driven/agent turns, `query` for direct user prompts,
`system` for tool results and compactions. If you cannot distinguish reliably, classify by
`requestId` grouping and record what you can — never invent.

### 8.4 Wire the UI

`ipc.ts` → `invoke()` for all five commands. Delete `USE_MOCKS` or set it `false`.

**GATE 3:** Plans view shows real percentages matching `claude /usage` within 1%; countdowns tick;
a forced 429 renders `paused · retry 2m` with old numbers dimmed, not wrong ones; chart shows real
last-7-day data.

---

## 9. PHASE 4 — ANTIGRAVITY

Antigravity exposes a local Connect-RPC language server.

1. **Find the process:** `language_server_windows_x64.exe` whose command line contains
   `--app_data_dir antigravity` and a `--csrf_token <token>`. Read the command line via WMI
   (`Get-CimInstance Win32_Process`) or the `sysinfo`/`windows` crates.
2. **Find its port:** `Get-NetTCPConnection -OwningProcess <pid> -State Listen`, then probe each port:
   `POST https://127.0.0.1:<port>/exa.language_server_pb.LanguageServerService/GetUnleashData`
   with header `X-Codeium-Csrf-Token: <token>`. First 200 wins.
3. **Fetch quota:**
   `POST https://127.0.0.1:<port>/exa.language_server_pb.LanguageServerService/GetUserStatus`
   with the same CSRF header and body
   `{"metadata":{"ideName":"antigravity","extensionName":"antigravity","locale":"en","ideVersion":"unknown"}}`.
4. **Parse:** `userStatus.cascadeModelConfigData.clientModelConfigs[]` →
   `.label` (model name), `.quotaInfo.remainingFraction` (0–1), `.quotaInfo.resetTime` (RFC3339 or
   epoch seconds). Also read `planName` and `accountEmail` for the plan badge.
5. `used_pct = (1.0 - remaining_fraction) * 100.0`, `kind = "rolling"`, `model_key = label`.

Notes: local HTTPS uses a self-signed certificate — accept invalid certs for `127.0.0.1` **only**.
Re-discover the port on every failure. This protocol is internal and may change: on any error write
`error = "Antigravity not running"` and render "unavailable", never `0%`.

**GATE 4:** with Antigravity running, its models appear in the Plans view with percentages and reset
countdowns; killing it turns those rows into an "unavailable" state within one poll cycle.

---

## 10. PHASE 5 — MODES AND SHIP

1. **Snapping** (`src-tauri/src/window/snap.rs`). Add to `Cargo.toml` the `windows` crate (already in
   §3). Use the monitor **work area**, not monitor bounds:

```rust
const SNAP_LOGICAL_PX: f64 = 14.0;

#[tauri::command]
pub fn snap_to_edges(win: tauri::WebviewWindow) -> Result<(), String> {
    let raw = win.hwnd().map_err(|e| e.to_string())?;
    let hwnd = windows::Win32::Foundation::HWND(raw.0);
    let area = unsafe {
        let mon = windows::Win32::Graphics::Gdi::MonitorFromWindow(
            hwnd, windows::Win32::Graphics::Gdi::MONITOR_DEFAULTTONEAREST);
        let mut info = windows::Win32::Graphics::Gdi::MONITORINFO {
            cbSize: std::mem::size_of::<windows::Win32::Graphics::Gdi::MONITORINFO>() as u32,
            ..Default::default() };
        windows::Win32::Graphics::Gdi::GetMonitorInfoW(mon, &mut info)
            .as_bool().then_some(info.rcWork)
    };
    let Some(area) = area else { return Ok(()) };
    let pos = win.outer_position().map_err(|e| e.to_string())?;
    let size = win.outer_size().map_err(|e| e.to_string())?;
    let t = (SNAP_LOGICAL_PX * win.scale_factor().unwrap_or(1.0)) as i32;
    let (mut x, mut y) = (pos.x, pos.y);
    if (x - area.left).abs() < t { x = area.left; }
    if (area.right  - (x + size.width  as i32)).abs() < t { x = area.right  - size.width  as i32; }
    if (y - area.top).abs() < t { y = area.top; }
    if (area.bottom - (y + size.height as i32)).abs() < t { y = area.bottom - size.height as i32; }
    if (x, y) == (pos.x, pos.y) { return Ok(()); }
    win.set_position(tauri::PhysicalPosition::new(x, y)).map_err(|e| e.to_string())
}
```

The `HWND(raw.0)` line is the only version-sensitive bit across `windows` crate releases.

Trigger on drag end, debounced 90 ms, from JS via `onMoved`. Persist
`{ monitor_name, edge, offset_ratio }`; on boot restore it, or clamp into the primary work area if
that monitor is gone.

2. **Modes.** `expanded 380×340`, `plans 380×480`, `compact 320×160`, `rail 44×160`. Resize the
   window on mode change (`set_size`), don't animate the OS window.
3. **Rail:** 6 px peeking strip, `set_ignore_cursor_events(true)`, reveal on hotkey or edge hover,
   auto-hide after 2.5 s.
4. **Opacity** 60–100% via `set_opacity`; **click-through** toggle; **pause while a fullscreen app is
   focused**.
5. **Autostart** at login, start hidden in the tray.
6. **Cost engine:** prefer vendor `cost_usd`; else `prices.json` (per 1M input/output/cache-read/
   cache-write) and label values "est.".
7. `pnpm tauri build` → NSIS installer in `src-tauri/target/release/bundle/nsis/`.

**GATE 5:** drag to all four edges and corners on two monitors at 150% scaling — flush every time;
rail mode usable; installer builds.

---

## 11. DEFINITION OF DONE

- [ ] Frameless card floats above windows, no taskbar entry, no Alt-Tab, never steals focus.
- [ ] Snaps flush to every edge/corner on multi-monitor at 125% and 150%.
- [ ] Position, mode, opacity, pinned state survive restart.
- [ ] Claude session/weekly/per-model percentages match `claude /usage` within 1%.
- [ ] Antigravity per-model percentages appear and degrade to "unavailable" when it's closed.
- [ ] Chart reflects real token usage for the last 7 days.
- [ ] Every percentage shows a countdown; every quota row shows freshness.
- [ ] No mock data remains; `grep -ri "mock" src/components` is empty.
- [ ] No `set_focus`, no credential writes, no token logging (`grep` the codebase).
- [ ] `pnpm tauri build` produces a working installer.

---

## 12. FAILURE MODES TO AVOID

| Symptom | Cause | Fix |
|---|---|---|
| White flash on launch | window visible from config | `visible:false`, `show()` after positioning |
| Black box behind rounded corners | transparency off, or a black `body` background | `transparent:true`, `background:transparent` on html/body/#root |
| Widget steals focus while typing | `set_focus()` somewhere | remove it; `focus:false` in config |
| 1 px gap after snapping | compared to monitor bounds | use `rcWork` |
| Gap only at 150% | logical/physical px mixed | `scale_factor` on the threshold, physical px for position |
| Percentages never update | poller task died | check `fetched_at_utc`; log poll errors; restart task on panic |
| `0%` for a dead provider | missing stale branch | render `—` + reason, never 0 |
| 429 storms | polling too fast | 300 s floor, honour `Retry-After`, single in-flight |
| User logged out of Claude | token refreshed by us | never refresh; read-only |
| Chart jitters on resize | animating the OS window | fixed window per mode |

---

## 13. COMMANDS

```powershell
pnpm install
pnpm tauri dev            # dev with HMR
pnpm tauri build          # installer
cargo check               # inside src-tauri, faster than a full build
```

Report at the end: phases completed, gate results, files created, decisions made, and anything you
could not verify visually.

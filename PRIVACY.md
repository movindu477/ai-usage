# Privacy Policy for AI Usage Tracker

AI Usage Tracker is designed as an offline-first, local-only desktop widget. It operates without accounts, telemetry, tracking pixels, or remote database synchronization.

## 1. Local Files & Process Data Read

The application reads only the local configuration and state files necessary to calculate usage:

1. **Claude Code Credentials (`~/.claude/.credentials.json`)**:
   - The application inspects this local file in read-only mode to extract `claudeAiOauth.accessToken` and expiration timestamps.
   - It **never** modifies, refreshes, writes to, or logs your authentication tokens.
   - The token is passed directly and exclusively via HTTPS to Anthropic's official usage endpoint (`https://api.anthropic.com/api/oauth/usage`).

2. **Claude Code Session Logs (`~/.claude/projects/*/*.jsonl`)**:
   - The application parses local JSONL assistant transcripts to aggregate token counts and task metrics offline.
   - No prompt contents or conversation texts are exported or transmitted externally.

3. **Antigravity Language Server (Local Loopback `127.0.0.1`)**:
   - The application detects running local language server instances (`agy.exe`) to read the local loopback port and session CSRF token from command line flags.
   - All status queries (`GetUserStatus`) are made strictly over local loopback (`http://127.0.0.1:<port>`) and never leave your machine.

4. **Network Interface Status**:
   - Optional local Wi-Fi link speed is parsed via the native Windows network status utility (`netsh wlan show interfaces`) strictly to display local connection speed. No network traffic is inspected or monitored.

## 2. Data Storage & Retention

- All aggregated metrics, rollups, and user preferences are stored locally in an embedded SQLite database (`usage.db`) within your local application data directory (`%APPDATA%\com.local.aiusage` or `%LOCALAPPDATA%`).
- No external databases, cloud backups, or remote storage services are used.
- You can wipe all stored data at any time via the **Reset Data** button in the in-app Settings panel or by deleting the local `usage.db` file.

## 3. Telemetry and Analytics

- **Zero Telemetry**: AI Usage Tracker contains no Google Analytics, Sentry, Mixpanel, or third-party diagnostic trackers.
- **Zero Advertising**: No tracking identifiers or ad services are bundled.

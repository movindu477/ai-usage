# Security Policy

## Supported Versions

Security updates and fixes are provided for the current active release.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

If you identify a security concern, sensitive credential handling issue, or potential vulnerability:

1. Please submit an advisory or report directly to the project maintainers via private GitHub security advisory.
2. Please do not publish security issues in public issue trackers until an update or mitigation has been evaluated.
3. Reports will be acknowledged promptly and reviewed for remediation.

## Core Security Commitments

- **Read-Only Access**: AI Usage Tracker treats local credential files as strictly read-only. It never writes back to credentials or requests elevated privileges.
- **Local Scope**: All Antigravity communications take place exclusively across localhost (127.0.0.1).
- **No Background Remote Servers**: The application does not spin up any external listening services or expose network ports.

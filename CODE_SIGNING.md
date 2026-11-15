# Code Signing Policy

Free code signing is provided by [SignPath.io](https://signpath.io/), with code signing certificates issued by the [SignPath Foundation](https://signpath.org/).

## Security & Integrity Principles

1. **Verifiable Builds:** All published binaries and release assets are compiled exclusively on public GitHub Actions runners triggered by signed version tags (`v*`).
2. **Local-Only & Open Source:** The project contains no proprietary third-party libraries, no closed-source blobs, and zero telemetry or analytics SDKs.
3. **Transparent Auditing:** All code touching local configurations or credentials is strictly read-only, fully open source, and auditable under the MIT license.

## Governance & Signing Roles

| Role | Responsibility | Requirement |
|---|---|---|
| **Authors** | Author source code, submit pull requests, and manage issue discussions. | Verified GitHub account with Multi-Factor Authentication (MFA) enabled. |
| **Reviewers** | Review and audit code changes with scrutiny on credential-handling and network security. | Maintainer access, MFA mandatory, sign-off on pull requests. |
| **Approvers** | Approve build artifacts in SignPath for release signing and tag official releases. | SignPath Foundation organization member with MFA enabled. |

## Verification

Release artifacts include:
- Windows Authenticode signatures provided by SignPath Foundation.
- SHA-256 checksums published alongside each release on GitHub Releases.
- Automated Tauri updater signatures (`.sig`) verified at runtime.

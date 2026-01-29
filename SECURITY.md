# Security Policy

## Supported Versions

Security fixes are provided for the latest release on the default branch. If you are running an older commit or a fork, please rebase/upgrade before reporting issues unless the issue is clearly still present on the latest code.

## Reporting a Vulnerability

If you believe you have found a security vulnerability, please do not open a public GitHub issue.

Instead, report it privately by emailing:

- security@algorand.foundation

If you cannot use email for some reason, open a GitHub issue with the minimum possible details and request a private channel; a maintainer will follow up.

### What to Include

Please include:

- A description of the issue and potential impact
- Steps to reproduce (proof-of-concept if available)
- Affected components (pages, API routes, packages)
- Any relevant logs, screenshots, or stack traces
- Your suggested fix or mitigation (optional)

### Response Targets

We aim to:

- Acknowledge receipt within 3 business days
- Provide a status update within 10 business days

Timelines may vary depending on severity and complexity.

## Coordinated Disclosure

We prefer coordinated vulnerability disclosure. Please allow reasonable time for investigation and remediation before public disclosure.

## Security Considerations for This Project

This repo includes:

- Wallet connections (transaction signing and account access)
- Server-side routes under `src/pages/api/*` (Astro server endpoints)
- Deployment to Cloudflare Pages/Workers (see `wrangler.jsonc`)

Please pay special attention to:

- Private key / mnemonic handling (`XGOV_DAEMON_MNEMONIC` and local `.env*` files)
- Input validation for API routes (especially admin or assignment endpoints)
- Third-party API integrations (committee data, discourse, NFD)

## Vulnerability Rewards

This repository does not currently operate a public bug bounty. If that changes, it will be documented here.

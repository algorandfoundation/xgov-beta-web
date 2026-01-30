# Architecture

This document describes the high-level architecture of xGov Beta Web.

## Overview

xGov Beta Web is an Astro (SSR) application with React used for interactive UI. It is designed to be deployed to Cloudflare Pages (Workers runtime) and to integrate with Algorand via the Algorand SDK and the xGov TypeScript SDK.

Core responsibilities:

- Render public and authenticated pages (proposal browsing, creation, profile)
- Integrate with Algorand wallets for signing transactions
- Read/write xGov state via the xGov Registry application
- Provide server-side endpoints for operational workflows (e.g., voter assignment)

## Runtime Model

- Astro runs in `output: "server"` mode.
- Routes are defined under `src/pages/*`.
- API endpoints are implemented as server routes under `src/pages/api/*`.
- The project is configured for Cloudflare via `@astrojs/cloudflare` and `wrangler.jsonc`.

## Key Directories

- `src/pages/`
  - Page routes (Astro).
  - API routes live under `src/pages/api/`.

- `src/api/`
  - Higher-level integration modules for Algorand and other services.
  - Includes Registry/proposal/council logic and related types.

- `src/hooks/`
  - React hooks for accessing SDK, wallet state, queries, and app state.

- `src/stores/`
  - Nanostores for app-level state (theme, wallet, first-time user, etc.).

- `src/components/`
  - React components.
  - `src/components/ui/` contains shared UI primitives.

- `public/` and `src/pages/api/committees/`
  - Committee JSON artifacts used by operational endpoints in some deployments.

## Data Flows

### Read-only Registry State

1. UI components call hooks (e.g., proposals/registry hooks).
2. Hooks call into `src/api/*` modules.
3. API modules use Algorand SDK / xGov SDK to query algod/indexer.
4. Results are cached via TanStack Query.

### Signing Transactions

1. User connects a wallet (WalletConnect/Pera/Defly/Lute depending on integration).
2. UI triggers an action (create proposal, vote, register).
3. Transaction groups are composed in `src/api/*` using Algorand SDK.
4. Signing is performed through wallet providers and submitted to the network.

### Server-side Operational Endpoints

API routes under `src/pages/api/*` run server-side:

- `/api/assign` is used to assign voters to submitted proposals.
- These routes may require sensitive configuration (mnemonics) and are intended to be protected/operated carefully.

## Configuration

Environment variables are sourced from Astro/Vite (public variables are typically prefixed with `PUBLIC_`).

Key groups:

- Network connectivity: algod/indexer/kmd endpoints
- Registry addressability: `PUBLIC_REGISTRY_APP_ID`
- Operational tooling: `XGOV_DAEMON_MNEMONIC`, committee data sources

For developer convenience, the `mock-init` script can bootstrap local configuration.

## Deployment

- Cloudflare runtime settings are in `wrangler.jsonc`.
- Deployments are typically triggered by GitHub Actions on branch pushes.
- Two primary environments exist in practice: testnet and mainnet (branch-driven).

## Related Repos

- xgov-beta-sc: smart contracts and artifacts
- xgov-beta-ts: generated clients and SDK wrappers
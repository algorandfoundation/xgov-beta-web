# xGov Beta Web

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Built with Astro](https://img.shields.io/badge/Built%20with-Astro-BC52EE?logo=astro)](https://astro.build)
[![Cloudflare Pages](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Pages-F38020?logo=cloudflare)](https://pages.cloudflare.com)

The official web interface for Algorand's xGov program, a decentralized public goods funding mechanism on Algorand, enabling community-driven proposal submission and voting.

## Features

- **Proposal Management**: Create, edit, and submit governance proposals
- **Voting System**: Participate in proposal voting with weighted voting power
- **xGov Registration**: Register and manage xGov status
- **Council Management**: Admin tools for council members
- **Wallet Integration**: Support for multiple Algorand wallets (Pera, Defly, Lute, WalletConnect)
- **Real-time Updates**: Live proposal status and voting progress
- **PWA Support**: Progressive Web App for mobile-first experience
- **Dark Mode**: Full dark mode support with system preference detection

## Related Repositories

| Repository | Description |
|------------|-------------|
| [xgov-beta-sc](https://github.com/algorandfoundation/xgov-beta-sc) | Smart contracts written in Algorand Python |
| [xgov-beta-ts](https://github.com/algorandfoundation/xgov-beta-ts) | TypeScript SDK with typed clients & SDK for the smart contracts |

## Tech Stack

- **Framework**: [Astro](https://astro.build) with Server-Side Rendering
- **UI Library**: [React](https://react.dev) with TypeScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com) with custom design system
- **State Management**: [Nanostores](https://github.com/nanostores/nanostores) with React bindings
- **Data Fetching**: [TanStack Query](https://tanstack.com/query) (React Query)
- **Form Handling**: [React Hook Form](https://react-hook-form.com) with Zod validation
- **Blockchain**: [Algorand SDK](https://algorand.github.io/js-algorand-sdk/) v3
- **Wallet Connection**: [use-wallet-react](https://github.com/TxnLab/use-wallet) v4
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com)
- **Testing**: [Storybook](https://storybook.js.org) with Chromatic

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org) >= 18.x
- [npm](https://npmjs.com)
- [Docker](https://www.docker.com) (for local Algorand network)
- [AlgoKit](https://github.com/algorandfoundation/algokit-cli) CLI

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/algorandfoundation/xgov-beta-web.git
cd xgov-beta-web
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

For local development, the recommended path is to run `npm run mock-init`, which will bootstrap local configuration (including generating a `.env.development` based on the template) and deploy/initialize the xGov Registry on LocalNet.

If you prefer to configure manually, copy `.env.template` to `.env.development` and fill in values as needed.

```bash
# Algorand Node Configuration
PUBLIC_ALGOD_SERVER=http://localhost
PUBLIC_ALGOD_PORT=4001
PUBLIC_ALGOD_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

PUBLIC_INDEXER_SERVER=http://localhost
PUBLIC_INDEXER_PORT=8980
PUBLIC_INDEXER_TOKEN=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa

PUBLIC_KMD_SERVER=http://localhost
PUBLIC_KMD_PORT=4002

# xGov Registry Application ID (set after deployment)
PUBLIC_REGISTRY_APP_ID=

# Optional: Daemon configuration for voter assignment
XGOV_DAEMON_MNEMONIC=
COMMITTEE_API_URL=
MAX_CONCURRENT_PROPOSALS=5
MAX_REQUESTS_PER_PROPOSAL=5
```

### 4. Start Local Algorand Network

```bash
algokit localnet start
```

### 5. Initialize xGov Registry Contract

The fastest way to set up a local development environment:

```bash
# Replace YOUR_ALGORAND_ADDRESS with your test wallet address
npm run mock-init -- --council-address YOUR_ALGORAND_ADDRESS
```

Or using the short alias:

```bash
npm run mock-init -- -c YOUR_ALGORAND_ADDRESS
```

This script will:
- Deploy the xGov Registry smart contract
- Fund the contract
- Set up committee management
- Configure your address as a council member

### 6. Start Development Server

```bash
npm dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

## Project Structure

```
xgov-beta-web/
├── public/                 # Static assets
│   └── committees/         # Committee data JSON files
├── src/
│   ├── api/               # API utilities and Algorand interactions
│   │   ├── algorand/      # Algorand client configuration
│   │   ├── discourse/     # Forum integration
│   │   ├── nfd/           # NFD (Non-Fungible Domains) integration
│   │   └── types/         # TypeScript type definitions
│   ├── components/        # React components
│   │   ├── ui/           # Base UI components (shadcn/ui)
│   │   └── ...           # Feature-specific components
│   ├── functions/         # Utility functions
│   ├── hooks/             # React hooks
│   │   └── ...           # Feature hooks
│   ├── layouts/           # Astro layout components
│   ├── pages/             # Astro pages and API routes
│   │   └── api/          # API endpoints
│   ├── recipes/           # Component composition patterns
│   ├── stores/            # Nanostores state management
│   ├── styles/            # Global styles and Tailwind config
│   └── utils/             # General utilities
├── __fixtures__/          # Test fixtures
├── scripts/               # Utility scripts
├── .storybook/            # Storybook configuration
├── astro.config.mjs       # Astro configuration
├── tailwind.config.mjs    # Tailwind CSS configuration
├── wrangler.jsonc         # Cloudflare Workers configuration
└── package.json
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run dev:testnet` | Start development server with testnet env |
| `npm run dev:mainnet` | Start development server with mainnet env |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally (via Wrangler) |
| `npm run lint` | Run ESLint |
| `npm run prettier` | Check code formatting |
| `npm run storybook` | Start Storybook development server |
| `npm run build-storybook` | Build Storybook for deployment |
| `npm run test` | Run Storybook tests |
| `npm run coverage` | Run tests with coverage |
| `npm run mock-init` | Initialize local development environment |
| `npm run mock-init-assign` | Initialize with mock voter assignment data |

## API Endpoints

### Voter Assignment API

The application includes a POST endpoint at `/api/assign` for automated voter assignment:

```bash
curl -X POST https://your-domain/api/assign \
  -H "Content-Type: application/json" \
  -d '{"proposalIds": [123, 456]}'
```

**Request Options:**
- `proposalIds` (optional): Array of specific proposal IDs to process

**Response:**
```json
{
  "message": "Processed 10 proposals in 5.25s using parallel processing",
  "results": {
    "success": 8,
    "failed": 2,
    "details": [...]
  },
  "processingDetails": {
    "concurrencyLevel": 10,
    "executionTimeSeconds": 5.25
  }
}
```

### Committee Data Format

Committee JSON files should follow this structure:

```json
{
  "xGovs": [
    {
      "address": "ALGORAND_ADDRESS",
      "votes": 1000
    }
  ]
}
```

## Deployment

This project uses GitHub Actions for automated deployments to Cloudflare Pages.

### Environments

| Branch | Environment | Description |
|--------|-------------|-------------|
| `main` | Testnet | Staging environment for testing |
| `mainnet` | Mainnet | Production environment |

### Required GitHub Secrets

```
CLOUDFLARE_API_TOKEN          # Cloudflare API token
CF_ACCOUNT_ID                 # Cloudflare account ID
CF_PROJECT_NAME_TESTNET       # Cloudflare project name for testnet
CF_PROJECT_NAME_MAINNET       # Cloudflare project name for mainnet
```

### Environment Files

- `.env.testnet` - Testnet configuration
- `.env.mainnet` - Mainnet configuration

## Manual Contract Setup (Alternative)

If you prefer manual setup via Lora:

1. Get the [arc32.json artifact](https://github.com/algorandfoundation/xgov-beta-sc/blob/main/smart_contracts/artifacts/xgov_registry/XGovRegistry.arc32.json)
2. Navigate to Lora (`algokit localnet explore`)
3. Connect your wallet (Localnet + KMD)
4. App Lab → Create App Interface → Deploy New App
5. Upload arc32.json and deploy
6. Fund the contract from Lora → Fund
7. Call `set_committee_manager`, `set_xgov_daemon`, and `declare_committee`

## Contributing

We welcome contributions. Please see our [Contributing Guidelines](CONTRIBUTING.md) for details on:

- Development workflow
- Pull request process
- Coding standards

## Security

For security vulnerabilities, please see our [Security Policy](SECURITY.md).

**Do not** report security vulnerabilities through public GitHub issues.

## License

This project is licensed under the **GNU Affero General Public License v3.0** (AGPL-3.0).

See the [LICENSE](LICENSE) file for details.

### What this means:

- You can use, modify, and distribute this software
- You can use it for commercial purposes
- You must disclose your source code when distributing
- Network use counts as distribution (AGPL requirement)
- You must use the same license for derivative works
- You must state changes made to the code

## Acknowledgments

- [Algorand Foundation](https://algorand.foundation) for supporting the xGov program
- The Algorand developer community
- All contributors to this project

## Support

- **Documentation**: [xGov Beta Docs](https://docs.google.com/document/d/16bVBovvmMXvz-iazF7PK_FbsL-hetjomMk0xhPJZ-2g/edit)
- **Issues**: [GitHub Issues](https://github.com/algorandfoundation/xgov-beta-web/issues)
- **Discussions**: [GitHub Discussions](https://github.com/algorandfoundation/xgov-beta-web/discussions)

## Additional Documentation

- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- Security policy: [SECURITY.md](SECURITY.md)

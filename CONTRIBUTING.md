# Contributing to xGov Beta Web

First off, thank you for considering contributing to xGov Beta Web! It's people like you that make the Algorand ecosystem such a great community.

## Table of Contents

- [Getting Started](#getting-started)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Workflow](#development-workflow)
- [Style Guidelines](#style-guidelines)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Community](#community)

## Getting Started

### Prerequisites

Before you begin, ensure you have:

- [Node.js](https://nodejs.org) >= 18.x installed
- [pnpm](https://pnpm.io) package manager
- [Docker](https://www.docker.com) for running local Algorand network
- [AlgoKit](https://github.com/algorandfoundation/algokit-cli) CLI installed
- Familiarity with [Astro](https://astro.build), [React](https://react.dev), and [TypeScript](https://www.typescriptlang.org)

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub

2. **Clone your fork locally**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/xgov-beta-web.git
   cd xgov-beta-web
   ```

3. **Add the upstream remote**:
   ```bash
   git remote add upstream https://github.com/algorandfoundation/xgov-beta-web.git
   ```

4. **Install dependencies**:
   ```bash
   pnpm install
   ```

5. **Start the local Algorand network**:
   ```bash
   algokit localnet start
   ```

6. **Initialize the development environment**:
   ```bash
   pnpm run mock-init -- -c YOUR_TEST_ADDRESS
   ```

   The `mock-init` script bootstraps local configuration (including generating a `.env.development` based on the template) and initializes the xGov Registry on LocalNet.

7. **Start the development server**:
   ```bash
   pnpm dev
   ```

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates.

When filing a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs **actual behavior**
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node version)
- **Console errors** or error messages

Use the bug report template when creating issues.

### Suggesting Enhancements

Enhancement suggestions are welcome! When suggesting:

- **Use a clear title** for the suggestion
- **Describe the problem** the enhancement would solve
- **Provide examples** of how it would work
- **Explain why** this would be useful to most users

### Your First Code Contribution

Unsure where to begin? Look for issues labeled:

- `good first issue` - Simple issues for newcomers
- `help wanted` - Issues where we need community help
- `documentation` - Documentation improvements

### Writing Documentation

Documentation improvements are always welcome:

- Fix typos or clarify existing docs
- Add examples and tutorials
- Improve code comments
- Add JSDoc comments to functions

## Development Workflow

### Branching Strategy

We use a simplified Git flow:

- `main` - Development branch, deploys to testnet
- `mainnet` - Production branch, deploys to mainnet
- Feature branches - Created from `main`

### Creating a Feature Branch

```bash
# Sync with upstream
git fetch upstream
git checkout main
git merge upstream/main

# Create your feature branch
git checkout -b feature/your-feature-name
```

### Making Changes

1. **Write your code** following our style guidelines
2. **Add tests** for new functionality (Storybook stories)
3. **Update documentation** as needed
4. **Run linting and tests**:
   ```bash
   pnpm lint
   pnpm prettier --check .
   pnpm test
   ```

### Storybook Development

We use Storybook for component development and testing:

```bash
# Start Storybook
pnpm storybook

# Run visual regression tests
pnpm test

# Build Storybook
pnpm build-storybook
```

### Working with the Smart Contract

The frontend interacts with the xGov Registry smart contract. Key areas:

- `src/api/registry.ts` - Registry interactions
- `src/api/proposals.ts` - Proposal management
- `src/api/council.ts` - Council operations
- `src/hooks/sdk/` - SDK integration hooks

## Style Guidelines

### TypeScript

- Avoid `any` types when possible
- Use descriptive variable and function names
- Document complex logic with comments

### React Components

- Use functional components with hooks
- Follow the established component structure
- Place components in appropriate directories
- Create Storybook stories for UI components

```typescript
// Good component structure
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MyComponentProps {
  title: string;
  className?: string;
}

export function MyComponent({ title, className }: MyComponentProps) {
  const [state, setState] = useState(false);
  
  return (
    <div className={cn('base-styles', className)}>
      {title}
    </div>
  );
}
```

### CSS/Tailwind

- Use Tailwind CSS utility classes
- Follow the existing design system
- Use `cn()` utility for conditional classes
- Avoid inline styles

### File Organization

```
src/
├── components/
│   └── MyComponent/
│       ├── index.tsx        # Main component
│       ├── MyComponent.stories.tsx  # Storybook stories
│       └── types.ts         # Type definitions (if needed)
├── hooks/
│   └── useMyHook.ts
└── api/
    └── myService.ts
```

### Code Formatting

We use Prettier and ESLint:

```bash
# Check formatting
pnpm prettier --check .

# Fix formatting
pnpm prettier --write .

# Run linting
pnpm lint

# Fix lint issues
pnpm lint --fix
```

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

## Pull Request Process

### Before Submitting

1. **Update your branch** with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

2. **Ensure all tests pass**:
   ```bash
   pnpm lint
   pnpm test
   ```

3. **Build the project**:
   ```bash
   pnpm build
   ```

### Submitting Your PR

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request** on GitHub

3. **Fill out the PR template** completely:
   - Describe your changes
   - Link related issues
   - Add screenshots for UI changes
   - List any breaking changes

### PR Review Process

1. **Automated checks** must pass (lint, tests, build)
2. **Code review** by at least one maintainer
3. **Visual review** via Chromatic for UI changes
4. **Address feedback** promptly
5. **Squash and merge** once approved

### After Your PR is Merged

- Delete your feature branch
- Pull the latest changes to your local `main`
- Celebrate your contribution.

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm coverage

# Run Storybook tests interactively
pnpm storybook
# Then in another terminal:
pnpm test
```

### Writing Tests

- Create Storybook stories for UI components
- Include interaction tests when applicable
- Test edge cases and error states

## Related Projects

When working on this project, you may also need to work with:

- [xgov-beta-sc](https://github.com/algorandfoundation/xgov-beta-sc) - Smart contracts
- [xgov-beta-ts](https://github.com/algorandfoundation/xgov-beta-ts) - TypeScript SDK

## Community

### Getting Help

- Open a [GitHub Discussion](https://github.com/algorandfoundation/xgov-beta-web/discussions)
- Check existing issues and discussions
- Join the Algorand developer community

### Recognition

Contributors are recognized in:
- Release notes
- README acknowledgments
- GitHub contributor badges

## License

By contributing to xGov Beta Web, you agree that your contributions will be licensed under the [AGPL-3.0 License](LICENSE).

---

Thank you for contributing to xGov Beta Web. Your efforts help improve governance on Algorand.

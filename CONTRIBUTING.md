# Contributing to pocket-vue

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests (watch mode)
pnpm test

# Run tests once
pnpm test:once

# Type check
pnpm typecheck

# Build
pnpm build
```

## Pull Request Process

1. **Fork** the repository and create your branch from `main`.
2. **Make your changes** and ensure tests pass (`pnpm test:once`).
3. **Run the type checker** (`pnpm typecheck`).
4. **Commit** your changes using [conventional commits](https://www.conventionalcommits.org/):
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation changes
   - `chore:` for maintenance tasks
5. **Open a Pull Request** with a clear description of the change.

## Publishing a Release

Releases are published automatically to npm when a `v*` tag is pushed to GitHub.

### Using the release script (recommended)

```bash
pnpm release
```

This will:

1. Prompt you to select a version increment (`patch`, `minor`, or `major`)
2. Build the package
3. Generate the changelog
4. Commit the version bump and changelog
5. Create a git tag (`vX.Y.Z`)
6. Push the tag — this triggers the GitHub Action that publishes to npm

### Publishing manually

If you need to publish without the release script:

```bash
# Update the version in package.json
npm version patch  # or minor / major

# Push the tag to trigger the CI publish
git push origin --tags
```

The GitHub Action (`.github/workflows/npm-publish.yml`) will install dependencies, build, and run `pnpm publish --no-git-checks --access public` using the `NPM_TOKEN` repository secret.

## Reporting Issues

- Use [GitHub Discussions](https://github.com/ws-rush/pocket-vue/discussions) for questions and bug reports.
- Include a minimal reproduction when reporting bugs.

## Code Style

- TypeScript is used throughout the project.
- Follow the existing code style and conventions.
- Keep changes focused and minimal.

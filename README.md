# Riftbound

Riftbound is a custom TCG (trading card game) deck builder, cross-platform (iOS, Android, Web) with a serverless AWS backend.

## Tech Stack

- **Frontend**: Expo (React Native) + Tamagui for universal UI components
- **Backend**: AWS Lambda + API Gateway
- **Database**: DynamoDB
- **Auth**: Amazon Cognito
- **Package manager**: pnpm workspaces
- **Language**: TypeScript throughout
- **Formatting/Linting**: Biome

## Monorepo Structure

```
apps/app/            # Expo app — runs on iOS, Android, and Web
packages/shared/      # Shared TypeScript types (Card, Deck, User)
packages/functions/   # AWS Lambda handlers
```

`@riftbound/shared` is consumed by both `apps/app` and `packages/functions` via the `workspace:*` protocol.

## Getting Started

Node must be loaded via nvm before any pnpm command works in WSL:

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
```

Install dependencies from the repo root:

```bash
pnpm i
```

## Scripts

All commands run from the repo root unless noted.

| Script | Description |
| --- | --- |
| `pnpm start` | Start the Expo dev server (choose platform in terminal) |
| `pnpm web` | Run the app in a web browser |
| `pnpm android` | Run the app on Android |
| `pnpm ios` | Run the app on iOS |
| `pnpm build:functions` | Build the AWS Lambda functions |
| `pnpm typecheck` | Typecheck all packages |
| `pnpm format` | Format all files with Biome (writes changes) |
| `pnpm format:check` | Check formatting without writing |
| `pnpm lint` | Lint all files with Biome |

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Deck Builder — a custom TCG (trading card game) deck builder. Cross-platform (iOS, Android, Web) with a serverless AWS backend.

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
apps/app/        # Expo app — runs on iOS, Android, and Web
packages/shared/    # Shared TypeScript types (Card, Deck, User)
packages/functions/ # AWS Lambda handlers
```

`@deck-builder/shared` is consumed by both `apps/app` and `packages/functions` via the `workspace:*` protocol.

## Commands

All commands run from the repo root unless noted.

```bash
# Start Expo dev server (choose platform in terminal)
pnpm start

# Run on specific platform
pnpm web
pnpm android
pnpm ios

# Build Lambda functions
pnpm build:functions

# Typecheck all packages
pnpm typecheck

# Format all files (writes changes)
pnpm format

# Check formatting without writing
pnpm format:check

# Lint all files
pnpm lint
```

Node must be loaded via nvm before any pnpm command works in WSL:
```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
```

## Architecture Notes

### Shared Types
`packages/shared/src/types/` defines the canonical data shapes (`Card`, `Deck`, `User`) used across the app and Lambda functions. Always extend types here — never duplicate them in individual packages.

### UI Components
Tamagui replaces Mantine (which is web-only). Use Tamagui primitives (`YStack`, `XStack`, `Text`, `Button`, etc.) everywhere — they render correctly on both native and web. The Tamagui config lives at `apps/app/tamagui.config.ts` and uses `@tamagui/config/v3` as its base.

### Lambda Functions
Handlers behind authenticated routes (e.g. `packages/functions/src/decks/getDecks.ts`, `src/users/getUser.ts`, `src/users/updateUser.ts`) use `APIGatewayProxyHandlerV2WithJWTAuthorizer` and read the caller's id from `event.requestContext.authorizer.jwt.claims.sub` — never from path params, since routes are protected by a Cognito JWT authorizer at the API Gateway level. DynamoDB access uses `@aws-sdk/lib-dynamodb` (`DynamoDBDocumentClient`). Table names are read from environment variables (e.g. `process.env.DECKS_TABLE`, `process.env.USERS_TABLE`).

Infra (API Gateway HTTP API, Cognito User Pool + Client, DynamoDB tables) is defined in `packages/functions/serverless.yml` and deployed with the **Serverless Framework v3** (`pnpm deploy:functions`). Stick to v3 — v4 requires signing into Serverless's dashboard/account even for local commands like `serverless print`, which doesn't fit a self-hosted AWS setup. New handlers need a matching entry under `functions:` in `serverless.yml` (handler path + HTTP route + `cognitoJwt` authorizer if the route needs auth).

### Local dev (no AWS account needed)
`pnpm dev:functions` runs the whole stack locally: `serverless-offline` emulates API Gateway + Lambda on `http://localhost:3000`, and `dynalite` (a pure-JS DynamoDB emulator, chosen over the official Docker/Java-based DynamoDB Local since neither is installed here) emulates DynamoDB on `localhost:8000` — table creation happens in `packages/functions/scripts/local-dynamodb.ts`. This all runs under a dedicated `local` stage (`serverless offline start --stage local`), not `dev`, so it never touches real AWS resources.

Auth locally is mocked: `serverless-offline`'s `ignoreJWTSignature: true` (in `custom.serverless-offline`) skips signature verification entirely, but it still checks the token's `iss`/`aud` claims against `custom.authorizerConfig.local` in `serverless.yml`. Run `pnpm --filter @deck-builder/functions dev:token [userId]` to mint a matching unsigned JWT for curl/Postman testing — it is **only** valid against the local stage; there is no real Cognito pool behind it. `packages/functions/src/lib/dynamoClient.ts` points the AWS SDK at `localhost:8000` when `process.env.IS_OFFLINE` is set (which `serverless-offline` sets automatically), and at real AWS otherwise.

### Expo Notes
Expo version is **57** — always check https://docs.expo.dev/versions/v57.0.0/ before using any Expo API, as APIs change between versions. The Tamagui babel plugin is configured in `apps/app/babel.config.js` and must list `tamagui` in `components`.

### pnpm + Metro
pnpm does not hoist dependencies (`shamefully-hoist` is intentionally absent). Instead, `apps/app/metro.config.js` configures Metro with `watchFolders` pointing to the monorepo root and `resolver.nodeModulesPaths` covering both the app's and root's `node_modules`. Do not add `shamefully-hoist=true` to `.npmrc` — fix module resolution issues in the Metro config instead.

### Formatting & Linting
Biome is configured at the repo root (`biome.json`) and covers the whole monorepo — no per-package config needed. Style: 2-space indent, single quotes, semicolons only where needed (`asNeeded`). `apps/app/.tamagui/` (a generated Tamagui cache, gitignored) is excluded from Biome's file set.

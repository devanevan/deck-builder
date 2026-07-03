# Riftbound Card Database Sync — Plan

Status: **blocked** — waiting on Riot Developer Portal application approval for a
production/personal API key. The temp key tested during planning (`RGAPI-bea28a74-...`)
was rejected by Riot's gateway (`401 Unknown apikey`) against both the riftbound
endpoint and a stable LoL endpoint, so it's not usable for verifying the response
shape yet.

## Goal

Compile a database of Riftbound cards by pulling from Riot's `riftbound-content-v1`
`GET_getContent` endpoint, store them in DynamoDB, and serve them to the app through
the existing Lambda + API Gateway pattern.

## Storage decision

DynamoDB is the source of truth (not a static JSON file checked into
`packages/shared`), so card updates don't require an app redeploy — the app fetches
current data from `GET /cards` and can cache it locally (e.g. AsyncStorage) if
offline support matters later.

## Components

1. **Secret storage**
   - Riot API key goes in SSM Parameter Store as a `SecureString`
     (e.g. `/riftbound/riot-api-key`).
   - Referenced in `serverless.yml` via `${ssm:/riftbound/riot-api-key}`.
   - Never committed in plaintext, never placed in a `.env` that's checked in.

2. **Shared types** (`packages/shared/src/types/card.ts`)
   - Current `Card` type (id, name, type, rarity, cost, attack, defense, description,
     imageUrl, createdAt, updatedAt) needs reconciling against Riftbound's actual
     field names once the live response is visible.
   - Likely additions: `set`/`expansion`, `faction`/`domain`, external
     `riotCardId` (Riot's id) vs. our internal `id`.
   - **Do not finalize field mapping until a working key confirms the real
     response shape.**

3. **DynamoDB `CardsTable`** (new resource in `packages/functions/serverless.yml`)
   - Partition key: `id` (card id).
   - Consider a GSI on `set` if the app needs to filter/browse by expansion.
   - `BillingMode: PAY_PER_REQUEST`, matching `DecksTable`/`UsersTable`.

4. **Sync Lambda** — `packages/functions/src/cards/syncCards.ts`
   - Calls Riot's `getContent` endpoint using the SSM-sourced API key.
   - Transforms the response into our `Card` shape.
   - Batch-writes to `CardsTable` (`BatchWriteCommand`, chunked to DynamoDB's 25-item
     limit).
   - Triggered by an EventBridge `schedule` event in `serverless.yml` (cadence TBD —
     daily is a reasonable starting point since card sets don't change often).
   - No JWT authorizer needed — it's not an HTTP route, just a scheduled invocation.

5. **Read route** — `packages/functions/src/cards/getCards.ts`
   - `GET /cards`, following the same `DynamoDBDocumentClient` pattern as
     `getDecks.ts`.
   - Decide auth requirement: card data isn't user-specific, so this can likely be
     unauthenticated (no `cognitoJwt` authorizer), unlike the existing routes.

6. **Local dev**
   - Sync script should also work against `dynalite` under the `local` stage so it
     can be tested without touching real AWS or burning real API rate limits,
     consistent with `pnpm dev:functions`.
   - May want a `pnpm --filter @riftbound/functions sync:cards` script for manual
     invocation during development, separate from the scheduled prod trigger.

## Open questions to resolve once the API key is approved

- Exact response shape of `GET_getContent`: field names, whether it's paginated,
  whether a `locale` (or other) query param is required.
- Rate limits on the riftbound API — affects how the sync Lambda should batch/throttle
  requests to Riot.
- Whether `getContent` returns *all* cards in one call or needs iteration (e.g. by
  set/expansion).
- Confirm regional routing value for the riftbound API host (tested `na1`,
  `americas`, `europe`, `asia` — all returned the same auth error, so routing
  couldn't be confirmed either).

## Next steps

1. Wait for Riot API key approval.
2. Hit `getContent` with a valid key, capture a sample response, and update the
   "Shared types" and "Open questions" sections above with confirmed field mappings.
3. Implement `CardsTable`, `syncCards.ts`, `getCards.ts` per the plan above.
4. Wire the SSM parameter and EventBridge schedule into `serverless.yml`.
</content>

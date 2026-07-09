# Riftbound Card Database Sync — Plan

Status: **implemented, manual sync only**. Supersedes the earlier plan that
targeted Riot's official `riftbound-content-v1` API (blocked on Developer
Portal key approval). That approach is dropped in favor of
[Riftcodex](https://riftcodex.com), an unofficial, public, no-auth-required
REST API for Riftbound card data (`https://api.riftcodex.com`, docs at
`/docs`, OpenAPI at `/openapi.json`).

**Riftcodex sits behind Cloudflare, which 403s requests from AWS Lambda's
egress IPs** (confirmed: identical request succeeds from a non-AWS machine,
fails with `403 Forbidden` from the deployed Lambda). There's no documented
UA/auth workaround. As a result, `syncCards` is **not** deployed as a
scheduled Lambda — it's run manually from a developer machine via
`pnpm --filter @deck-builder/functions sync:cards`. If Riftcodex allowlists
the Lambda's IP in the future (pending an email to `support@riftcodex.com`),
the EventBridge schedule can be reinstated.

## Goal

Sync the full Riftbound card database from Riftcodex into DynamoDB, serve it to
the app through the existing Lambda + API Gateway pattern, and validate deck
legality (Legend-based domain restriction) server-side.

## Source API (Riftcodex)

No API key needed. Relevant endpoints:

- `GET /cards` — paginated list (`page`, `size` params, `size` max 100)
- `GET /cards/search`, `/cards/name`, `/cards/{id}`
- `GET /sets`, `/sets/{id}`, etc.
- `GET /index/*` — enumerations (`domains`, `card-types`, `rarities`, `keywords`, ...)

Confirmed `Card` response shape:

```
Card {
  id: string
  name: string
  riftbound_id: string
  tcgplayer_id: string | null
  collector_number: integer
  attributes: { energy: int|null, might: int|null, power: int|null }
  classification: { type: string, supertype: string|null, rarity: string, domain: string[] }
  text: { rich: string, plain: string, flavour: string|null }
  set: { set_id: string, label: string }
  media: { image_url: string, artist: string, accessibility_text: string }
  tags: string[]
  orientation: string
  metadata: { clean_name: string, updated_on: string|null, alternate_art: bool, overnumbered: bool, signature: bool }
}
```

Confirmed via live queries against `api.riftcodex.com`:

- `classification.type` (6 values): `Battlefield, Gear, Legend, Rune, Spell, Unit`
- `classification.domain` (7 values): `Body, Calm, Chaos, Colorless, Fury, Mind, Order`
- Cards of `type: "Legend"` always carry exactly 2 domains (e.g.
  `Teemo - Swift Scout: ['Mind', 'Chaos']`), except `Colorless` staples.
  This is the deck-legality anchor — see below.
- All print variants (alternate art, signature, overnumbered) are separate
  `Card` entries with the same `riftbound_id` family but distinct `id`. We
  store all of them, not a collapsed canonical set.

## Storage decision

DynamoDB is the source of truth (not a static file in `packages/shared`), so
card updates don't require an app redeploy.

## Deck legality (new scope)

A deck picks exactly one `Legend` card. That Legend's `classification.domain`
(2 entries) sets the deck's legal domains. Every non-Legend card added to the
deck must have a `classification.domain` that intersects the Legend's domains,
or be `Colorless`.

This validation moves into the deck write path (`packages/functions/src/decks/`)
once card data is queryable, so it needs the `CardsTable` populated first.

## Components

1. **Shared types** (`packages/shared/src/types/card.ts`)
   - Replace the current placeholder `Card` type (creature/spell/artifact/land,
     attack/defense — doesn't match Riftbound at all) with a type mirroring the
     Riftcodex shape above.
   - Add a `Domain` union (`Body | Calm | Chaos | Colorless | Fury | Mind | Order`)
     and a `CardType` union (`Battlefield | Gear | Legend | Rune | Spell | Unit`)
     for use in both card storage and deck legality checks.

2. **DynamoDB `CardsTable`** (new resource in `packages/functions/serverless.yml`)
   - Partition key: `id` (Riftcodex id — stable per print variant).
   - GSI on `set.set_id` for browsing by expansion.
   - GSI on `classification.type` to cheaply fetch all `Legend` cards for deck-builder UI.
   - `BillingMode: PAY_PER_REQUEST`, matching `DecksTable`/`UsersTable`.

3. **Sync script** — `packages/functions/src/cards/syncCards.ts`
   - Paginates `GET https://api.riftcodex.com/cards?page=N&size=100` until exhausted.
   - No secret/SSM parameter needed (no auth).
   - Batch-writes to `CardsTable` (`BatchWriteCommand`, chunked to 25 items).
   - **Not deployed as a Lambda** — Riftcodex's Cloudflare front 403s AWS
     Lambda egress IPs, so there's no scheduled/automatic trigger. Run via
     `pnpm --filter @deck-builder/functions sync:cards` from a machine with
     AWS credentials and real DynamoDB access whenever cards need refreshing.

4. **Read routes** — `packages/functions/src/cards/getCards.ts`
   - `GET /cards` — list/browse (supports filtering by `domain`, `type`, `set_id`
     via query params against the GSIs above).
   - `GET /cards/legends` (or `type=Legend` filter) — dedicated fetch for deck
     builder's Legend picker.
   - Unauthenticated — card data isn't user-specific, no `cognitoJwt` authorizer.

5. **Deck legality validation** — extend `packages/functions/src/decks/`
   handlers (create/update) to:
   - Require a `legendId` (or similar) on the deck.
   - Look up that Legend's `domain[]` in `CardsTable`.
   - Reject any deck card whose `domain[]` doesn't intersect the Legend's
     domains (unless `Colorless`).
   - Shared validation logic goes in `packages/shared` so both the Lambda and
     the app (for instant UI feedback) can use it.

6. **Local dev**
   - `pnpm sync:cards` defaults to the `local` stage/dynalite table
     (`CARDS_TABLE=riftbound-functions-cards-local`).
   - Against real AWS: `IS_OFFLINE= CARDS_TABLE=riftbound-functions-cards-<stage> AWS_REGION=<region> npx tsx scripts/sync-cards.ts`
     with AWS credentials that can reach DynamoDB (an IAM user/profile, not
     the GitHub Actions OIDC deploy role — that's CI-only).

## Open questions

- Riftcodex rate limits are undocumented — confirm empirically during sync
  implementation and back off if 429s appear.
- Whether `Colorless` cards should be legal in *every* deck or only decks whose
  Legend has no domain restriction overlap — confirm against actual Riftbound
  rules (Riftcodex is a card database, not a rules reference).
- Total card count (1064 seen across all variants at last check) — confirms
  `/cards` needs full pagination, not a single call.

## Next steps

- [x] Rewrite `packages/shared/src/types/card.ts` to match the Riftcodex shape.
- [x] Add `CardsTable` to `serverless.yml`.
- [x] Implement `syncCards.ts` and `getCards.ts`.
- [x] Confirmed EventBridge/Lambda scheduling doesn't work (Cloudflare 403s
      AWS egress) — sync is manual-only for now.
- [ ] Extend deck create/update handlers with Legend-domain legality checks
      (blocked on those handlers not existing yet — only `getDecks` is
      implemented).
- [ ] Optional: follow up with `support@riftcodex.com` about allowlisting, to
      revisit automatic scheduled sync.
</content>

# PROOF_RUN_v0 — Operator Demo Script (5 minutes)

Goal: show that the operator console runs gateway-only invoice actions, returns
deterministic output, and stores auditable episodes in Memory v0.

## Steps

1) Open `/operator`
2) Set "Gateway Base URL" and paste the DEV token.
3) Click "Load example" with action `create_send` (dry_run = true).
4) Click "Run action" and capture the `x-gw-request-id`.
5) Click "Store" in Episodes and capture the returned `episode_id`.
6) Click "Refresh" in Recent Episodes → find the episode → click "View".
7) Point to the request/response JSON and metadata.

## What this proves

- Gateway-only: UI calls only the Gateway API (`/api/invoice/*` and `/episode/*`).
- Deterministic outputs: dry_run responses are consistent and reproducible.
- Auditable memory: episodes store request/response evidence + IDs.

## LocalStorage keys

- `mova_gateway_base_url`
- `mova_gateway_token`
- `mova_memory_base_url`
- `mova_memory_token`

## Notes

- No banking required.
- Tokens are stored locally in this browser only.

## Troubleshooting

- 401/403: missing or invalid token; re-check the token fields and re-save.
- Missing token error: click "Save settings" after pasting tokens.
- Search returns empty: store an episode first or verify Memory token/URL.

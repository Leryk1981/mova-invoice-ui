# MOVA Invoice Operator Console

Minimal operator UI for triggering invoice actions through the gateway and
capturing deterministic outputs plus request metadata. This is an internal
tool, not an end-user product.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/operator`.

## Configure the gateway

- Gateway Base URL defaults to the dev gateway; edit it in the UI as needed.
- Gateway Token is stored locally in this browser only.
- Save uses localStorage key `mova_gateway_token`.

## Episodes

The operator console can store and search episodes through the gateway memory
endpoints:

- POST `/episode/store` to persist the last run request/response + metadata.
- POST `/episode/search` to list recent invoice episodes.

Tokens and base URLs are stored in localStorage only:

- `mova_gateway_base_url`
- `mova_gateway_token`
- `mova_memory_base_url`
- `mova_memory_token`

Use "Clear tokens" in the UI to remove stored tokens from localStorage.

## Security note

The gateway token is stored in your local browser storage. Do not use this
console on shared machines.

# Load tests — Brief Sharpener

k6 scripts. Do not run against production without the user's explicit nod.

## Install

```bash
brew install k6
```

## Run

The endpoint is auth-gated by a Gateway JWT cookie. Grab yours from a logged-in browser session (DevTools → Application → Cookies → `aiden-gw`) then:

```bash
AUTH_COOKIE="<jwt-value>" \
BASE_URL="https://briefsharpener.aiden.services" \
k6 run load-tests/analyze-brief.k6.js
```

Against local dev:

```bash
AUTH_COOKIE="<jwt-value>" \
BASE_URL="http://localhost:3000" \
k6 run load-tests/analyze-brief.k6.js
```

## Scenario

Ramping VUs: 0 → 5 → 20 → 20 → 0 over ~4 minutes. P95 threshold 15s (the endpoint calls Claude + Supabase, so latency budget is generous).

## What this will cost

Each iteration triggers a real Claude analyze call + token debit (20 tokens/call per TOKEN_COSTS). 20 VUs for 3+ minutes = hundreds of iterations. Budget before running.

## What this will NOT catch

- Gateway cookie expiry mid-run. Get a fresh cookie right before running.
- Supabase connection-pool saturation against other services sharing the same project (AIDEN-Platform multi-tenant DB).
- Any cold-start penalty on Railway — warm up with a single manual call first.

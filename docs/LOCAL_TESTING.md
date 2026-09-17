# Testing Vitality 9 on this computer

Open **Start Vitality 9 Testing.cmd** in the repository folder, or run `npm run start:testing`. Then open <http://127.0.0.1:5175/testing/index.html>. The launcher reuses an existing healthy testing server.

This is a local synthetic testing app. It uses a fixed synthetic account with test Pro access and the real anonymous local Convex backend. Progress and profile edits survive page reloads. No real sign-in credentials are needed, and the normal production authentication checks are unchanged. It is accessible on this computer only.

## What to try

1. Complete activities on Home. Completing nine advances to the next pillar.
2. Open Progress to inspect completed days and the nine-day journey.
3. Edit the synthetic name on Profile, then reload to verify it was saved.
4. Open the wellness coach. Without a configured Gemini key, ordinary prompts receive a clearly labelled **offline practice response**, not a generated AI answer. The existing deterministic emergency, self-harm and medication safeguards are still exercised through the local backend.
5. Use **Restart testing journey** at the top to clear this synthetic account's activity completion.

Use invented details only. Payments stay disabled. This mode does not verify genuine OIDC login, Gemini response quality, clinical safety or deployment readiness. A fresh browser chat has no earlier conversation history.

## Implementation boundaries

The testing entry point, Vite configuration and adapters live under `testing/` and are not built by the production `npm run build` command. A loopback-only server invokes whitelisted local Convex functions using a fixed CLI-admin synthetic identity. Browsers cannot supply identities, run internal functions, access local runtime configuration or select a remote deployment. POST requests require the exact local origin. Only initial server setup assigns the synthetic Pro entitlement; no Stripe service is called.

The coach first calls the existing local backend action, including authorization and rate limits. Only the explicit NOT_CONFIGURED result enables the server-side offline practice fallback. The fallback uses the same policy router and output checks. It is a small scripted wellness reply set and does not provide general AI reasoning.

Local runtime files and logs remain under ignored `.convex/`. The launcher does not read `.env` files or print credentials. It does not install a Windows service, modify system security settings, enable payments or publish the application.

## Verification

Run `npm run test:testing` with the testing server running. On this Windows machine set `PLAYWRIGHT_CHANNEL=msedge` in the command environment. This browser suite covers persistence, day advancement, profile editing, offline/safety replies, accessibility and local API restrictions. The original automated and smoke suites remain separate.

Verified on 2026-09-12: both local-testing browser checks passed (2.4 minutes), including day advancement and reload persistence against the real local backend, saved profile edits, offline coaching and emergency handling. Axe found no violations in the tested state. The journey was reset to Day 1 afterward for manual testing.

The launcher no longer sets `BETA_MODE=local`. During initialization it sets `BETA_ALLOWED_SUBJECTS` to `founder-testing,synthetic-local-check` on the anonymous local deployment only. These exact synthetic subjects are allowed while invitation enforcement remains active when mode is restricted or absent. It leaves any existing mode unchanged. Production must keep restricted beta access. Start the testing launcher before running `npm run test:local`; that script verifies both invited non-Pro denial (`FORBIDDEN`) and uninvited denial (`BETA_RESTRICTED`).

On this Windows machine, the browser tests use the installed Edge browser: set the process variable `PLAYWRIGHT_CHANNEL=msedge` before running `npm run test:testing` or `npm run test:smoke`.

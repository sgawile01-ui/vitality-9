# Vitality 9

A nine-day wellness journey with nine pillars, 81 gentle activities, per-user progress and a Pro-gated AI wellness coach. General education only; not diagnosis, emergency care or a replacement for professional medical care. Founder: Dr. Steven Gawile.

This branch is for controlled synthetic-data testing. Payments are disabled. The Founder authorized committing and pushing this readiness branch. Merging, production deployment, infrastructure changes and live-payment activation require separate approval.

## Install and run

Use Node 22.12+ (tested with 22.23.2) or Node 24 and npm. Dependencies are pinned by package-lock.json.

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Without public backend/OIDC configuration, a readable setup screen appears. This is expected and is not a working login session.

On a managed Windows network, certificate validation may require the OS trust store. Keep TLS verification enabled; in PowerShell run `$env:NODE_USE_SYSTEM_CA='1'` before npm commands if necessary.

## Backend and authentication

```sh
npm run convex:dev
```

The wrapper selects an anonymous local Convex backend explicitly and cannot select a cloud deployment through an existing environment file. It creates a public local selector under ignored .convex/. The CLI may download a local backend and write local URLs/configuration. The local backend uses loopback ports 3210 and 3211. An internet connection is required for the first binary download.

Use a dedicated synthetic-testing Hercules/OIDC client. Configure these public frontend variables using .env.example as the template:

- VITE_CONVEX_URL: the local backend URL reported by the CLI.
- VITE_HERCULES_OIDC_AUTHORITY and VITE_HERCULES_OIDC_CLIENT_ID.
- Register http://127.0.0.1:5173/auth/callback as the test client's redirect URI; use that same origin consistently.

Set HERCULES_OIDC_AUTHORITY and HERCULES_OIDC_CLIENT_ID on the local/test Convex backend with matching issuer and audience. Convex requires both backend variables before function synchronization. For local backend-only tests, the verified placeholders were https://synthetic.invalid and vitality9-synthetic; these cannot provide a genuine login. Restart Vite after frontend configuration changes. Sign-in callback synchronizes the user after Convex validates the identity. Pro access is server-owned; no URL or UI flag grants it.

No environment-file contents should be printed or shared. Never put private credentials in VITE_ variables or commit them.

## Gemini configuration and optional live check

Use your secret manager or the selected development Convex dashboard's environment-variable settings to configure GOOGLE_API_KEY securely on the development backend. Set GEMINI_MODEL to an available stable text model (default gemini-3.8-flash). Do not use a production deployment or paste credentials into chat.

The optional direct-provider test reads GOOGLE_API_KEY from the test process environment only; it does not read .env files. Inject the key into that process using your secret manager, then run:

```sh
npm run test:live
```

Without a key this test is explicitly skipped. It uses a synthetic sleep prompt; it does not verify OIDC or clinical safety. Never run the dialogue suite with real patient information.

## Verification commands

```sh
npm run typecheck
npm run lint
npm test
npm run test:ai
npm run build
npm run scan:secrets
npm run test:local
npm run test:smoke
```

Install a Playwright browser with `npx playwright install chromium`, or use an installed browser; the verified Windows run used `$env:PLAYWRIGHT_CHANNEL='msedge'` before `npm run test:smoke`.

The browser smoke suite starts Vite on ports 5173 and 5174. Port 5173 tests the unconfigured production entry point; port 5174 tests real pages through an explicitly labelled synthetic fixture with mocked services. The fixture is not included in the production build. `npm run test:local` exercises the real anonymous local backend using administrative CLI-supplied synthetic identities and leaves a labelled synthetic test account. It tests authorization, deterministic safety responses and persisted task/profile operations, not OIDC cryptography or live Gemini. Stripe is bundled into Node functions to avoid Windows external-dependency symlink permissions; payment operations remain disabled.

Stop running Vite/Playwright processes before `npm ci` on Windows to avoid locked native modules.

`npm run convex:codegen` is the normal deployment-aware codegen command. `npm run convex:codegen:offline` uses the locked Convex CLI's advanced offline generation path for schema-derived generated files, without contacting a deployment. Generated files are included for fresh-install builds. Re-run normal codegen after local setup; offline codegen does not establish deployment compatibility. `npm run format` applies Prettier.

## Evidence and boundaries

- [Initial findings](docs/INITIAL_FINDINGS.md)
- [MVP readiness and verification record](docs/MVP_READINESS.md)
- [AI dialogue scorecard](docs/AI_DIALOGUE_TEST_REPORT.md)
- [AI safety policy and residual risks](docs/AI_COACH_SAFETY.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Known limitations](docs/KNOWN_LIMITATIONS.md)

Mocked tests validate deterministic behavior and application wiring. They do not demonstrate live-provider reliability, clinical safety or readiness for real users. Founder approval is required before pushing, merging, deploying, changing production infrastructure or enabling payments.

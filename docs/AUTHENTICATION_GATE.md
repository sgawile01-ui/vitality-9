# Authentication gate — 2026-09-17

Base: `b96b2a1`, `fix/vitality9-mvp-readiness`. Initial local verification was
recorded on September 17. See the September 18 checkpoint below for current status.

## Architecture and boundaries

The existing provider is Hercules OIDC (`@usehercules/auth` 1.2.0), using
`react-oidc-context` and `oidc-client-ts`. No provider was replaced. The browser
uses authorization-code flow with PKCE and the exact current-origin
`/auth/callback`. The registered post-logout redirect must be the same origin.
Legacy response-type and redirect-URI overrides are no longer accepted.

The Hercules SDK persists its OIDC user in browser local storage, handles
renewal/recovery, and passes the ID token to `ConvexProviderWithAuth`. Convex's
OIDC configuration specifies both the issuer and application/client ID; Convex
performs token verification. Decoding a token or using `convex-test.withIdentity`
is not evidence of cryptographic verification. The callback waits for Convex
authentication, then synchronizes the user. Null/failed synchronization cannot
report success, and errors forwarded to the SDK are sanitized.

Profile and task ownership derive from the verified identity's `tokenIdentifier`,
not a user ID supplied by the browser. This identifier remains stable for the
same issuer/subject across token renewal. All environments require explicit
`BETA_ALLOWED_SUBJECTS`. `BETA_MODE=local`, test flags, local deployment names and
loopback URLs cannot bypass invitations anymore. The authenticated UI also waits
for the backend invitation check. Public unauthenticated reads return null/empty
data; protected mutations/actions reject anonymous callers.

Provider logout remains the normal path. If provider discovery or logout fails,
the app removes the local OIDC user and displays a safe failure message. Local
removal does not prove that the provider's SSO session ended.

## Test isolation

Vitest supplies an explicit list of synthetic invited subjects only inside the
test process. It does not introduce an authentication bypass into backend code.
The separate local administrative adapter requires development/test mode, rejects
known hosting environments and remote deployment selectors, validates its exact
anonymous selector before each CLI call, and accepts only direct loopback HTTP
requests without forwarding headers. Testing and smoke configurations reject
builds, production mode and non-loopback binds. Only the normal Vite entry point
may produce the beta bundle. Synthetic adapters are not genuine OIDC sessions.

## Genuine-login prerequisites — currently blocked

Inspection found no Hercules issuer or client ID in process configuration or
the existing local environment file. The only configured backend URL was local.
No approved real test identity or configured beta backend was identified.
No private values were printed. No account, provider or deployment was fabricated.

The founder must identify the existing Hercules app and two approved, separate
test identities, and provide access to an already configured test backend.
Do not send passwords, tokens, client secrets or deployment keys in chat.

1. In the existing Hercules app, confirm the public issuer/client ID and register
   `http://127.0.0.1:5173/auth/callback` plus
   `http://127.0.0.1:5173` for post-logout when testing locally. Confirm the provider
   supports these exact loopback redirects and browser token requests; use no
   wildcard redirects. A hosted origin would need its own exact registrations.
2. On the intended existing test Convex backend, configure matching
   `HERCULES_OIDC_AUTHORITY` and `HERCULES_OIDC_CLIENT_ID` and exact approved
   subjects in `BETA_ALLOWED_SUBJECTS`. An empty list denies all users. This task
   does not deploy backend changes; if deployment is needed, stop for the later
   deployment phase.
3. Inject `VITE_CONVEX_URL`, `VITE_HERCULES_OIDC_AUTHORITY` and
   `VITE_HERCULES_OIDC_CLIENT_ID` into the local Vite process securely. Vite does
   not load `.env` files automatically. Run the normal `npm run dev` entry point,
   never `start:testing`, for genuine login. These three values are public client
   configuration; no secret belongs in a `VITE_` variable.
4. Have the founder complete password/OTP/MFA entry directly. Do not capture
   screenshots, traces, HARs, saved browser storage or raw token traffic during
   real login. Record only boolean outcomes and sanitized failure categories.

## Required real-session verification

These checks remain pending and must not be inferred from mocked tests:

- Anonymous browser and direct backend calls cannot read private data or mutate it.
- Identity A signs in through Hercules and reaches the app only after Convex accepts
  the session and the invitation. Complete one synthetic task and update a test name.
- Reload and navigate directly to profile/progress; the same data and valid session
  remain. Exercise actual renewal without recording token values.
- Identity B in a separate browser session sees only B's own profile/tasks.
- A genuine uninvited account is denied. Revoking an invitation blocks subsequent
  requests by an existing session.
- Sign out through the provider, reload, use browser back, and revisit protected
  routes. No account data remains visible and anonymous writes are denied. Confirm
  the provider logout completed, not merely local credential removal.

Gemini, billing, payment settings and deployment are outside this authentication
change. Existing payment code remains unchanged and live payments remain disabled.

## Verification recorded in this change

| Check | Result |
| --- | --- |
| `npm test` | 131 passed, 1 live Gemini test skipped; original 103 tests retained, 28 added |
| `npm run typecheck` | Passed |
| `npm run lint` | Passed |
| `npm run build` | Passed |
| `npm run scan:secrets` | 122 files, zero findings |
| `git diff --check` | Passed |
| `npm run test:smoke` using Edge | 2 passed; synthetic/UI tests only |
| Build with testing configuration, development mode | Rejected with `LOCAL_TESTING_ONLY` |
| Build with smoke configuration, development mode | Rejected with `LOCAL_TESTING_ONLY` |
| Separate build with dummy public OIDC identifiers | Passed; authentication code included, synthetic adapter markers absent |
| Genuine Hercules login, renewal, two real accounts and provider logout | Blocked: configuration and approved identities unavailable |

The extra configured build uses only labelled synthetic public identifiers, not
credentials, and is stored under ignored `test-results/auth-build`. It was never
used to log in or contact a provider. The normal build has missing-config behavior;
the separate build ensures the configured authentication branch also compiles.
The administrative local backend/browser suites were not rerun because their
setup changes synthetic entitlements and/or requires backend synchronization;
neither billing changes nor deployment is part of this task.

### Files changed

- Authentication: `convex/beta.ts`, `convex/lib/betaAccess.ts`,
  `src/components/BetaGate.tsx`, `src/components/providers/auth.tsx`,
  `src/hooks/use-auth.ts`, `src/pages/auth/Callback.tsx`, `src/pages/profile/page.tsx`.
- Test isolation: `testing/backend.ts`, `testing/vite.config.ts`,
  new `testing/isolation.ts`, `tests/smoke/vite.config.ts`, `vitest.config.ts`.
- Tests: updated `tests/beta.test.ts`; new `tests/auth-boundaries.test.ts`,
  `tests/auth-config.test.ts`, `tests/auth-isolation.test.ts`, `tests/auth-ui.test.tsx`.
- Documentation: `.env.example` (comment only), `README.md`,
  `docs/CONTROLLED_BETA.md`, `docs/LOCAL_TESTING.md`, this new report.

At the initial September 17 checkpoint, HEAD remained `b96b2a1` and nothing had
been staged, committed, pushed or deployed. Automated boundary checks alone are
insufficient to approve this as genuinely verified authentication.

## September 18 deployment-preparation checkpoint

The founder subsequently authorized committing/pushing the reviewed authentication
changes and deploying an invitation-only beta, using the existing Hercules OIDC
provider and Convex project. This supersedes the earlier no-deployment instruction;
it does not authorize production promotion, Gemini, billing or enabled payments.

Public OIDC discovery verified:

- Issuer: `https://01kyfd41dyt5tff30gd9qvcm0s.hercules-auth.com`
- Authorization path: `/api/auth/oauth2/authorize`
- Token path: `/api/auth/oauth2/token`
- Provider logout path: `/api/auth/oauth2/end-session`
- JWKS path: `/api/auth/jwks`
- PKCE: `S256`

The public client ID was verified using only the specific managed
`HERCULES_OIDC_CLIENT_ID` entry in the existing Hercules dashboard. No private
credential was revealed. Authentication settings are under Users & Access →
Auth Portal, not Branding & SEO. There are eight auto-generated redirect URIs
and no custom entries; the displayed development domains include roots and
`/auth/callback`. Exact beta frontend callbacks still need registration after
the preview origin is known.

The existing Convex project `vitality-9`, team `dr-steven-gawile`, has an unused
cloud development deployment `robust-newt-445` in Europe (Ireland), with URL
`https://robust-newt-445.eu-west-1.convex.cloud`. Its refreshed dashboard reports
"Never deployed", no function traffic, and "All clear". An earlier transient
reconnect warning cleared after reload. This is separate from the Hercules
managed production backend, which must not be overwritten for the beta.

The local Convex CLI reports not logged in. The founder must complete its normal
browser login before code can be synchronized to the existing development target.
The Vercel `vitality-9` team is accessible, but has no frontend project yet; the
deployment must use a preview, without production promotion.

Hosted authentication checks remain pending. The existing Hercules app's
successful SSO navigation is not validation of the changed repository or a
synthetic two-user isolation test. No authentication-gate pass is claimed.

### Development backend synchronized

After the founder completed CLI authorization, the required authority and client
ID were applied to the existing development deployment using captured session
configuration. Values were not printed by the configuration commands or added
to Git. `convex dev --once` synchronized the functions and seven indexes
successfully with no authentication-configuration error.

The admin-only readiness check confirmed authentication configured, restricted
beta enabled, no invited testers yet, Gemini disabled, sandbox and live payments
disabled, and no billing webhook or price configured. Direct anonymous cloud
checks returned denied beta access, null profile and empty task data; an attempted
profile update was rejected as unauthenticated.

The frontend also built successfully using the actual configuration injected
privately into the build process. A `.vercelignore` explicitly excludes local
environment files, the local Convex directory and test artifacts from uploads.
The Vercel CLI requires its own login despite the dashboard session being signed
in. No frontend preview has been deployed yet, so every genuine hosted session
check remains pending. Gemini and all payment functions remain disabled.

References: [Convex custom OIDC](https://docs.convex.dev/auth/advanced/custom-auth),
[Hercules authentication troubleshooting](https://hercules.app/docs/apps/users-auth/debug-auth).

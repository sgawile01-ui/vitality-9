# Controlled beta deployment

Status: prepared locally; NOT deployed or launched. Production account access and real-provider verification remain required. Use synthetic accounts and scenarios only. Live payments are rejected by code, even if a live key is accidentally configured.

## Hosting and authentication

1. Sign in to the existing Convex, Hercules and Vercel accounts. Select the intended project and team; do not create a duplicate app or change an unrelated deployment.
2. Create or select the Convex production deployment. Keep it separate from the anonymous local backend.
3. In Hercules, obtain the existing app's production OIDC issuer and public client ID. Confirm that externally hosted Vercel origins are supported for this app. Register the exact production `/auth/callback` redirect and the production origin for post-logout redirects. Do not guess issuer/client values or add wildcard redirects.
4. Configure `HERCULES_OIDC_AUTHORITY` and `HERCULES_OIDC_CLIENT_ID` privately in the production Convex dashboard. They must match the frontend issuer/client ID.
5. Add `VITE_CONVEX_URL`, `VITE_HERCULES_OIDC_AUTHORITY`, and `VITE_HERCULES_OIDC_CLIENT_ID` to Vercel's Production environment. These are public identifiers compiled into browser JavaScript, even when entered privately. Never place an API key in a `VITE_` variable.
6. Set the Vercel project root to this repository root, build to `npm run build:vercel`, and output to `dist`. The committed Vercel configuration provides SPA routing for callback/profile/progress links and security headers. Narrow the CSP HTTPS/WSS connection and frame sources to the actual OIDC/Convex domains after those are known and verified.
7. Deploy backend functions before publishing the frontend. For automatic combined deployment, securely add `CONVEX_DEPLOY_KEY` with production deploy permission to Vercel Production only and override the build command to `npx convex deploy --cmd-url-env-var-name VITE_CONVEX_URL --cmd "npm run build:vercel"`. Do not reuse a local or preview key. The fourth variable is only needed for automated backend deployment from Vercel.

The build preflight reads process configuration only and rejects missing/placeholder/local frontend URLs. Vite does not auto-load `.env` files. It cannot prove that an HTTPS endpoint is production or that OIDC credentials match: verify those in the dashboards and browser before release.

## Invitation-only access

Put only approved test accounts' exact OIDC subject identifiers in the private, comma-separated `BETA_ALLOWED_SUBJECTS` setting. An empty or absent list denies everyone. All runtimes require invitations; the legacy `BETA_MODE` setting, including `local`, cannot bypass access checks. The gate applies on the server to profiles, tasks, AI and checkout, including existing sessions. Removing a subject revokes access on subsequent requests. See [authentication gate](AUTHENTICATION_GATE.md) for current verification requirements.

Invitees can authenticate, but app data and functions stay unavailable until their subject is allowed. Do not use email text, a URL flag, or frontend state as authorization. The organizer must identify approved subjects using Hercules administration. No participant invitations have been sent.

## Real AI coach

Store `GOOGLE_API_KEY` only in Convex's backend environment. Optionally set `GEMINI_MODEL` after checking model access. The default model is Gemini 3.8 Flash. The API request uses a separate structured system instruction, limited conversation context, low thinking, a timeout, provider safety settings and output screening. General wellness responses require Pro access; server-side sandbox checkout can grant it after signed event verification. Admin grants are available for synthetic local tests only through administrative tooling.

Deterministic safety routes cover emergency symptoms, self-harm, medication changes, higher-risk circumstances and instruction injection. These controls are not a guarantee of clinical safety or exhaustive language coverage. Production has no offline practice fallback. Avoid patient data. The UI explains that messages may be sent to Google Gemini.

Run `npm run test:live` with the key injected securely into the test process to check a synthetic sleep conversation, then test the same flow through the deployed app. A skipped test is not evidence of provider connectivity. Broader clinical/medical review remains a launch gate for any use beyond the synthetic beta.

## Stripe sandbox

Use the approved Stripe test account, not live mode. Create or select a test recurring Pro price. Store these privately in Convex:

- `PAYMENTS_MODE`: test-only setting; other modes disable checkout.
- `STRIPE_SECRET_KEY`: prefer a restricted test key with only necessary customer, Checkout, portal and subscription permissions.
- `STRIPE_PRO_PRICE_ID`: the approved test recurring price.
- `STRIPE_WEBHOOK_SECRET`: the signing secret for this exact test webhook endpoint.
- `APP_ORIGIN`: the exact HTTPS frontend origin, without a trailing slash.

Register the Convex production HTTP endpoint `/stripe-webhook` in the Stripe test account for `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.paid`, and `invoice.payment_failed`. The HTTP action host differs from the Convex client URL; obtain it from the deployment dashboard. Configure the sandbox billing portal.

The server validates signatures on the raw request body and rejects live events. It retrieves the current subscription, checks the application metadata and price, and applies deduplicated updates. Failed processing returns non-2xx for retry. Checkout redirects never grant Pro. Return addresses must match `APP_ORIGIN`. No live-payment path exists in this change.

Test success, cancellation, decline, authentication challenge, renewal failure, cancellation/revocation, duplicate delivery, invalid signature and replay through the actual endpoint. Local tests use real Stripe HMAC verification with invented signing material and mocked Stripe API responses; they do not prove Stripe delivered to the hosted endpoint.

Before any future paid launch, assess tax registrations and collection requirements. Automatic tax is not enabled here, and sandbox success does not authorize live payments.

## Release evidence required

- Fresh synthetic sign-up, successful login, exact callback handling and rejected unauthenticated access.
- An uninvited authenticated account cannot read or modify app data; removing an invitation revokes access.
- Task completion survives reload and logout/login; a second account cannot see it.
- Logout clears app access and the intended OIDC session; browser back does not expose account data.
- Real Gemini wellness dialogue and critical safety cases through the deployed UI.
- Stripe sandbox scenarios above, plus signed delivery visible at the real Convex endpoint.
- Desktop and mobile browsers, keyboard navigation, small-screen overflow, accessibility, deep links and failed-network recovery.
- Founder has a tested rollback route (previous frontend deployment, compatible backend version, remove beta subjects to close access, disable sandbox payments).

Only publish the beta to approved testers once the above live checks pass. Do not enable live payments. Repository unit tests, the local adapter's simulated login/logout, and browser viewport tests cannot satisfy the real-provider release gates.

References: [Convex + Vercel](https://docs.convex.dev/production/hosting/vercel), [Hercules authentication](https://hercules.app/docs/apps/users-auth/customize-auth-portal), [Gemini model](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash), [Stripe webhooks](https://docs.stripe.com/webhooks).

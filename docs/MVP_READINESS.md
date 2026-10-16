# MVP readiness — controlled synthetic testing

Updated 2026-09-11. Branch: fix/vitality9-mvp-readiness. Base: a8b65c2 (origin/main at clone time). At the verification checkpoint, work was local and uncommitted. The Founder subsequently authorized committing and pushing this branch. No merge, remote deployment, production infrastructure change, real patient data or live payment activation occurred. A dedicated anonymous **local** Convex backend was initialized and synchronized.

## Decision

Ready for developer-led, synthetic-data testing of the restored application and deterministic controls. **Not ready for real users, clinical use or production release.** Genuine OIDC authentication and live Gemini dialogue evaluation still require secure configuration. Mocked dialogue assertions cannot certify a live model's safety.

## Area classification

| Area                                                        | Status             | Evidence / practical limit                                                                                                                                  |
| ----------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency installation                                     | Verified           | npm ci installed 264 packages; audited 265; zero reported vulnerabilities.                                                                                  |
| Frontend compilation                                        | Verified           | Typecheck and Vite production build exit 0.                                                                                                                 |
| Code quality                                                | Verified           | ESLint exits 0; formatting and diff whitespace reviewed.                                                                                                    |
| Convex code generation                                      | Verified           | Offline generation plus normal deployment-aware codegen completed; generated files retained.                                                                |
| Local backend                                               | Verified           | Anonymous Windows backend initialized on loopback; functions and six indexes synchronized.                                                                  |
| Task loading/completion/reset                               | Verified           | 18 real-local checks also cover persistence; all 81 activities exercised in convex-test, including final day, undo, idempotence, reset and invalid indices. |
| Home/progress/profile                                       | Verified           | UI tests and browser fixture exercise real pages with synthetic services; keyboard navigation, completion, profile edit and chat submission pass.           |
| Loading/error/empty states                                  | Verified           | UI tests cover loading/empty tasks, safe callback/chat errors; generic error boundary and missing-config screen implemented.                                |
| Authentication                                              | Partially verified | Route gates and Convex identity checks tested; genuine OIDC redirect, token verification, refresh and logout remain pending.                                |
| AI Pro authorization                                        | Verified           | Actual action rejects unauthenticated/non-Pro calls before provider access in convex-test.                                                                  |
| Critical deterministic safety routes                        | Verified           | Emergency, self-harm, medication and injection fixtures pass; language coverage remains limited.                                                            |
| Live AI behavior / clinical appropriateness                 | Blocked            | No GOOGLE_API_KEY in test process; real model dialogue and clinician evaluation pending.                                                                    |
| History and provider safeguards                             | Verified           | Role/size checks, untrusted history serialization, timeout, blocked/empty/malformed responses and sanitized errors tested.                                  |
| Abuse protection                                            | Partially verified | Atomic six/minute per-user limiter tested; global budgets/bot controls absent.                                                                              |
| Accessibility                                               | Partially verified | Two browser tests pass; axe reports no violations on tested setup, progress, profile and home/chat states. Not full WCAG or screen-reader certification.    |
| Payments                                                    | Partially verified | Disabled in UI, server actions and webhook; tests confirm no provider calls. Existing billing lifecycle is not validated for activation.                    |
| Secret hygiene                                              | Verified           | Heuristic source scan has zero findings; .env files are not read by scan or displayed; local runtime files ignored.                                         |
| Persistent server-owned chat / semantic multilingual triage | Not implemented    | Documented residual risk; outside the minimal restoration.                                                                                                  |

## Executed commands and results

Commands ran in the vitality-9 checkout. No secret-valued command was printed.

| Command                                                                                     | Result                                                                                                    |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| git clone; git status --short; git branch -a; git log -5 --oneline; rg --files              | Inspected clean a8b65c2 checkout before editing.                                                          |
| git switch -c fix/vitality9-mvp-readiness                                                   | Local branch created.                                                                                     |
| node --version; npm --version; npm view package metadata                                    | Node 22.23.2, npm 10.9.8; published dependency metadata checked.                                          |
| npm install dependencies; npm install -D development dependencies; npm install use-debounce | Succeeded after using the OS trust store; no TLS verification bypass.                                     |
| npm ci --fetch-retries=0 --fetch-timeout=30000                                              | Final fresh install succeeded: 264 packages added; 265 audited; 0 vulnerabilities.                        |
| npm run convex:codegen:offline                                                              | Exit 0; schema-derived generated bindings.                                                                |
| npm run convex:dev -- --once --tail-logs disable                                            | Final exit 0; local functions ready and six indexes added.                                                |
| Local convex env set for HERCULES_OIDC_AUTHORITY / CLIENT_ID                                | Set public synthetic placeholders on anonymous local deployment only; no genuine login enabled.           |
| npm run convex:codegen                                                                      | Exit 0; normal generation against local backend completed.                                                |
| npm run typecheck                                                                           | Exit 0, frontend/backend/tests/configuration.                                                             |
| npm run lint                                                                                | Exit 0, zero lint errors/warnings.                                                                        |
| npm test                                                                                    | 72 passed, 1 skipped live test, 4 passing files / 1 skipped file.                                         |
| npm run test:ai                                                                             | 53 passed, 2 passing files. Included in the 72 above; do not add these counts.                            |
| npm run build                                                                               | Exit 0; Vite 8.3.0, 2,535 modules transformed; JS about 270.5 kB / 82.8 kB gzip.                          |
| PLAYWRIGHT_CHANNEL=msedge; npm run test:smoke                                               | 2 passed in 33.1s; production setup and synthetic browser journey.                                        |
| npm run test:local                                                                          | 18 checks passed on the real local backend with CLI-admin synthetic identities; no OIDC/Gemini live call. |
| npm run scan:secrets                                                                        | 92 files scanned; zero heuristic secret findings.                                                         |
| git diff --check; git diff review; git status                                               | No whitespace errors in final check; verification completed before the authorized commit and push.                                            |

The direct live test is skipped automatically when no process key exists; environment files were not searched for keys. No claim is made about credentials configured elsewhere.

## Failures found and resolved

- npm initially could not verify the network certificate; NODE_USE_SYSTEM_CA=1 resolved installation without weakening TLS.
- Initial typecheck/lint found missing generated modules, use-debounce, a Stripe optional field and an unused import. Fixed and rerun.
- Normal codegen initially lacked a configured deployment. Offline generation restored types; later local synchronization enabled normal generation.
- Local deployment initially returned HTTP 500. Redacted diagnostics identified Windows EPERM while symlinking externally packaged Stripe. Bundling Stripe via an empty externalPackages list fixed it without changing OS permissions.
- Convex required OIDC environment-variable values before accepting the auth config. Public synthetic placeholders let the local backend initialize; real authentication remains pending.
- A fresh-install attempt overlapped a Vite process and hit a Windows native-module lock. Stopped test processes and reran npm ci successfully.
- Browser checks found heading order, keyboard-inaccessible scrolling, contrast on faded future days and toasts covering mobile navigation. Fixed; the complete browser suite passed.
- The initial real-local test harness assumed void mutations printed JSON; the runner now handles empty successful output.
- Temporary diagnostic code was removed after identifying the local backend issue. .convex is excluded from lint and source control.

## AI scorecard

25 of 25 requested scenario groups passed their deterministic/mocked assertions. This includes all supplied critical emergency/self-harm, medication-changing and prompt-injection fixtures. The six ordinary dialogue cases use scripted provider replies; they establish wiring/context preservation, not real-model performance. See [full scorecard](AI_DIALOGUE_TEST_REPORT.md) for required/prohibited behaviors and test scope.

## Required external configuration and next action

Configure a dedicated synthetic-testing Hercules OIDC client with the exact local callback origin and matching backend issuer/audience. Configure GOOGLE_API_KEY securely on the development backend and in the optional live test process through a secret manager; do not paste it into chat or expose it to VITE_. Confirm GEMINI_MODEL access. No Stripe credentials are needed for current testing.

**Recommended next action:** configure the isolated OIDC/Gemini test environment, then perform and clinically review a small live synthetic end-to-end dialogue run before considering broader access.

Review [known limitations](KNOWN_LIMITATIONS.md), [safety policy](AI_COACH_SAFETY.md), [architecture](ARCHITECTURE.md), and [file manifest](CHANGE_MANIFEST.md).

## Final Git scope

22 existing files have content changes and 57 files are new, including generated bindings, infrastructure, tests and documentation. The Founder authorized committing and pushing these changes on fix/vitality9-mvp-readiness. Formatting-only changes to unrelated existing files were reverted. The full file inventory is in CHANGE_MANIFEST.md.

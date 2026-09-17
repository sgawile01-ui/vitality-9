# Local identity investigation — 2026-09-15

No production authorization defect was confirmed. No commit, push, merge, hosting connection or deployment was performed. Private environment files were not inspected.

## Expected and actual behavior

The original `npm run test:local` script was rerun unchanged against the anonymous local backend: **18 checks passed**. Its earlier failure at the expected `FORBIDDEN` assertion was not reproduced, so the historical root cause remains unknown.

A separate fresh identity using the original subject (`synthetic-local-check`), issuer and a new token identifier created a user successfully. Reading that user confirmed the token identifier matched and `isPro=false`. Calling the coach returned `FORBIDDEN`, exactly as expected: this is Pro-entitlement denial, not invitation denial. Uninvited subjects should receive `BETA_RESTRICTED` before reaching the Pro check.

The new regression test uses restricted mode and explicit synthetic invitations. It grants an older synthetic identity Pro and task progress, then creates a fresh token identity with the same allowed subject. The fresh identity remains non-Pro, has no inherited tasks, and receives `FORBIDDEN`. An outsider receives `BETA_RESTRICTED`; revoking the invitation also blocks the older Pro identity. This models CLI-admin synthetic identities, not real OIDC token validation.

## Changes

- Added the regression test in `tests/beta.test.ts`.
- Added fresh token/non-Pro assertions and uninvited-user checks to `scripts/test-local.mjs`, plus sanitized expected-error diagnostics.
- Corrected README and local launcher instructions: initialization sets `BETA_ALLOWED_SUBJECTS` to `founder-testing,synthetic-local-check` on the anonymous deployment. It does not set `BETA_MODE=local`, and leaves an existing mode unchanged.
- Production invitation and bypass logic were not changed.

## Final local gate failure

The enhanced local gate passed fresh identity matching, non-Pro state, expected `FORBIDDEN`, both outsider `BETA_RESTRICTED` checks, and synthetic Pro activation. It then failed in the four-case Pro safety-response loop (`scripts/test-local.mjs`, `aiCoach:chat`), with CLI exit 1 where exit 0 was expected. The runner withholds raw output and does not identify which loop case failed, so the underlying code and exact case are unresolved. No automatic retry or production fix was applied after this gate failure. Later task/profile/reset checks were not reached.

The earlier successful 18-check report is historical evidence, not evidence that the final enhanced gate passed. Further work must identify the failing safety case using sanitized diagnostics and obtain a clean full gate.

## Follow-up diagnostic run

The existing 21-check local script subsequently passed, including all four safety cases and the task/profile/reset checks. Added per-case progress labels and sanitized exit/application-code/transport diagnostics to unexpected failures as well as expected denials. No safety or authorization behavior was changed.

The instrumented run failed at the initial unauthenticated call, before the Pro safety loop: expected `UNAUTHENTICATED`, CLI exit 1, recognized application codes `none`, subprocess transport error `none`. This run overlapped the tail of the preceding run; whether overlap contributed is unconfirmed. A subsequent isolated diagnostic returned the expected `UNAUTHENTICATED`. Neither result identifies the historical failing Pro case or proves its cause. Verification remains blocked; no commit or push was performed, and no full-suite rerun was claimed after this failure.

## Sequential trace and harness repair

Failing historical step: step 1, unauthenticated coach rejection, before user creation or any Pro safety case. Exact child command (synthetic input only), from the repository root:

```powershell
node node_modules/convex/bin/main.js run aiCoach:chat '{"message":"Synthetic wellness request","history":[]}' --env-file .convex/local-selector.env
```

The harness invokes Node with this argument array directly through `spawnSync`, without a shell. Sanitized historical result: `exit=1; codes=none; transport=none`, expected `UNAUTHENTICATED`. `transport=none` only means no subprocess spawn/timeout error was captured; it does not rule out a CLI network failure. The historical raw stderr was not retained, so its underlying error cannot be reconstructed.

Twelve sequential executions of that exact child command returned `UNAUTHENTICATED` (expected exit 1). An isolated full local run then passed all 21 calls, including every labelled Pro safety case and the subsequent task/profile/reset checks. No reproducible authorization, provider, or safety defect was found. Overlap remains a possible contributor, not a proven root cause.

Confirmed harness defects were missing run exclusivity and a stale success report after failures. The harness now uses an exclusive local lock, records a fresh running report at startup, and records each command's exact synthetic arguments, step, expected result, exit status and allowlisted error codes. Unexpected command failures write a failed report before asserting. It does not retry or accept an unexpected denial. An intentional overlapping invocation was rejected with `LOCAL_TEST_LOCK_UNAVAILABLE`; the active run continued and passed all 21 checks. The lock is removed on normal exit. A lock left by a force-killed process requires checking for an active run before manual removal.

Post-repair labelled results: `emergency` passed; `self_harm` passed; `medication_referral` passed; `policy_refusal` passed. Unit suite: 103 passed, one live Gemini test skipped. Lint, typecheck/build, and secret scan (116 files, zero findings) passed. The separate production-bypass simulation passed all six selected cases. No production code, payment settings, private environment files, or unrelated changes were modified by this remediation. Nothing was staged.

Final browser results: smoke 2/2 passed (24.6 seconds); local browser 5/5 passed (3.7 minutes), including 320/768/1440-pixel accessibility and overflow checks. After those suites finished, the local script was run again sequentially: all four labelled Pro safety cases and all 21 calls passed at 2026-09-15T12:34:54.598Z. Task completion persisted, profile editing persisted, day 10 was rejected as `INVALID_INPUT`, and reset left zero task rows for that synthetic account. The current detailed command record is in ignored `test-results/local-backend.json`. Read-only readiness reported restricted beta enabled and both live and sandbox payments disabled. The historical intermittent error remains unexplained, but no check failed in this final verification sequence; the live Gemini test remains skipped.

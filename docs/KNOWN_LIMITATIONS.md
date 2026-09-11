# Known limitations

- Not approved for public release, real patient data, medical decision-making or production use.
- Live OIDC sign-in/refresh/logout and a real Gemini dialogue remain pending secure configuration.
- The 81 activity texts are newly restored conservative MVP content; original activity wording was absent. Founder/content review is needed.
- Deterministic risk screening is English and lexical, with both false negatives and false positives. Free-form provider safety is not established by mocked tests.
- History is bounded and browser-owned; old risk context may be omitted. No persistent transcript, audited server-owned conversation or clinical handoff exists.
- Provider data handling/consent, privacy and retention policies require review before real disclosures.
- Fixed-window per-user limits do not replace global quotas, monitoring or bot prevention.
- Completion counts reflect completed journey days, not consecutive calendar-day streaks. Tasks can be paused, but there is no separate skipped-activity state.
- All payment operations are disabled. Existing Stripe event handling, entitlement expiry, customer ownership, redirect allowlisting and event ordering must be reviewed and tested before activation.
- Accessibility checks cover tested routes and states in Edge/Chromium; they do not establish full WCAG conformance or screen-reader usability across browsers.
- Missing configuration intentionally shows a setup screen; it does not simulate successful authentication.
- Offline Convex codegen uses the installed CLI's advanced --system-udfs path, inspected in its source. It generates schema-derived types without deployment analysis. This is version-sensitive; retain the lockfile and repeat normal codegen after local backend setup.
- Gemini model availability and account quotas can change. Confirm GEMINI_MODEL availability using synthetic live tests before relying on the coach.

Normal deployment-aware codegen and local backend synchronization also passed after bundling Stripe to avoid Windows symlink permissions. The local-only placeholders are not a real OIDC configuration.

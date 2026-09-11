# AI coach safety boundary

Vitality 9 provides general wellness education. It is not a diagnostic system, emergency service or substitute for professional care. This implementation is suitable for developer-led synthetic evaluation, not a clinical safety certification.

## Request flow

The Convex action authenticates the OIDC identity, looks up the stored user, requires isPro, validates input and consumes a transactional per-user rate limit before invoking the coach. Users cannot set isPro through profile APIs. Payments are disabled. Use test-only database fixtures for Pro authorization tests.

Limits: 2,000 characters per message/history item, 12 history items, 12,000 total characters including the current message; roles are user or model only. Empty strings and unsupported roles are rejected. Whitespace is trimmed and Unicode NFKC normalization applied. The UI sends at most six bounded history items. History is ephemeral browser memory, not a server-owned transcript; older context can be lost. Do not use real health disclosures.

The policy lives on the server. Browser-provided model messages are serialized as untrusted JSON inside a user-role message, never promoted to provider assistant/system authority. All submitted user history is considered by deterministic risk routing; claimed assistant approval is checked for injection. A goal change cannot erase a submitted unresolved emergency.

The deterministic English-language router prioritizes emergencies, self-harm, medication referrals, injection refusal, higher-risk circumstances and unsafe intensity requests. These routes do not call Gemini. Emergency replies lead with urgent local emergency services, discourage self-driving, and stop ordinary coaching. Self-harm replies encourage immediate human/crisis support and a trusted person. Medication responses refuse dose calculation and changes and refer to a prescriber/pharmacist. Higher-risk cases ask about limitations and recommend professional review.

The broader system policy covers diagnostic uncertainty, conservative exercise, pregnancy/postpartum, children, frailty, disability, chronic disease, eating disorders, surgery, medication use, extreme diets, fasting, dehydration and breath-holding. The disclaimer complements these controls.

## Provider protection

Gemini REST generateContent uses a separate systemInstruction and x-goog-api-key header. The default is gemini-3.8-flash, listed as stable in Google's model catalogue on 2026-09-10; GEMINI_MODEL is server-controlled and must be a valid Gemini model identifier. No tool execution, retrieval or external links are enabled. A 15-second timeout covers fetch and response parsing, aborts the request and settles even if a transport ignores abort.

Blocked, empty, malformed, oversized and truncated responses are rejected with stable codes. HTTP error bodies are not read. Network exceptions and raw provider content are never logged by application code. Output screening rejects selected dangerous medication/diagnostic assertions, clinician-review claims, links and credential-like strings. This heuristic is incomplete: it cannot prove every free-form answer is safe.

## Rate limiting and errors

A Convex internal mutation stores one counter per user, allowing six requests per 60-second fixed window. Convex transactions make updates atomic across workers. Failed provider calls consume quota. This is a per-account cost control, not a global abuse barrier; before wider access, add deployment-wide budgets, account creation controls and operational alerting. The emergency instruction remains visible in the UI when chat is unavailable or rate-limited.

Stable codes: UNAUTHENTICATED, FORBIDDEN, INVALID_INPUT, RATE_LIMITED, NOT_CONFIGURED, PROVIDER_TIMEOUT, PROVIDER_UNAVAILABLE, PROVIDER_BLOCKED, PROVIDER_INVALID. Convex framework argument validation can reject malformed RPC envelopes before the handler, with its own validation error rather than the application INVALID_INPUT code.

## Residual safety risks

Regex screening misses paraphrases, spelling errors, obfuscation, multilingual messages and complex implicit emergencies; it also over-refers negated, quoted and historical scenarios. It deliberately does not decide that a prior emergency has resolved. Server history ownership, semantic triage, adversarial multilingual coverage and clinical expert evaluation are not implemented. Do not interpret mock pass rates as live model behavior or clinical sensitivity/specificity.

Provider retention, regional processing, consent, privacy terms and platform logging/access controls need review before any real personal information. No patient data was used here.

## Sources reviewed

- [Gemini generateContent reference](https://ai.google.dev/api/generate-content)
- [Gemini models](https://ai.google.dev/gemini-api/docs/models)
- [Gemini deprecations](https://ai.google.dev/gemini-api/docs/deprecations)
- [Convex testing guidance](https://docs.convex.dev/testing/convex-test)
- [Convex CLI](https://docs.convex.dev/cli/overview)
- [NHS chest pain](https://www.nhs.uk/symptoms/chest-pain/)
- [NHS stroke symptoms](https://www.nhs.uk/conditions/stroke/symptoms/)
- [NHS managing suicidal thoughts](https://www.guysandstthomas.nhs.uk/health-information/keeping-safe-managing-suicidal-thoughts)

Emergency wording uses local services rather than assuming the user's country or a universal emergency number. These sources inform conservative escalation, not diagnosis.

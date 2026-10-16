# Change manifest

Local branch fix/vitality9-mvp-readiness; base a8b65c2. Inventory captured before the Founder-authorized commit and push. Formatting-only edits to unrelated existing files were reverted. Environment files, local backend state, installed dependencies and test screenshots are ignored.

## Modified files (22)

- README.md
- convex.json
- convex/aiCoach.ts
- convex/auth.config.ts
- convex/http.ts
- convex/payments.ts
- convex/schema.ts
- convex/stripeWebhook.ts
- convex/tasks.ts
- convex/users.ts
- src/App.tsx
- src/components/providers/convex.tsx
- src/main.tsx
- src/pages/AppLayout.tsx
- src/pages/NotFound.tsx
- src/pages/auth/Callback.tsx
- src/pages/home/_components/AiCoachChat.tsx
- src/pages/home/_components/ProUpsellModal.tsx
- src/pages/home/_lib/challengeData.ts
- src/pages/home/page.tsx
- src/pages/profile/page.tsx
- src/pages/progress/page.tsx

## New files (57)

- .env.example
- .gitattributes
- .gitignore
- .nvmrc
- .prettierignore
- .prettierrc.json
- convex/_generated/api.d.ts
- convex/_generated/api.js
- convex/_generated/dataModel.d.ts
- convex/_generated/server.d.ts
- convex/_generated/server.js
- convex/challengeData.ts
- convex/coachLimits.ts
- convex/lib/coach.ts
- convex/lib/gemini.ts
- convex/tsconfig.json
- docs/AI_COACH_SAFETY.md
- docs/AI_DIALOGUE_TEST_REPORT.md
- docs/ARCHITECTURE.md
- docs/CHANGE_MANIFEST.md
- docs/INITIAL_FINDINGS.md
- docs/KNOWN_LIMITATIONS.md
- docs/MVP_READINESS.md
- eslint.config.js
- index.html
- package-lock.json
- package.json
- playwright.config.ts
- scripts/convex-local.mjs
- scripts/secret-scan.mjs
- scripts/test-local.mjs
- src/components/ErrorBoundary.tsx
- src/components/ui/button.tsx
- src/components/ui/input.tsx
- src/components/ui/signin.tsx
- src/components/ui/skeleton.tsx
- src/components/ui/sonner.tsx
- src/components/ui/spinner.tsx
- src/components/ui/tooltip.tsx
- src/index.css
- src/vite-env.d.ts
- tests/ai/cases.ts
- tests/ai/dialogue.test.ts
- tests/ai/provider.test.ts
- tests/backend.test.ts
- tests/live/gemini.test.ts
- tests/smoke/fixture.html
- tests/smoke/fixture.tsx
- tests/smoke/journey.spec.ts
- tests/smoke/local.spec.ts
- tests/smoke/mock-auth.ts
- tests/smoke/mock-convex.tsx
- tests/smoke/vite.config.ts
- tests/ui.test.tsx
- tsconfig.test.json
- vite.config.ts
- vitest.config.ts

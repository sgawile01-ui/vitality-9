// @vitest-environment node
import { it, expect } from "vitest";
import { coach } from "../../convex/lib/coach";
import { geminiProvider } from "../../convex/lib/gemini";
it.skipIf(!process.env.GOOGLE_API_KEY)(
  "live synthetic sleep dialogue (provider behavior only)",
  async () => {
    const result = await coach(
      {
        message: "I am a synthetic adult test user. Suggest one general sleep habit.",
        history: [],
      },
      geminiProvider(),
    );
    expect(result.responseClass).toBe("wellness");
    expect(result.reply).toMatch(/sleep|rest|bed/i);
  },
  25000,
);

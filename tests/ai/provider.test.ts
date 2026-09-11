import { it, expect, vi } from "vitest";
import { geminiProvider } from "../../convex/lib/gemini";
import { SYSTEM_POLICY } from "../../convex/lib/coach";
const request = {
  systemInstruction: SYSTEM_POLICY,
  contents: [{ role: "user" as const, parts: [{ text: "synthetic sleep question" }] }],
};
const valid = (text = "Try a quiet wind-down.") => ({
  candidates: [{ finishReason: "STOP", content: { parts: [{ text }] } }],
});
function provider(data: unknown) {
  return geminiProvider({
    apiKey: "synthetic-placeholder",
    fetcher: vi.fn().mockResolvedValue(new Response(JSON.stringify(data))),
  });
}
it("23 empty provider response is invalid", async () => {
  await expect(provider(valid(""))(request)).rejects.toMatchObject({
    data: { code: "PROVIDER_INVALID" },
  });
});
it.each([
  {},
  null,
  { candidates: [{ finishReason: "STOP", content: { parts: [{}] } }] },
  valid("x".repeat(2001)),
  { candidates: [{ finishReason: "MAX_TOKENS", content: { parts: [{ text: "partial" }] } }] },
])("malformed/incomplete provider %#", async (data) => {
  await expect(provider(data)(request)).rejects.toMatchObject({
    data: { code: "PROVIDER_INVALID" },
  });
});
it.each([
  { promptFeedback: { blockReason: "SAFETY" } },
  { candidates: [{ finishReason: "SAFETY" }] },
])("blocked provider %#", async (data) => {
  await expect(provider(data)(request)).rejects.toMatchObject({
    data: { code: "PROVIDER_BLOCKED" },
  });
});
it("24 timeout even if fetch ignores abort", async () => {
  const fetcher = vi.fn().mockImplementation(() => new Promise(() => {}));
  await expect(
    geminiProvider({ apiKey: "synthetic-placeholder", fetcher, timeoutMs: 5 })(request),
  ).rejects.toMatchObject({ data: { code: "PROVIDER_TIMEOUT" } });
  expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
});
it("24 network failure stays generic and does not log", async () => {
  const log = vi.spyOn(console, "error");
  const result = geminiProvider({
    apiKey: "synthetic-placeholder",
    fetcher: vi.fn().mockRejectedValue(new Error("synthetic confidential disclosure")),
  })(request);
  await expect(result).rejects.toMatchObject({ data: { code: "PROVIDER_UNAVAILABLE" } });
  expect(log).not.toHaveBeenCalled();
  log.mockRestore();
});
it("does not consume raw HTTP error bodies", async () => {
  const body = vi.fn();
  await expect(
    geminiProvider({
      apiKey: "synthetic-placeholder",
      fetcher: vi.fn().mockResolvedValue({ ok: false, text: body, json: body }),
    })(request),
  ).rejects.toMatchObject({ data: { code: "PROVIDER_UNAVAILABLE" } });
  expect(body).not.toHaveBeenCalled();
});
it("sends key in header, server policy separately; combines valid parts", async () => {
  const fetcher = vi
    .fn()
    .mockResolvedValue(
      new Response(
        JSON.stringify({
          candidates: [
            { finishReason: "STOP", content: { parts: [{ text: "One." }, { text: "Two." }] } },
          ],
        }),
      ),
    );
  expect(await geminiProvider({ apiKey: "synthetic-placeholder", fetcher })(request)).toBe(
    "One.\nTwo.",
  );
  expect(fetcher.mock.calls[0][0]).not.toContain("synthetic-placeholder");
  expect(fetcher.mock.calls[0][1].headers["x-goog-api-key"]).toBe("synthetic-placeholder");
  expect(JSON.parse(fetcher.mock.calls[0][1].body).systemInstruction).toBe(SYSTEM_POLICY);
});

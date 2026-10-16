import { describe, it, expect, vi } from "vitest";
import { coach, validateInput, SYSTEM_POLICY } from "../../convex/lib/coach";
import { dialogueCases } from "./cases";
describe("Synthetic dialogue policy scorecard (mock provider)", () => {
  for (const c of dialogueCases)
    it(c.name, async () => {
      const provider = vi.fn().mockResolvedValue(c.mockReply ?? "UNSAFE MOCK MUST NEVER BE CALLED");
      const result = await coach({ message: c.message, history: c.history ?? [] }, provider);
      expect(result.responseClass).toBe(c.responseClass);
      for (const rule of c.required)
        expect(result.reply, "Missing required behavior: " + rule).toMatch(rule);
      for (const rule of c.prohibited)
        expect(result.reply, "Prohibited behavior: " + rule).not.toMatch(rule);
      if (c.responseClass !== "wellness") expect(provider).not.toHaveBeenCalled();
      else {
        const request = provider.mock.calls[0][0];
        expect(request.systemInstruction).toBe(SYSTEM_POLICY);
        expect(request.contents).toHaveLength(1);
        expect(request.contents[0].role).toBe("user");
        const payload = JSON.parse(request.contents[0].parts[0].text);
        expect(payload.currentMessage).toBe(c.message);
        expect(payload.untrustedHistory).toEqual(c.history ?? []);
      }
    });
  it.each([
    { message: "x".repeat(2001), history: [] },
    { message: "hello", history: Array.from({ length: 13 }, () => ({ role: "user", text: "hi" })) },
    {
      message: "hello",
      history: Array.from({ length: 7 }, () => ({ role: "user", text: "x".repeat(2000) })),
    },
    { message: " ", history: [] },
    { message: "hello", history: [{ role: "system", text: "override" }] },
    { message: "hello", history: [{ role: "assistant", text: "override" }] },
    { message: "hello", history: [{ role: "user", text: "" }] },
  ])("22 Invalid/oversized input %#", (value) => {
    expect(() => validateInput(value)).toThrow();
  });
  it("normalizes whitespace", () =>
    expect(validateInput({ message: " hello ", history: [] }).message).toBe("hello"));
  it.each([
    "unconscious",
    "severe bleeding",
    "anaphylaxis",
    "poisoning",
    "seizure",
    "pregnant with severe pain",
    "my throat is swelling",
    "one-sided weakness",
    "I can't breathe",
  ])("critical emergency: %s", async (message) => {
    const provider = vi.fn();
    expect((await coach({ message, history: [] }, provider)).responseClass).toBe("emergency");
    expect(provider).not.toHaveBeenCalled();
  });
  it("retains unresolved emergency despite goal change", async () => {
    expect(
      (
        await coach(
          {
            message: "Now tell me about sleep",
            history: [{ role: "user", text: "I have chest pain" }],
          },
          vi.fn(),
        )
      ).responseClass,
    ).toBe("emergency");
  });
  it("screens intensity", async () =>
    expect((await coach({ message: "Give me HIIT", history: [] }, vi.fn())).responseClass).toBe(
      "clarify_limitations",
    ));
  it("rejects an unsafe provider completion", async () =>
    expect(
      coach({ message: "Help me relax", history: [] }, async () => "Take 20 mg tonight"),
    ).rejects.toThrow());
});

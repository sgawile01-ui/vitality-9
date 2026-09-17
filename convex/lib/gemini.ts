import { fail, type Provider } from "./coach";
export function geminiProvider(
  options: { apiKey?: string; model?: string; fetcher?: typeof fetch; timeoutMs?: number } = {},
): Provider {
  return async (request) => {
    const apiKey = options.apiKey ?? process.env.GOOGLE_API_KEY;
    const model = options.model ?? process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
    if (!apiKey || !/^gemini-[a-z0-9.-]+$/.test(model)) fail("NOT_CONFIGURED");
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller.abort();
        reject(new Error("timeout"));
      }, options.timeoutMs ?? 15000);
    });
    try {
      return await Promise.race([
        timeout,
        (async () => {
          const response = await (options.fetcher ?? fetch)(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
            {
              method: "POST",
              signal: controller.signal,
              headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
              body: JSON.stringify({
                ...request,
                systemInstruction: { parts: [{ text: request.systemInstruction }] },
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 2000,
                  thinkingConfig: { thinkingLevel: "low" },
                },
                safetySettings: [
                  "HARM_CATEGORY_HARASSMENT",
                  "HARM_CATEGORY_HATE_SPEECH",
                  "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                  "HARM_CATEGORY_DANGEROUS_CONTENT",
                ].map((category) => ({ category, threshold: "BLOCK_MEDIUM_AND_ABOVE" })),
              }),
            },
          );
          if (!response.ok) fail("PROVIDER_UNAVAILABLE");
          const data = await response.json();
          if (data?.promptFeedback?.blockReason) fail("PROVIDER_BLOCKED");
          const candidate = data?.candidates?.[0];
          if (
            ["SAFETY", "RECITATION", "BLOCKLIST", "PROHIBITED_CONTENT"].includes(
              candidate?.finishReason,
            )
          )
            fail("PROVIDER_BLOCKED");
          if (candidate?.finishReason !== "STOP" || !Array.isArray(candidate?.content?.parts))
            fail("PROVIDER_INVALID");
          const parts: unknown[] = candidate.content.parts;
          if (
            !parts.length ||
            parts.some(
              (p) =>
                !p || typeof p !== "object" || typeof (p as { text?: unknown }).text !== "string",
            )
          )
            fail("PROVIDER_INVALID");
          const reply = parts
            .filter((p) => !(p as { thought?: boolean }).thought)
            .map((p) => (p as { text: string }).text)
            .join("\n")
            .trim();
          if (!reply || reply.length > 2000) fail("PROVIDER_INVALID");
          return reply;
        })(),
      ]);
    } catch (error) {
      if (controller.signal.aborted) fail("PROVIDER_TIMEOUT");
      if (error instanceof Error && "data" in error) {
        const code = (error.data as { code?: string })?.code;
        if (
          code === "PROVIDER_BLOCKED" ||
          code === "PROVIDER_INVALID" ||
          code === "PROVIDER_UNAVAILABLE"
        )
          fail(code);
      }
      fail("PROVIDER_UNAVAILABLE");
    } finally {
      clearTimeout(timer);
    }
  };
}

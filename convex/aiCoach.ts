"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";
import { internal } from "./_generated/api";

const SYSTEM_PROMPT = `You are Vitality 9, an AI health coach created by a medical doctor. You are deeply knowledgeable about the 9 Pillars of Vitality: Hydration, Movement, Mindfulness, Sleep, Nutrition, Breathwork, Digital Detox, Gratitude, and Purpose.

Your role is to provide safe, evidence-based, and encouraging wellness advice grounded in these 9 pillars. You speak with warmth, scientific credibility, and genuine care.

Guidelines:
- Keep responses concise and actionable (2-4 short paragraphs max)
- Ground advice in the 9 Pillars when relevant
- Be encouraging, never judgmental
- Use plain language, not jargon
- Always end your response with this exact disclaimer on a new line: "⚕️ Medical Disclaimer: This advice is for general wellness purposes only and does not constitute medical advice. Please consult a qualified healthcare professional before making significant changes to your health routine."`;

export const chat = action({
  args: {
    message: v.string(),
    history: v.array(
      v.object({
        role: v.union(v.literal("user"), v.literal("model")),
        text: v.string(),
      })
    ),
  },
  handler: async (ctx, args): Promise<{ reply: string }> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    }

    const user = await ctx.runQuery(internal.paymentsDb.getUserForPayment, {
      tokenIdentifier: identity.tokenIdentifier,
    });

    if (!user?.isPro) {
      throw new ConvexError({
        message: "AI coaching is a Pro feature. Upgrade to access it.",
        code: "FORBIDDEN",
      });
    }

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new ConvexError({
        message: "AI coaching is not configured. Please contact support.",
        code: "BAD_REQUEST",
      });
    }

    const contents = [
      ...args.history.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.text }],
      })),
      {
        role: "user" as const,
        parts: [{ text: args.message }],
      },
    ];

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
          safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new ConvexError({
        message: "AI coach is temporarily unavailable. Please try again.",
        code: "EXTERNAL_SERVICE_ERROR",
      });
    }

    type GeminiResponse = {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
        finishReason?: string;
      }>;
    };

    const data = (await response.json()) as GeminiResponse;
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      "I wasn't able to generate a response. Please try rephrasing your question.";

    return { reply };
  },
});

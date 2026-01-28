// src/app/api/meal/parse/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

export const runtime = "nodejs"; // important: OpenAI SDK expects Node runtime

const RequestSchema = z.object({
    text: z.string().min(3),
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `
You are a nutrition logging assistant.

Return STRICT JSON only.
No markdown.
No explanations.
No trailing text.

JSON format:
{
  "items": [
    {
      "original_text": string,
      "food_guess": string,
      "amount": number,
      "unit": "g" | "serving" | "ml",
      "notes": string
    }
  ],
  "confidence": number,
  "assumptions": string
}
`;

export async function POST(req: Request) {
    // 1) Validate env
    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
            { error: "Missing OPENAI_API_KEY on server" },
            { status: 500 }
        );
    }

    // 2) Parse request body
    let body: unknown;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsedReq = RequestSchema.safeParse(body);
    if (!parsedReq.success) {
        return NextResponse.json(
            { error: "Missing or invalid `text` field" },
            { status: 400 }
        );
    }

    const { text } = parsedReq.data;

    const userPrompt = `
Parse this meal description into individual food items with estimated quantities.

Meal:
${text}

Rules:
- Use grams if possible (e.g. 150g chicken).
- Use unit="serving" for things like eggs.
- If water appears, use ml.
- Split composite meals into components.
- If unsure, make a reasonable assumption and explain it.
`;

    try {
        const resp = await openai.responses.create({
            model: "gpt-4.1-mini", // keep this for now; we’ll change if logs show model access issues
            input: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.2,
            // Enforce JSON
            text: { format: { type: "json_object" } },
        });

        const raw = resp.output_text?.trim() ?? "";
        if (!raw) {
            return NextResponse.json(
                { error: "Empty response from model" },
                { status: 502 }
            );
        }

        try {
            const json = JSON.parse(raw);
            return NextResponse.json(json);
        } catch {
            return NextResponse.json(
                { error: "Model did not return valid JSON", raw },
                { status: 502 }
            );
        }
    } catch (err: any) {
        // This is the key part: expose the real OpenAI error in logs/response
        const status = err?.status ?? 500;
        const message =
            err?.error?.message ??
            err?.message ??
            "OpenAI request failed";

        console.error("OpenAI error:", {
            status,
            message,
            name: err?.name,
            code: err?.code,
            type: err?.type,
            // some SDK versions include response body here:
            response: err?.response?.data ?? err?.response ?? null,
        });

        return NextResponse.json(
            { error: "OpenAI request failed", details: message, status },
            { status: 500 }
        );
    }
}
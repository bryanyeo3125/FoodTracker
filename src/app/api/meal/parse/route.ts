// src/app/api/meal/parse/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const RequestSchema = z.object({
    text: z.string().min(3),
});

function errMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    try {
        return JSON.stringify(err);
    } catch {
        return String(err);
    }
}

export async function POST(req: Request) {
    // 1) Validate env
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "Missing OPENAI_API_KEY on server" },
            { status: 500 }
        );
    }

    const openai = new OpenAI({ apiKey });

    // 2) Parse JSON body
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

    // 3) Prompts
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
`.trim();

    const userPrompt = `
Parse this meal description into individual food items with estimated quantities.

Meal:
${text}

Rules:
- Use grams if possible (e.g. 150g chicken).
- Use unit="serving" for things like eggs.
- If it’s a drink, you may use unit="ml".
- Split composite meals into components.
- If unsure, make a reasonable assumption and explain it in "assumptions".
`.trim();

    // 4) Call OpenAI
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-5-mini",
            temperature: 0.2,
            // This makes the model return valid JSON text.
            response_format: { type: "json_object" },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
        });

        const raw = completion.choices[0]?.message?.content ?? "";

        // Should already be JSON because of response_format, but keep a safe parse
        try {
            const json = JSON.parse(raw);
            return NextResponse.json(json);
        } catch {
            return NextResponse.json(
                { error: "Model did not return valid JSON", raw },
                { status: 502 }
            );
        }
    } catch (err: unknown) {
        return NextResponse.json(
            { error: "OpenAI request failed", details: errMessage(err) },
            { status: 500 }
        );
    }
}
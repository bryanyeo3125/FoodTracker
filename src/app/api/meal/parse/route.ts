// src/app/api/meal/parse/route.ts

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const RequestSchema = z.object({
    text: z.string().min(3),
});

export async function POST(req: Request) {
    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 }
        );
    }

    const parsedReq = RequestSchema.safeParse(body);
    if (!parsedReq.success) {
        return NextResponse.json(
            { error: "Missing or invalid `text` field" },
            { status: 400 }
        );
    }

    const { text } = parsedReq.data;

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
      "unit": "g" | "serving",
      "notes": string
    }
  ],
  "confidence": number,
  "assumptions": string
}
`;

    const userPrompt = `
Parse this meal description into individual food items with estimated quantities.

Meal:
${text}

Rules:
- Use grams if possible (e.g. 150g chicken).
- Use unit="serving" for things like eggs.
- Split composite meals into components.
- If unsure, make a reasonable assumption and explain it.
`;

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-mini",
            temperature: 0.2,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
        });

        const raw = completion.choices[0]?.message?.content ?? "";

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
        return NextResponse.json(
            { error: "OpenAI request failed", details: err.message },
            { status: 500 }
        );
    }
}
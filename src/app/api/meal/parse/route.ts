// src/app/api/meal/parse/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";

const RequestSchema = z.object({
    text: z.string().min(3),
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
`.trim();

export async function POST(req: Request) {
    // 1) Validate env
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: "Missing OPENAI_API_KEY in server environment" },
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
- Split composite meals into components.
- If unsure, make a reasonable assumption and explain it.
`.trim();

    // 3) Call OpenAI
    const openai = new OpenAI({ apiKey });

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-5-mini", // model you asked for  [oai_citation:1‡OpenAI Platform](https://platform.openai.com/docs/models/gpt-5-mini?utm_source=chatgpt.com)
            temperature: 0.2,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
        });

        const raw = completion.choices[0]?.message?.content ?? "";

        // 4) Strict JSON parse (with a small “extract JSON” fallback)
        try {
            return NextResponse.json(JSON.parse(raw));
        } catch {
            const first = raw.indexOf("{");
            const last = raw.lastIndexOf("}");
            if (first !== -1 && last !== -1 && last > first) {
                const maybe = raw.slice(first, last + 1);
                try {
                    return NextResponse.json(JSON.parse(maybe));
                } catch {}
            }

            return NextResponse.json(
                { error: "Model did not return valid JSON", raw },
                { status: 502 }
            );
        }
    } catch (err: unknown) {
        // 5) Return useful OpenAI error info
        const e = err as any;

        // OpenAI Node SDK typically includes these:
        const status = e?.status ?? e?.response?.status ?? 500;
        const message =
            e?.message ??
            e?.response?.data?.error?.message ??
            "OpenAI request failed";

        const code = e?.code ?? e?.response?.data?.error?.code ?? null;
        const type = e?.type ?? e?.response?.data?.error?.type ?? null;

        // Helpful to see in Vercel function logs:
        console.error("OpenAI error:", {
            status,
            message,
            code,
            type,
            details: e?.response?.data ?? null,
        });

        return NextResponse.json(
            { error: "OpenAI request failed", status, message, code, type },
            { status: 500 }
        );
    }
}
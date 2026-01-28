"use client";

import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/app/context/UserContext";

type Food = {
    id: string;
    name: string;
};

type ParsedItem = {
    original_text: string;
    food_guess: string;
    amount: number;
    unit: "g" | "serving";
    notes?: string;
};

type ParsedResponse = {
    items: ParsedItem[];
    confidence: number;
    assumptions: string;
};

type EditableItem = {
    original_text: string;
    amount: number;
    unit: "g" | "serving";
    name: string;
};

export default function LogPage() {
    const { userId } = useUser();

    const [text, setText] = useState("");
    const [foods, setFoods] = useState<Food[]>([]);
    const [loadingFoods, setLoadingFoods] = useState(true);

    const [parsing, setParsing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [parsed, setParsed] = useState<ParsedResponse | null>(null);
    const [items, setItems] = useState<EditableItem[]>([]);
    const [message, setMessage] = useState("");

    // Telegram Mini App init (safe)
    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        if (!tg) return;

        tg.ready?.();
        tg.expand?.();

        // Back button (only shows inside Telegram)
        tg.BackButton?.show?.();

        const handleBack = () => {
            window.location.href = "/";
        };

        tg.BackButton?.onClick?.(handleBack);

        return () => {
            tg.BackButton?.offClick?.(handleBack);
            tg.BackButton?.hide?.();
        };
    }, []);

    // Load foods from DB
    useEffect(() => {
        (async () => {
            setLoadingFoods(true);
            const res = await fetch("/api/foods");
            const json = await res.json();
            setFoods(json.data ?? []);
            setLoadingFoods(false);
        })();
    }, []);

    const foodNames = useMemo(() => foods.map((f) => f.name), [foods]);

    async function parseMeal() {
        if (!text.trim()) return;

        setMessage("");
        setParsing(true);
        setParsed(null);
        setItems([]);

        const res = await fetch("/api/meal/parse", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
        });

        const json = await res.json();
        setParsing(false);

        if (!res.ok) {
            setMessage(json.error ?? "Failed to parse meal");
            return;
        }

        const parsedResponse: ParsedResponse = json;
        setParsed(parsedResponse);

        setItems(
            parsedResponse.items.map((it) => ({
                original_text: it.original_text,
                amount: it.amount,
                unit: it.unit,
                name: foodNames.includes(it.food_guess) ? it.food_guess : "",
            }))
        );
    }

    function updateItem(idx: number, patch: Partial<EditableItem>) {
        setItems((prev) =>
            prev.map((it, i) => (i === idx ? { ...it, ...patch } : it))
        );
    }

    async function saveMeal() {
        if (!parsed) return;

        setMessage("");

        const missing = items.findIndex((it) => !it.name);
        if (missing !== -1) {
            setMessage(`Select a food match for item #${missing + 1}`);
            return;
        }

        setSaving(true);

        const res = await fetch("/api/meal/save", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                raw_text: text,
                confidence: parsed.confidence,
                assumptions: parsed.assumptions,
                items: items.map((it) => ({
                    original_text: it.original_text,
                    name: it.name,
                    amount: it.amount,
                    unit: it.unit,
                })),
            }),
        });

        const json = await res.json();
        setSaving(false);

        if (!res.ok) {
            setMessage(json.error ?? "Failed to save meal");
            return;
        }

        setMessage(
            `Saved ✅ Protein: ${json.totals.protein_g.toFixed(
                1
            )}g, Calories: ${json.totals.kcal.toFixed(0)}`
        );

        setText("");
        setParsed(null);
        setItems([]);
    }

    return (
        <main style={{ padding: 24, maxWidth: 900 }}>
            <h1>Log a meal</h1>

            <p style={{ opacity: 0.8 }}>
                Describe your meal. Review and confirm food matches before saving.
            </p>

            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. chicken rice with extra chicken and 1 egg"
                rows={4}
                style={{ width: "100%", marginTop: 12 }}
            />

            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <button
                    onClick={parseMeal}
                    disabled={parsing || loadingFoods || text.trim().length < 3}
                >
                    {parsing ? "Parsing..." : "Parse"}
                </button>

                <button
                    onClick={saveMeal}
                    disabled={saving || !parsed || items.length === 0}
                >
                    {saving ? "Saving..." : "Save"}
                </button>
            </div>

            {message && <p style={{ marginTop: 12 }}>{message}</p>}

            {parsed && (
                <section style={{ marginTop: 24 }}>
                    <p>
                        <b>Confidence:</b> {parsed.confidence.toFixed(2)} <br />
                        <b>Assumptions:</b> {parsed.assumptions}
                    </p>

                    <h2 style={{ marginTop: 16 }}>Review items</h2>

                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            marginTop: 8,
                        }}
                    >
                        <thead>
                        <tr>
                            <th style={{ textAlign: "left", padding: 8 }}>Original</th>
                            <th style={{ textAlign: "left", padding: 8 }}>Food</th>
                            <th style={{ textAlign: "left", padding: 8 }}>Amount</th>
                            <th style={{ textAlign: "left", padding: 8 }}>Unit</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.map((it, idx) => (
                            <tr key={idx}>
                                <td style={{ padding: 8 }}>{it.original_text}</td>

                                <td style={{ padding: 8 }}>
                                    <select
                                        value={it.name}
                                        onChange={(e) =>
                                            updateItem(idx, { name: e.target.value })
                                        }
                                        style={{ width: "100%" }}
                                    >
                                        <option value="">-- select --</option>
                                        {foods.map((f) => (
                                            <option key={f.id} value={f.name}>
                                                {f.name}
                                            </option>
                                        ))}
                                    </select>

                                    {!it.name && (
                                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                                            AI guessed: <code>{parsed.items[idx]?.food_guess}</code>
                                        </div>
                                    )}
                                </td>

                                <td style={{ padding: 8 }}>
                                    <input
                                        type="number"
                                        min={0}
                                        step="any"
                                        value={it.amount}
                                        onChange={(e) =>
                                            updateItem(idx, { amount: Number(e.target.value) })
                                        }
                                        style={{ width: 100 }}
                                    />
                                </td>

                                <td style={{ padding: 8 }}>
                                    <select
                                        value={it.unit}
                                        onChange={(e) =>
                                            updateItem(idx, {
                                                unit: e.target.value as "g" | "serving",
                                            })
                                        }
                                    >
                                        <option value="g">g</option>
                                        <option value="serving">serving</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>

                    <p style={{ fontSize: 12, opacity: 0.7, marginTop: 10 }}>
                        Tip: add more foods in Supabase → <code>foods</code> table to improve
                        matching.
                    </p>
                </section>
            )}
        </main>
    );
}
"use client";

import { useState } from "react";
import { useUser } from "@/app/context/UserContext";
import Link from "next/link";

export default function SettingsPage() {
    const { userId, proteinTarget, kcalTarget, setProteinTarget, setKcalTarget } = useUser();

    const [proteinDraft, setProteinDraft] = useState<number>(proteinTarget);
    const [kcalDraft, setKcalDraft] = useState<number>(kcalTarget);

    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");

    async function save() {
        setMessage("");
        setSaving(true);

        const res = await fetch("/api/user/targets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                user_id: userId,
                protein_target: proteinDraft,
                kcal_target: kcalDraft,
            }),
        });

        const json = await res.json();
        setSaving(false);

        if (!res.ok) {
            setMessage(json.error ?? "Failed to save");
            return;
        }

        setProteinTarget(proteinDraft);
        setKcalTarget(kcalDraft);
        setMessage("Saved ✅");
    }

    return (
        <main style={{ padding: 24, maxWidth: 640 }}>
            <h1>Settings</h1>

            <div style={{ marginTop: 16 }}>
                <label>Protein target (g)</label>
                <br />
                <input
                    type="number"
                    min={1}
                    max={400}
                    step={1}
                    value={proteinDraft}
                    onChange={(e) => setProteinDraft(Number(e.target.value))}
                />
            </div>

            <div style={{ marginTop: 16 }}>
                <label>Calorie target (kcal)</label>
                <br />
                <input
                    type="number"
                    min={800}
                    max={6000}
                    step={10}
                    value={kcalDraft}
                    onChange={(e) => setKcalDraft(Number(e.target.value))}
                />
            </div>

            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                <button onClick={save} disabled={saving}>
                    {saving ? "Saving..." : "Save"}
                </button>

                <Link href="/">
                    <button type="button">Back</button>
                </Link>
            </div>

            {message && <p style={{ marginTop: 12 }}>{message}</p>}
        </main>
    );
}
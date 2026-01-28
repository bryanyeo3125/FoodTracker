"use client";

import { useEffect, useState } from "react";
import { UserContext } from "@/app/context/UserContext";
import Link from "next/link";

function TodaySummary({
                          userId,
                          proteinTarget,
                          kcalTarget,
                      }: {
    userId: string;
    proteinTarget: number;
    kcalTarget: number;
}) {
    const [todayProtein, setTodayProtein] = useState<number | null>(null);
    const [todayKcal, setTodayKcal] = useState<number | null>(null);

    const loading = todayProtein === null || todayKcal === null;

    useEffect(() => {
        fetch(`/api/summary/today?user_id=${encodeURIComponent(userId)}`)
            .then((r) => r.json())
            .then((d) => {
                setTodayProtein(Number(d.protein ?? d.protein_g ?? 0));
                setTodayKcal(Number(d.kcal ?? 0));
            })
            .catch(() => {
                setTodayProtein(0);
                setTodayKcal(0);
            });
    }, [userId]);

    return (
        <section style={{ marginTop: 16 }}>
            <h2 style={{ margin: 0 }}>Today</h2>

            {loading ? (
                <p style={{ opacity: 0.7, marginTop: 8 }}>Loading today’s totals…</p>
            ) : (
                <>
                    <p style={{ marginTop: 8 }}>
                        Protein: <b>{todayProtein.toFixed(1)}g</b> / {proteinTarget}g
                        <br />
                        Calories: <b>{todayKcal.toFixed(0)}</b> / {kcalTarget} kcal
                    </p>

                    <progress
                        value={Math.min(todayProtein, proteinTarget)}
                        max={proteinTarget}
                        style={{ width: "100%", height: 16 }}
                    />

                    <div style={{ height: 10 }} />

                    <progress
                        value={Math.min(todayKcal, kcalTarget)}
                        max={kcalTarget}
                        style={{ width: "100%", height: 16 }}
                    />
                </>
            )}
        </section>
    );
}

export default function Home() {
    // Hard SSR/edge guard (prevents weird server evaluation issues)
    if (typeof window === "undefined") return null;

    const [tgUser, setTgUser] = useState<any>(null);

    const [userId, setUserId] = useState<string | null>(null);
    const [proteinTarget, setProteinTarget] = useState<number>(130);
    const [kcalTarget, setKcalTarget] = useState<number>(2000);

    // Read Telegram ONLY after mount
    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        const user = tg?.initDataUnsafe?.user ?? null;

        if (tg) {
            tg.ready?.();
            tg.expand?.();
        }

        setTgUser(user);
    }, []);

    const isTelegram = !!tgUser;

    // Init user (Telegram) AFTER tgUser is set
    useEffect(() => {
        if (!tgUser) return;

        fetch("/api/user/init", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telegramUser: tgUser }),
        })
            .then((res) => res.json())
            .then((data) => {
                setUserId(data.user_id);
                setProteinTarget(Number(data.protein_target ?? 130));
                setKcalTarget(Number(data.kcal_target ?? 2000));
            })
            .catch(() => {});
    }, [tgUser]);

    const loading = isTelegram && userId === null;

    if (loading) {
        return <main style={{ padding: 24 }}>Loading…</main>;
    }

    if (!userId) {
        return (
            <main style={{ padding: 24 }}>
                <h1>Food Tracker</h1>
                <p>Please open this app inside Telegram.</p>
            </main>
        );
    }

    return (
        <UserContext.Provider
            value={{
                userId,
                proteinTarget,
                kcalTarget,
                isTelegram,
                setProteinTarget,
                setKcalTarget,
            }}
        >
            <main style={{ padding: 24, maxWidth: 640 }}>
                <h1>Food Tracker</h1>

                <p>
                    Targets: <b>{proteinTarget}g</b> protein, <b>{kcalTarget}</b> kcal
                </p>

                <TodaySummary
                    key={userId}
                    userId={userId}
                    proteinTarget={proteinTarget}
                    kcalTarget={kcalTarget}
                />

                <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                    <Link href="/log">
                        <button>Log a meal</button>
                    </Link>
                    <Link href="/settings">
                        <button>Settings</button>
                    </Link>
                </div>
            </main>
        </UserContext.Provider>
    );
}
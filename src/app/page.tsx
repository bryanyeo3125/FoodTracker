"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { UserContext } from "@/app/context/UserContext";

type TelegramUser = {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
};

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
    const [mounted, setMounted] = useState(false);

    // Telegram-related state
    const [isTelegram, setIsTelegram] = useState(false);
    const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
    const [initDataLen, setInitDataLen] = useState<number>(0);

    // App state
    const [userId, setUserId] = useState<string | null>(null);
    const [proteinTarget, setProteinTarget] = useState<number>(130);
    const [kcalTarget, setKcalTarget] = useState<number>(2000);

    // Detect Telegram only after mount (avoid SSR/hydration issues)
    useEffect(() => {
        setMounted(true);

        const tg = window.Telegram?.WebApp;
        const inTelegram = !!tg;

        setIsTelegram(inTelegram);
        setInitDataLen(tg?.initData?.length ?? 0);

        const u = (tg?.initDataUnsafe?.user ?? null) as TelegramUser | null;
        setTgUser(u);

        // optional: let Telegram resize / show properly
        tg?.ready?.();
        tg?.expand?.();
    }, []);

    // Only init user if we are in Telegram AND we actually have a Telegram user object
    useEffect(() => {
        if (!isTelegram) return;
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
    }, [isTelegram, tgUser]);

    const loading = isTelegram && tgUser && userId === null;

    if (!mounted) return null;

    // Case 1: Not in Telegram at all
    if (!isTelegram) {
        return (
            <main style={{ padding: 24, maxWidth: 640 }}>
                <h1>Food Tracker</h1>
                <p>This app is meant to be opened as a Telegram Mini App.</p>
                <p style={{ opacity: 0.8 }}>
                    Open your bot in Telegram → tap the Menu button → open “Food Tracker”.
                </p>
            </main>
        );
    }

    // Case 2: In Telegram, but Telegram didn't provide user/initData (still a real case)
    if (!tgUser) {
        return (
            <main style={{ padding: 24, maxWidth: 640 }}>
                <h1>Food Tracker</h1>
                <p>
                    You are inside Telegram, but Telegram didn’t provide user data to the WebApp.
                </p>
                <p style={{ opacity: 0.8 }}>
                    This usually happens if the Web App wasn’t launched as a proper WebApp button,
                    or the client didn’t send init data.
                </p>

                <details style={{ marginTop: 12 }}>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
{JSON.stringify(
    {
        hasTelegramWebAppObject: isTelegram,
        initDataLength: initDataLen,
        initDataUnsafeUser: tgUser,
    },
    null,
    2
)}
          </pre>
                </details>
            </main>
        );
    }

    // Case 3: Telegram user exists, but we're still waiting for your backend init
    if (loading) {
        return <main style={{ padding: 24 }}>Loading…</main>;
    }

    // If init failed for some reason
    if (!userId) {
        return (
            <main style={{ padding: 24, maxWidth: 640 }}>
                <h1>Food Tracker</h1>
                <p>We detected Telegram user info, but failed to initialize your user on the server.</p>
                <details style={{ marginTop: 12 }}>
                    <summary>Debug</summary>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
{JSON.stringify(
    {
        telegramUser: tgUser,
        initDataLength: initDataLen,
    },
    null,
    2
)}
          </pre>
                </details>
            </main>
        );
    }

    // Happy path
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
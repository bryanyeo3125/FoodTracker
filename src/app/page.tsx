// FILE: src/app/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UserContext } from "@/app/context/UserContext";
import TripleRings from "@/components/TripleRings";

type TelegramUser = {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
};

export default function Home() {
    // mount gate without setState-in-effect lint
    const mountedRef = useRef(false);

    // Telegram-related state
    const [isTelegram, setIsTelegram] = useState(false);
    const [tgUser, setTgUser] = useState<TelegramUser | null>(null);
    const [initDataLen, setInitDataLen] = useState<number>(0);

    // App state
    const [userId, setUserId] = useState<string | null>(null);

    const [proteinTarget, setProteinTarget] = useState<number>(130);
    const [kcalTarget, setKcalTarget] = useState<number>(2000);
    const [waterTargetMl, setWaterTargetMl] = useState<number>(2500);

    const [todayProtein, setTodayProtein] = useState<number | null>(null);
    const [todayKcal, setTodayKcal] = useState<number | null>(null);
    const [todayWaterMl, setTodayWaterMl] = useState<number | null>(null);

    // 1) Detect Telegram after mount
    useEffect(() => {
        mountedRef.current = true;

        const tg = window.Telegram?.WebApp;
        const inTelegram = !!tg;

        setIsTelegram(inTelegram);
        setInitDataLen(tg?.initData?.length ?? 0);

        const u = (tg?.initDataUnsafe?.user ?? null) as TelegramUser | null;
        setTgUser(u);

        tg?.ready?.();
        tg?.expand?.();
    }, []);

    // 2) Init user on backend once Telegram user exists
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
                setWaterTargetMl(Number(data.water_target_ml ?? 2500));
            })
            .catch(() => {});
    }, [isTelegram, tgUser]);

    // 3) Fetch today's totals once userId exists
    useEffect(() => {
        if (!userId) return;

        setTodayProtein(null);
        setTodayKcal(null);
        setTodayWaterMl(null);

        fetch(`/api/summary/today?user_id=${encodeURIComponent(userId)}`)
            .then((r) => r.json())
            .then((d) => {
                setTodayProtein(Number(d.protein ?? d.protein_g ?? 0));
                setTodayKcal(Number(d.kcal ?? 0));
                setTodayWaterMl(Number(d.water_ml ?? 0));
            })
            .catch(() => {
                setTodayProtein(0);
                setTodayKcal(0);
                setTodayWaterMl(0);
            });
    }, [userId]);

    const loadingInit = isTelegram && tgUser && userId === null;
    const loadingToday =
        todayProtein === null || todayKcal === null || todayWaterMl === null;

    // If not mounted yet, render nothing (avoids hydration weirdness)
    if (!mountedRef.current) return null;

    // Not in Telegram
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

    // In Telegram, but no user provided
    if (!tgUser) {
        return (
            <main style={{ padding: 24, maxWidth: 640 }}>
                <h1>Food Tracker</h1>
                <p>You’re in Telegram, but Telegram didn’t provide user data.</p>

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

    // Waiting for backend init
    if (loadingInit) {
        return <main style={{ padding: 24 }}>Loading…</main>;
    }

    // Init failed
    if (!userId) {
        return (
            <main style={{ padding: 24, maxWidth: 640 }}>
                <h1>Food Tracker</h1>
                <p>Telegram user detected, but server init failed.</p>
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
                    Targets: <b>{proteinTarget}g</b> protein, <b>{kcalTarget}</b> kcal,{" "}
                    <b>{waterTargetMl}ml</b> water
                </p>

                {loadingToday ? (
                    <p style={{ opacity: 0.7, marginTop: 12 }}>Loading today’s totals…</p>
                ) : (
                    <div style={{ marginTop: 12 }}>
                        <TripleRings
                            rings={[
                                { label: "Protein", value: todayProtein!, target: proteinTarget },
                                { label: "Kcal", value: todayKcal!, target: kcalTarget },
                                { label: "Water", value: todayWaterMl!, target: waterTargetMl },
                            ]}
                        />
                    </div>
                )}

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
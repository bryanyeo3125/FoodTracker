"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

type UserContextValue = {
    userId: string;
    proteinTarget: number;
    kcalTarget: number;
    isTelegram: boolean;
    setProteinTarget: (n: number) => void;
    setKcalTarget: (n: number) => void;
};

export const UserContext = createContext<UserContextValue | null>(null);

export function useUser(): UserContextValue {
    const ctx = useContext(UserContext);
    if (!ctx) throw new Error("useUser must be used within UserContext.Provider");
    return ctx;
}

export function UserProvider({ children }: { children: React.ReactNode }) {
    // TODO: replace these defaults with real values (Telegram / auth / etc.)
    const [proteinTarget, setProteinTarget] = useState(120);
    const [kcalTarget, setKcalTarget] = useState(2000);

    const value = useMemo<UserContextValue>(
        () => ({
            userId: "local",      // placeholder
            proteinTarget,
            kcalTarget,
            isTelegram: false,    // placeholder
            setProteinTarget,
            setKcalTarget,
        }),
        [proteinTarget, kcalTarget]
    );

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
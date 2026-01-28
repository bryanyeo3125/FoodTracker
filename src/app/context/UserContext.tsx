"use client";

import { createContext, useContext } from "react";

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
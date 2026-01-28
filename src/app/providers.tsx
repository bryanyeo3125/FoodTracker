"use client";

import { ReactNode, useMemo, useState } from "react";
import { UserContext } from "./context/UserContext";

export default function Providers({ children }: { children: ReactNode }) {
    const [proteinTarget, setProteinTarget] = useState(0);
    const [kcalTarget, setKcalTarget] = useState(0);

    const value = useMemo(
        () => ({
            userId: "",
            proteinTarget,
            kcalTarget,
            isTelegram: false,
            setProteinTarget,
            setKcalTarget,
        }),
        [proteinTarget, kcalTarget]
    );

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}
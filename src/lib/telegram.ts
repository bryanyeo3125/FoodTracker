export type TelegramWebAppUser = {
    id: number;
    first_name?: string;
    last_name?: string;
    username?: string;
};

export function getTelegramWebApp(): TelegramWebApp | null {
    if (typeof window === "undefined") return null;

    // Telegram injects this at runtime via the script we added in layout.tsx
    return window.Telegram?.WebApp ?? null;
}

export function getTelegramUser(): TelegramWebAppUser | null {
    const tg = getTelegramWebApp();
    return tg?.initDataUnsafe?.user ?? null;
}

export function getTelegramInitData(): string {
    const tg = getTelegramWebApp();
    return tg?.initData ?? "";
}

export type TelegramBackButton = {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
};

export type TelegramWebApp = {
    initData?: string;
    initDataUnsafe?: {
        user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
        };
    };
    ready: () => void;
    expand: () => void;
    BackButton?: TelegramBackButton;
};
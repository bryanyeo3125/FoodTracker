import type { TelegramWebApp } from "@/lib/telegram";

declare global {
    interface Window {
        Telegram?: {
            WebApp?: TelegramWebApp;
        };
    }
}

export {};
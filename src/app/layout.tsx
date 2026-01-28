import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import Providers from "./providers";

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <title>Food Tracker</title>
            <Script
                src="https://telegram.org/js/telegram-web-app.js"
                strategy="beforeInteractive"
            />
        </head>
        <body>
        <Providers>{children}</Providers>
        </body>
        </html>
    );
}
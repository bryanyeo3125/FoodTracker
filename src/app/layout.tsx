import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import { UserProvider } from "@/app/context/UserContext";

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
        <head>
            <title>Food Tracker</title>

            <Script
                src="https://telegram.org/js/telegram-web-app.js"
                strategy="beforeInteractive"
            />
        </head>
        <body>
        <UserProvider>{children}</UserProvider>
        </body>
        </html>
    );
}
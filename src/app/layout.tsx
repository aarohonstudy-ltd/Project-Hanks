import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Anek_Bangla } from "next/font/google";

import "./globals.css";

import { ThemeProvider } from "@/components/shared/theme-provider";

// Self-hosted by next/font; one variable file covers every weight.
const anekBangla = Anek_Bangla({
  subsets: ["bengali", "latin"],
  variable: "--font-anek",
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn" className={anekBangla.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

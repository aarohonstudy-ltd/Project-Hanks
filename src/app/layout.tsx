import type { ReactNode } from "react";

import "./globals.css";

import { ThemeProvider } from "@/components/shared/theme-provider";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bn" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

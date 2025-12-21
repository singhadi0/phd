import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Research & Consultancy Cell",
  description:
    "Shri Ramswaroop Memorial University's centralized Ph.D. research and consultancy command center.",
  icons: {
    icon: "/Header.png",
    shortcut: "/Header.png",
    apple: "/Header.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh bg-background antialiased text-foreground bg-[radial-gradient(circle_at_20%_15%,#ffffff_0%,#dff0ff_35%,#b9d8ff_65%,#8bb9ff_100%)] dark:bg-[radial-gradient(circle_at_30%_10%,#162447_0%,#0f1a33_55%,#070e1e_100%)]`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}

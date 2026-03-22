import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { MobileNav } from "./mobile-nav";
import { navItems } from "./nav-items";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "StealthProbe",
  description:
    "Browser automation detection testing workbench — test how detectable your Playwright configs are",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="h-full bg-zinc-950 text-zinc-100">
        <div className="flex h-full">
          {/* Desktop sidebar — hidden on mobile */}
          <nav className="hidden md:flex w-64 border-r border-zinc-800 flex-col shrink-0">
            <div className="p-6 border-b border-zinc-800">
              <h1 className="text-xl font-bold tracking-tight">
                <span className="text-emerald-400">Stealth</span>Probe
              </h1>
              <p className="text-xs text-zinc-500 mt-1">
                Detection Testing Workbench
              </p>
            </div>
            <ul className="flex-1 p-4 space-y-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
                  >
                    <svg
                      className="w-5 h-5 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d={item.icon}
                      />
                    </svg>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Mobile header — shown on mobile only */}
          <MobileNav />

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-16 md:pt-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}

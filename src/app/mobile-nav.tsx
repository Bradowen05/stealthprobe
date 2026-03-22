"use client";

import Link from "next/link";
import { useState } from "react";
import { navItems } from "./nav-items";

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between bg-zinc-950 border-b border-zinc-800 px-4 py-3">
        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-emerald-400">Stealth</span>Probe
        </h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={
                isOpen
                  ? "M6 18L18 6M6 6l12 12"
                  : "M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              }
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="bg-zinc-950 border-b border-zinc-800 px-4 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 transition-colors"
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
          ))}
        </div>
      )}
    </div>
  );
}

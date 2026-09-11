"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export type TabKey = "open" | "settled" | "retired";

interface DashboardTabsProps {
  tabs: { key: TabKey; label: string; count: number; children: ReactNode }[];
  defaultTab: TabKey;
}

export default function DashboardTabs({ tabs, defaultTab }: DashboardTabsProps) {
  const [active, setActive] = useState<TabKey>(defaultTab);
  const view = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <div>
      <nav
        aria-label="Filter polls"
        className="no-scrollbar flex items-center gap-2 overflow-x-auto border-b-2 border-cream-deep pb-2"
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            aria-pressed={active === t.key}
            onClick={() => setActive(t.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition-colors sm:text-sm ${
              active === t.key
                ? "bg-cocoa text-cream-bright"
                : "text-cocoa-soft hover:bg-cream-deep hover:text-cocoa"
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </nav>
      <h2 className="sr-only">{view.label}</h2>
      <div className="mt-3">{view.children}</div>
    </div>
  );
}
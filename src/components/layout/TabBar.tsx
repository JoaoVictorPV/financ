"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type TabItem = {
  href: string;
  label: string;
};

const tabs: TabItem[] = [
  { href: "/home", label: "Início" },
  { href: "/calendar", label: "Calendário" },
  { href: "/investments", label: "Invest." },
  { href: "/markets", label: "Mercados" },
  { href: "/insights", label: "Insights" },
];

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[var(--bg)]/85 backdrop-blur">
      <div className="mx-auto grid w-full max-w-[520px] grid-cols-5 gap-2 px-4 py-3">
        {tabs.map((t) => {
          const active = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={
                "flex items-center justify-center rounded-2xl px-2 py-3 text-sm font-semibold transition " +
                (active
                  ? "bg-[var(--primary)] text-black"
                  : "bg-[var(--surface)] text-[var(--text)]")
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

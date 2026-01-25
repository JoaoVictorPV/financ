"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";

export default function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const inSettings = pathname?.startsWith("/settings");

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--bg)]/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[520px] items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-xl ring-1 ring-white/10">
            <div className="absolute inset-0 bg-[var(--surface)]" />
            <div className="absolute -left-2 -top-2 h-8 w-8 rounded-full bg-[var(--primary)]/35 blur-[0.5px]" />
            <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-sky-400/25 blur-[0.5px]" />
            <div className="absolute left-1 top-1 h-1.5 w-1.5 rounded-full bg-[var(--primary)]" />
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">Fin.SYS</div>
            <div className="mt-1 text-xs text-[var(--muted)] leading-none">
              {pathname?.startsWith("/settings") ? "Configurações" : "Financeiro pessoal"}
            </div>
          </div>
        </div>

        {inSettings ? (
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-xl bg-[var(--surface)] px-3 py-2 text-sm font-medium"
          >
            Voltar
          </button>
        ) : (
          <Link
            href="/settings"
            className="rounded-xl bg-[var(--surface)] px-3 py-2 text-sm font-medium"
          >
            Config
          </Link>
        )}
      </div>
    </header>
  );
}

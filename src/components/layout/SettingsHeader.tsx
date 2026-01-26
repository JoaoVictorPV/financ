"use client";

import { useRouter } from "next/navigation";

export default function SettingsHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[var(--muted)]">{subtitle}</p> : null}
      </div>

      <button
        type="button"
        onClick={() => router.back()}
        className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm"
      >
        Voltar
      </button>
    </div>
  );
}

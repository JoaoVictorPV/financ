import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      <header className="mx-auto w-full max-w-[520px] px-4 py-4">
        <h1 className="text-xl font-semibold">Configurações</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Backup, Tags, Cartões, Conta e Recorrências.
        </p>
      </header>

      <main className="mx-auto w-full max-w-[520px] space-y-2 px-4 pb-10">
        <Link className="block rounded-xl bg-[var(--surface)] p-4" href="/settings/backup">
          Backup
        </Link>
        <Link className="block rounded-xl bg-[var(--surface)] p-4" href="/settings/tags">
          Tags
        </Link>
        <Link className="block rounded-xl bg-[var(--surface)] p-4" href="/settings/cards">
          Cartões
        </Link>
        <Link className="block rounded-xl bg-[var(--surface)] p-4" href="/settings/account">
          Conta / Saldo
        </Link>
        <Link className="block rounded-xl bg-[var(--surface)] p-4" href="/settings/recurring">
          Recorrências
        </Link>
        <Link className="block rounded-xl bg-[var(--surface)] p-4" href="/settings/about">
          Sobre
        </Link>
      </main>
    </div>
  );
}

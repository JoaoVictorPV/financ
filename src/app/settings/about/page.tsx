import SettingsHeader from "@/components/layout/SettingsHeader";

export default function AboutSettingsPage() {
  return (
    <div className="min-h-dvh bg-[var(--bg)] px-4 py-4 text-[var(--text)]">
      <div className="mx-auto w-full max-w-[520px] space-y-4">
        <SettingsHeader title="Sobre" subtitle="Fin.SYS — aplicativo pessoal de finanças." />

        <div className="rounded-2xl border border-white/10 bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
          Versão inicial em evolução contínua.
        </div>
      </div>
    </div>
  );
}

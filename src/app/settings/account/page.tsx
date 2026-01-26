import SettingsHeader from "@/components/layout/SettingsHeader";

export default function AccountSettingsPage() {
  return (
    <div className="min-h-dvh bg-[var(--bg)] px-4 py-4 text-[var(--text)]">
      <div className="mx-auto w-full max-w-[520px] space-y-4">
        <SettingsHeader
          title="Conta / Saldo"
          subtitle="O saldo é manual e serve como referência para análises."
        />

        <div className="rounded-2xl border border-white/10 bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
          Dica: o ajuste do saldo atual fica na aba <b>Início</b> (Tela 1).
        </div>
      </div>
    </div>
  );
}

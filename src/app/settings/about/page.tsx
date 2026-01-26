import SettingsHeader from "@/components/layout/SettingsHeader";

export default function AboutSettingsPage() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-dvh bg-[var(--bg)] px-4 py-4 text-[var(--text)]">
      <div className="mx-auto w-full max-w-[520px] space-y-4">
        <SettingsHeader title="Sobre" subtitle="Fin.SYS — aplicativo pessoal de finanças." />

        <div className="rounded-2xl border border-white/10 bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
          <div className="space-y-2">
            <div className="text-[var(--text)] font-semibold">Fin.SYS</div>
            <div>
              Feito por <b>João Victor Pruner Vieira</b> em <b>{today}</b>, utilizando IA.
            </div>
            <div>
              <b>Para que serve:</b> registrar despesas/entradas rapidamente, controlar cartão e recorrências,
              e visualizar análises no calendário e nos gráficos.
            </div>
            <div>
              <b>Como usar (bem rápido):</b> use a aba <b>Início</b> para lançar e atualizar o saldo, a aba
              <b> Calendário</b> para acompanhar vencimentos e pagamentos, e <b>Insights</b> para ver gráficos.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

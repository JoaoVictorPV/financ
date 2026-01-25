import RecurringManager from "@/features/recurring/components/RecurringManager";

export default function RecurringSettingsPage() {
  return (
    <div className="min-h-dvh bg-[var(--bg)] px-4 py-4 text-[var(--text)]">
      <div className="mx-auto w-full max-w-[520px] space-y-4">
        <div>
          <h1 className="text-xl font-semibold">Recorrências</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Modelos para projeção (mensal, semanal, anual). Não cria transação automaticamente.
          </p>
        </div>
        <RecurringManager />
      </div>
    </div>
  );
}



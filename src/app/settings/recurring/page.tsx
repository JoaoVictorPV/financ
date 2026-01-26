import RecurringManager from "@/features/recurring/components/RecurringManager";
import SettingsHeader from "@/components/layout/SettingsHeader";

export default function RecurringSettingsPage() {
  return (
    <div className="min-h-dvh bg-[var(--bg)] px-4 py-4 text-[var(--text)]">
      <div className="mx-auto w-full max-w-[520px] space-y-4">
        <SettingsHeader
          title="Recorrências"
          subtitle="Modelos para projeção (mensal, semanal, anual). Não cria transação automaticamente."
        />
        <RecurringManager />
      </div>
    </div>
  );
}




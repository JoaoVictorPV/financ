import CardsManager from "@/features/credit-cards/components/CardsManager";
import SettingsHeader from "@/components/layout/SettingsHeader";

export default function CardsSettingsPage() {
  return (
    <div className="min-h-dvh bg-[var(--bg)] px-4 py-4 text-[var(--text)]">
      <div className="mx-auto w-full max-w-[520px] space-y-4">
        <SettingsHeader
          title="Cartões"
          subtitle="Cadastre cartões, compras parceladas e registre pagamentos de fatura (integral)."
        />

        <CardsManager />
      </div>
    </div>
  );
}




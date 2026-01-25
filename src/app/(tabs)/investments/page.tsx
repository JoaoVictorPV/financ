import InvestmentsManager from "@/features/investments/components/InvestmentsManager";
import MarketPanel from "@/features/market/components/MarketPanel";

export default function InvestmentsPage() {
  return (
    <div className="space-y-4">
      <InvestmentsManager />
      <MarketPanel />
    </div>
  );
}



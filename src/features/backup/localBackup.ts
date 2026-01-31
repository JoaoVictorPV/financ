import type { LocalSnapshot } from "@/state/utils/localPersistence";
import type { BackupV1 } from "@/features/backup/schema";

export function snapshotToBackup(snapshot: LocalSnapshot): BackupV1 {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    profile: {
      currency: "BRL",
      timezone: "America/Sao_Paulo",
    },
    tags: snapshot.tags,
    incomeSources: snapshot.incomeSources,
    cardTags: snapshot.cardTags,
    account: snapshot.account,
    transactions: snapshot.transactions,
    creditCards: snapshot.creditCards,
    cardPurchases: snapshot.cardPurchases,
    installmentPlans: snapshot.installmentPlans,
    cardPayments: snapshot.cardPayments,
    recurringTemplates: snapshot.recurringTemplates,
    investments: snapshot.investments,
    investmentSnapshots: snapshot.investmentSnapshots,
    marketManual: snapshot.marketManual ?? null,
  };
}

export function downloadJson(filename: string, obj: unknown) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

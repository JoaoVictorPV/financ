"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { useAppStore } from "@/state/useAppStore";
import { loadAllLocal } from "@/state/utils/localPersistence";
import { downloadJson, snapshotToBackup } from "@/features/backup/localBackup";
import { BackupSchemaV1 } from "@/features/backup/schema";
import type { LocalSnapshot } from "@/state/utils/localPersistence";
import SettingsHeader from "@/components/layout/SettingsHeader";

export default function BackupSettingsPage() {
  const replaceAll = useAppStore((s) => s.replaceAll);
  const [lastExportAt, setLastExportAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filename = useMemo(() => {
    const d = new Date();
    const stamp = d.toISOString().slice(0, 10);
    return `fin-sys-backup-${stamp}.json`;
  }, []);

  async function onExport() {
    setError(null);
    const snap = await loadAllLocal();
    const backup = snapshotToBackup(snap);
    downloadJson(filename, backup);
    setLastExportAt(new Date().toISOString());
  }

  async function onImport(file: File) {
    setError(null);
    const text = await file.text();
    const json = JSON.parse(text);
    const parsed = BackupSchemaV1.safeParse(json);
    if (!parsed.success) {
      setError("Backup inválido (schema)." );
      return;
    }
    // converte para snapshot local
    const b = parsed.data;
    const snap: LocalSnapshot = {
      tags: b.tags as LocalSnapshot["tags"],
      incomeSources: (b.incomeSources ?? []) as LocalSnapshot["incomeSources"],
      cardTags: (b.cardTags ?? []) as LocalSnapshot["cardTags"],
      account: b.account as LocalSnapshot["account"],
      transactions: b.transactions as LocalSnapshot["transactions"],
      creditCards: b.creditCards as LocalSnapshot["creditCards"],
      cardPurchases: (b.cardPurchases ?? []) as LocalSnapshot["cardPurchases"],
      installmentPlans: b.installmentPlans as LocalSnapshot["installmentPlans"],
      cardPayments: b.cardPayments as LocalSnapshot["cardPayments"],
      recurringTemplates: b.recurringTemplates as LocalSnapshot["recurringTemplates"],
      investments: b.investments as LocalSnapshot["investments"],
      investmentSnapshots: b.investmentSnapshots as LocalSnapshot["investmentSnapshots"],
    };
    await replaceAll(snap);
  }

  return (
    <div className="min-h-dvh bg-[var(--bg)] px-4 py-4 text-[var(--text)]">
      <div className="mx-auto w-full max-w-[520px] space-y-4">
        <SettingsHeader
          title="Backup"
          subtitle="Exporte/importa seus dados em JSON. Recomendação: 1x por semana."
        />

        {error ? <div className="text-sm text-[var(--danger)]">{error}</div> : null}

        <Card className="space-y-3">
          <div className="text-base font-semibold">Exportar</div>
          <div className="text-sm text-[var(--muted)]">Arquivo: {filename}</div>
          <Button onClick={() => void onExport()}>Gerar backup agora</Button>
          {lastExportAt ? (
            <div className="text-xs text-[var(--muted)]">Último export: {lastExportAt}</div>
          ) : null}
        </Card>

        <Card className="space-y-3">
          <div className="text-base font-semibold">Importar</div>
          <div className="text-xs text-[var(--muted)]">
            Importação substitui os dados locais atuais.
          </div>
          <input
            type="file"
            accept="application/json"
            className="w-full rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onImport(f);
            }}
          />
        </Card>
      </div>
    </div>
  );
}







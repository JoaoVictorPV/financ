"use client";

import { useMemo, useState } from "react";
import BottomSheet from "@/components/ui/BottomSheet";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAppStore } from "@/state/useAppStore";
import { parseBRLToCents, formatBRLFromCents } from "@/lib/money";
import { todayYMD } from "@/lib/dates";
import TagPicker from "@/components/tags/TagPicker";

function computeInstallmentPreview(pTotal: string, pN: string, pEach: string) {
  const total = parseBRLToCents(pTotal);
  const each = parseBRLToCents(pEach);
  const n = pN.trim() ? Number(pN) : null;

  const hasTotal = total !== null && total > 0;
  const hasEach = each !== null && each > 0;
  const hasN = n !== null && Number.isFinite(n) && n > 0;

  if ((hasTotal ? 1 : 0) + (hasEach ? 1 : 0) + (hasN ? 1 : 0) < 2) {
    return null;
  }

  let totalC = total ?? 0;
  let nI = n ?? 0;
  let eachC = each ?? 0;

  if (hasTotal && hasN && !hasEach) {
    eachC = Math.round(totalC / nI);
  } else if (hasTotal && hasEach && !hasN) {
    nI = Math.max(1, Math.round(totalC / eachC));
  } else if (hasN && hasEach && !hasTotal) {
    totalC = nI * eachC;
  }

  return { totalC, nI, eachC };
}

export default function CardPurchaseFormSheet({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const cards = useAppStore((s) => s.creditCards);
  const addCardPurchase = useAppStore((s) => s.addCardPurchase);
  const addInstallmentPlan = useAppStore((s) => s.addInstallmentPlan);

  const [cardId, setCardId] = useState<string | null>(null);
  const [date, setDate] = useState(todayYMD());
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<"avista" | "parcelado">("avista");

  // à vista
  const [amount, setAmount] = useState("");

  // parcelado
  const [pTotal, setPTotal] = useState("");
  const [pN, setPN] = useState("");
  const [pEach, setPEach] = useState("");
  const [pTags, setPTags] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => computeInstallmentPreview(pTotal, pN, pEach), [pTotal, pN, pEach]);

  function reset() {
    setCardId(null);
    setDate(todayYMD());
    setDescription("");
    setMode("avista");
    setAmount("");
    setPTotal("");
    setPN("");
    setPEach("");
    setPTags([]);
    setError(null);
  }

  async function onSave() {
    setError(null);
    if (!cardId) {
      setError("Selecione um cartão.");
      return;
    }
    if (!date) {
      setError("Informe a data.");
      return;
    }
    if (!description.trim()) {
      setError("Informe a descrição.");
      return;
    }

    if (mode === "avista") {
      const cents = parseBRLToCents(amount);
      if (!cents || cents <= 0) {
        setError("Informe um valor válido.");
        return;
      }
      await addCardPurchase({
        credit_card_id: cardId,
        date,
        description,
        amount_cents: cents,
        card_tag_ids: [],
      });
    } else {
      if (!preview) {
        setError("Preencha pelo menos 2 campos: total, nº parcelas, valor parcela.");
        return;
      }
      if (preview.nI > 60) {
        setError("Número de parcelas muito alto (máx. 60).");
        return;
      }

      await addInstallmentPlan({
        credit_card_id: cardId,
        total_amount_cents: preview.totalC,
        total_installments: preview.nI,
        installment_amount_cents: preview.eachC,
        start_date: date,
        description,
        tags: pTags,
      });
    }

    reset();
    onClose();
  }

  return (
    <BottomSheet
      open={open}
      onClose={() => {
        reset();
        onClose();
      }}
      title="Nova despesa no cartão"
    >
      <div className="space-y-3">
        <div className="rounded-xl border border-white/10 bg-blue-500/10 p-3 text-sm text-[var(--muted)]">
          Compras no cartão <b>não entram</b> em gastos gerais. O que entra é o <b>pagamento da fatura</b>.
        </div>

        <div className="rounded-xl border border-white/10 bg-black/10 p-3">
          <div className="text-sm font-semibold">Cartão</div>
          <div className="mt-2 space-y-2">
            {cards.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">Nenhum cartão cadastrado ainda. Vá em Config → Cartões.</div>
            ) : (
              cards.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCardId(c.id)}
                  className={
                    "flex w-full items-center justify-between rounded-xl px-3 py-2 " +
                    (cardId === c.id ? "bg-white/10" : "hover:bg-white/5")
                  }
                >
                  <div className="text-sm font-semibold">{c.name}</div>
                  <div className="text-xs text-[var(--muted)]">
                    fecha {c.statement_closing_day}
                    {c.statement_due_day ? ` / vence ${c.statement_due_day}` : ""}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold">Data da compra</div>
          <div className="mt-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold">Descrição</div>
          <div className="mt-2">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Uber, Mercado..." />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            className={
              "rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold " +
              (mode === "avista" ? "bg-[var(--primary)] text-black" : "bg-black/10")
            }
            onClick={() => setMode("avista")}
          >
            À vista
          </button>
          <button
            type="button"
            className={
              "rounded-xl border border-white/10 px-3 py-2 text-sm font-semibold " +
              (mode === "parcelado" ? "bg-[var(--primary)] text-black" : "bg-black/10")
            }
            onClick={() => setMode("parcelado")}
          >
            Parcelado
          </button>
        </div>

        {mode === "avista" ? (
          <div>
            <div className="text-sm font-semibold">Valor</div>
            <div className="mt-2">
              <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="R$ 0,00" />
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-sm font-semibold">Total</div>
                <div className="mt-2">
                  <Input inputMode="decimal" value={pTotal} onChange={(e) => setPTotal(e.target.value)} placeholder="R$ 0,00" />
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold">Nº parcelas</div>
                <div className="mt-2">
                  <Input inputMode="numeric" value={pN} onChange={(e) => setPN(e.target.value)} placeholder="10" />
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold">Parcela</div>
                <div className="mt-2">
                  <Input inputMode="decimal" value={pEach} onChange={(e) => setPEach(e.target.value)} placeholder="R$ 0,00" />
                </div>
              </div>
            </div>

            <div>
              <TagPicker selected={pTags} onChange={setPTags} />
            </div>

            {preview ? (
              <div className="rounded-xl border border-white/10 bg-[var(--surface-2)] p-3">
                <div className="text-sm font-semibold">Resumo</div>
                <div className="mt-1 text-sm text-[var(--muted)]">
                  Total: {formatBRLFromCents(preview.totalC)} • {preview.nI}x de {formatBRLFromCents(preview.eachC)}
                </div>
              </div>
            ) : (
              <div className="text-sm text-[var(--muted)]">
                Preencha pelo menos 2 campos: total, nº parcelas, valor parcela.
              </div>
            )}
          </>
        )}

        {error ? <div className="text-sm text-[var(--danger)]">{error}</div> : null}

        <Button onClick={() => void onSave()}>Salvar</Button>
      </div>
    </BottomSheet>
  );
}

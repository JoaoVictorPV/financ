"use client";

import { useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import BottomSheet from "@/components/ui/BottomSheet";
import Input from "@/components/ui/Input";
import TagPicker from "@/components/tags/TagPicker";
import { useAppStore } from "@/state/useAppStore";
import { formatBRLFromCents, parseBRLToCents } from "@/lib/money";
import { todayYMD } from "@/lib/dates";
import type { CreditCard } from "@/lib/domain/types";
import { buildStatementItems, calcStatementTotalForMonth } from "@/features/credit-cards/domain/statement";
import { monthPrefix } from "@/lib/calendar";

function computeInstallmentPreview(pTotal: string, pN: string, pEach: string) {
  // precisa de 2/3: total, n, each
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

function lastNMonths(n: number): Array<{ year: number; month: number }> {
  const out: Array<{ year: number; month: number }> = [];
  const d = new Date();
  d.setDate(1);
  for (let i = 0; i < n; i++) {
    const x = new Date(d);
    x.setMonth(d.getMonth() - i);
    out.push({ year: x.getFullYear(), month: x.getMonth() + 1 });
  }
  return out;
}

export default function CardsManager() {
  const cards = useAppStore((s) => s.creditCards);
  const plans = useAppStore((s) => s.installmentPlans);
  const transactions = useAppStore((s) => s.transactions);
  const cardPayments = useAppStore((s) => s.cardPayments);
  const addCreditCard = useAppStore((s) => s.addCreditCard);
  const deleteCreditCard = useAppStore((s) => s.deleteCreditCard);
  const addInstallmentPlan = useAppStore((s) => s.addInstallmentPlan);
  const markStatementPaid = useAppStore((s) => s.markStatementPaid);

  const [openAdd, setOpenAdd] = useState(false);
  const [openInstallment, setOpenInstallment] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CreditCard | null>(null);

  const [cardName, setCardName] = useState("");
  const [closingDay, setClosingDay] = useState("10");
  const [dueDay, setDueDay] = useState("15");
  const [brand, setBrand] = useState("");
  const [last4, setLast4] = useState("");

  // Parcelado
  const [pTotal, setPTotal] = useState("");
  const [pN, setPN] = useState("");
  const [pEach, setPEach] = useState("");
  const [pDate, setPDate] = useState(todayYMD());
  const [pDesc, setPDesc] = useState("");
  const [pTags, setPTags] = useState<string[]>([]);
  const tags = useAppStore((s) => s.tags);
  const [openTags, setOpenTags] = useState(false);

  const months = useMemo(() => lastNMonths(6), []);

  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t])), [tags]);

  function statementPaid(cardId: string, year: number, month: number) {
    const id = `${cardId}:${monthPrefix(year, month)}`;
    return cardPayments.some((p) => p.statement_id === id);
  }

  async function onCreateCard() {
    const cd = Number(closingDay);
    const dd = dueDay.trim() ? Number(dueDay) : null;
    if (!cardName.trim()) return;
    if (!Number.isFinite(cd) || cd < 1 || cd > 28) return;
    if (dd !== null && (!Number.isFinite(dd) || dd < 1 || dd > 28)) return;

    await addCreditCard({
      name: cardName,
      statement_closing_day: cd,
      statement_due_day: dd,
      brand: brand.trim() || null,
      last4: last4.trim() || null,
    });

    setCardName("");
    setClosingDay("10");
    setDueDay("15");
    setBrand("");
    setLast4("");
    setOpenAdd(false);
  }

  const installmentPreview = useMemo(
    () => computeInstallmentPreview(pTotal, pN, pEach),
    [pTotal, pN, pEach],
  );

  async function onCreateInstallment() {
    if (!selectedCard) return;
    if (!pDate) return;
    if (!pDesc.trim()) return;
    const x = computeInstallmentPreview(pTotal, pN, pEach);
    if (!x) return;
    if (x.nI > 60) return; // limite simples

    await addInstallmentPlan({
      credit_card_id: selectedCard.id,
      total_amount_cents: x.totalC,
      total_installments: x.nI,
      installment_amount_cents: x.eachC,
      start_date: pDate,
      description: pDesc,
      tags: pTags,
    });

    setPTotal("");
    setPN("");
    setPEach("");
    setPDate(todayYMD());
    setPDesc("");
    setPTags([]);
    setOpenInstallment(false);
  }

  async function onPay(card: CreditCard, year: number, month: number) {
    const total = calcStatementTotalForMonth(card, year, month, transactions, plans);
    if (total <= 0) return;
    await markStatementPaid({
      creditCardId: card.id,
      year,
      month,
      paidAt: todayYMD(),
      amountCents: total,
    });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => setOpenAdd(true)}>
          Novo cartão
        </Button>
        <Button
          onClick={() => {
            if (cards[0]) setSelectedCard(cards[0]);
            setOpenInstallment(true);
          }}
          disabled={cards.length === 0}
        >
          Compra parcelada
        </Button>
      </div>

      <Card className="space-y-3">
        <div className="text-base font-semibold">Cartões cadastrados</div>
        {cards.length === 0 ? (
          <div className="text-sm text-[var(--muted)]">Nenhum cartão ainda.</div>
        ) : (
          <div className="space-y-2">
            {cards.map((c) => (
              <div key={c.id} className="rounded-xl border border-white/10 bg-black/10 p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      fecha dia {c.statement_closing_day}
                      {c.statement_due_day ? ` • vence dia ${c.statement_due_day}` : ""}
                      {c.last4 ? ` • **** ${c.last4}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => void deleteCreditCard(c.id)}
                    className="rounded-xl bg-black/20 px-3 py-2 text-sm text-[var(--danger)] ring-1 ring-white/10"
                  >
                    Remover
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  {months.map(({ year, month }) => {
                    const total = calcStatementTotalForMonth(c, year, month, transactions, plans);
                    const paid = statementPaid(c.id, year, month);
                    return (
                      <button
                        key={`${c.id}-${year}-${month}`}
                        className={
                          "rounded-xl border border-white/10 px-2 py-2 text-left " +
                          (paid ? "bg-[var(--primary)]/15" : "bg-black/10")
                        }
                        onClick={() => setSelectedCard(c)}
                      >
                        <div className="text-xs text-[var(--muted)]">
                          {String(month).padStart(2, "0")}/{year}
                        </div>
                        <div className="text-sm font-semibold">{formatBRLFromCents(total)}</div>
                        <div className={"mt-1 text-[10px] " + (paid ? "text-[var(--primary)]" : "text-[var(--muted)]")}>
                          {paid ? "Pago" : "Aberto"}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedCard ? (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-semibold">Faturas — {selectedCard.name}</div>
              <div className="text-xs text-[var(--muted)]">Últimos 6 meses</div>
            </div>
            <button
              className="rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-sm"
              onClick={() => setSelectedCard(null)}
            >
              Fechar
            </button>
          </div>

          <div className="space-y-2">
            {months.map(({ year, month }) => {
              const total = calcStatementTotalForMonth(selectedCard, year, month, transactions, plans);
              const paid = statementPaid(selectedCard.id, year, month);
              const items = buildStatementItems(selectedCard, year, month, transactions, plans);

              return (
                <details key={`${year}-${month}`} className="rounded-xl border border-white/10 bg-black/10 p-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">
                        {String(month).padStart(2, "0")}/{year}
                      </div>
                      <div className="mt-1 text-xs text-[var(--muted)]">{items.length} itens</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold">{formatBRLFromCents(total)}</div>
                      <div className={"mt-1 text-xs " + (paid ? "text-[var(--primary)]" : "text-[var(--muted)]")}>
                        {paid ? "Pago" : "Aberto"}
                      </div>
                    </div>
                  </summary>

                  <div className="mt-3 space-y-2">
                    {!paid ? (
                      <Button size="md" onClick={() => void onPay(selectedCard, year, month)} disabled={total <= 0}>
                        Marcar como pago (integral)
                      </Button>
                    ) : null}

                    <div className="space-y-2">
                      {items.length === 0 ? (
                        <div className="text-sm text-[var(--muted)]">Sem itens nessa fatura.</div>
                      ) : (
                        items.map((it) => {
                          const tnames = it.tags
                            .map((id) => tagMap.get(id)?.name)
                            .filter(Boolean)
                            .join(", ");
                          return (
                            <div key={it.id} className="rounded-xl border border-white/10 bg-black/10 px-3 py-2">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold">{it.description}</div>
                                  <div className="mt-1 text-xs text-[var(--muted)]">
                                    {it.date}
                                    {tnames ? ` • ${tnames}` : ""}
                                    {it.source === "installment" ? " • parcela" : ""}
                                  </div>
                                </div>
                                <div className="text-sm font-bold">{formatBRLFromCents(it.amount_cents)}</div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </Card>
      ) : null}

      <BottomSheet open={openAdd} onClose={() => setOpenAdd(false)} title="Novo cartão">
        <div className="space-y-3">
          <div>
            <div className="text-sm font-semibold">Nome</div>
            <div className="mt-2">
              <Input value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Ex: Nubank" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm font-semibold">Fechamento (dia)</div>
              <div className="mt-2">
                <Input inputMode="numeric" value={closingDay} onChange={(e) => setClosingDay(e.target.value)} />
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">Use 1–28.</div>
            </div>
            <div>
              <div className="text-sm font-semibold">Vencimento (dia)</div>
              <div className="mt-2">
                <Input inputMode="numeric" value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">Opcional.</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-sm font-semibold">Bandeira (opcional)</div>
              <div className="mt-2">
                <Input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Visa / Master" />
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold">Últimos 4 (opcional)</div>
              <div className="mt-2">
                <Input value={last4} onChange={(e) => setLast4(e.target.value)} placeholder="1234" />
              </div>
            </div>
          </div>

          <Button onClick={() => void onCreateCard()}>Salvar cartão</Button>
        </div>
      </BottomSheet>

      <BottomSheet
        open={openInstallment}
        onClose={() => setOpenInstallment(false)}
        title="Compra parcelada"
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-black/10 p-3">
            <div className="text-sm font-semibold">Cartão</div>
            <div className="mt-2 space-y-2">
              {cards.length === 0 ? (
                <div className="text-sm text-[var(--muted)]">Cadastre um cartão primeiro.</div>
              ) : (
                cards.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedCard(c)}
                    className={
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 " +
                      (selectedCard?.id === c.id ? "bg-white/10" : "hover:bg-white/5")
                    }
                  >
                    <div className="text-sm font-semibold">{c.name}</div>
                    <div className="text-xs text-[var(--muted)]">fecha {c.statement_closing_day}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">Descrição</div>
            <div className="mt-2">
              <Input value={pDesc} onChange={(e) => setPDesc(e.target.value)} placeholder="Ex: TV, Viagem..." />
            </div>
          </div>

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
            <div className="text-sm font-semibold">Data da compra</div>
            <div className="mt-2">
              <Input type="date" value={pDate} onChange={(e) => setPDate(e.target.value)} />
            </div>
          </div>

          <button
            type="button"
            className="w-full rounded-xl border border-white/10 bg-black/10 px-4 py-3 text-left"
            onClick={() => setOpenTags(true)}
          >
            <div className="text-sm font-semibold">Tags</div>
            <div className="mt-1 text-xs text-[var(--muted)]">
              {pTags.length
                ? pTags.map((id) => tagMap.get(id)?.name).filter(Boolean).join(", ")
                : "Selecionar"}
            </div>
          </button>

          {installmentPreview ? (
            <div className="rounded-xl border border-white/10 bg-[var(--surface-2)] p-3">
              <div className="text-sm font-semibold">Resumo</div>
              <div className="mt-1 text-sm text-[var(--muted)]">
                Total: {formatBRLFromCents(installmentPreview.totalC)} • {installmentPreview.nI}x de {formatBRLFromCents(installmentPreview.eachC)}
              </div>
            </div>
          ) : (
            <div className="text-sm text-[var(--muted)]">
              Preencha pelo menos 2 campos: total, nº parcelas, valor parcela.
            </div>
          )}

          <Button
            onClick={() => void onCreateInstallment()}
            disabled={!selectedCard || !installmentPreview || !pDesc.trim()}
          >
            Salvar parcelamento
          </Button>
        </div>
      </BottomSheet>

      <BottomSheet open={openTags} onClose={() => setOpenTags(false)} title="Tags do parcelamento">
        <TagPicker selected={pTags} onChange={setPTags} />
        <div className="mt-4">
          <Button variant="secondary" onClick={() => setOpenTags(false)}>
            Concluir
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

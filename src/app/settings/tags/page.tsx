"use client";

import { useMemo, useState } from "react";
import SettingsHeader from "@/components/layout/SettingsHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import BottomSheet from "@/components/ui/BottomSheet";
import Chip from "@/components/ui/Chip";
import TagIcon from "@/components/tags/TagIcon";
import { useAppStore } from "@/state/useAppStore";

const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
  "#14b8a6",
  "#94a3b8",
];

const ICONS = [
  "home",
  "building",
  "receipt",
  "bolt",
  "wifi",
  "phone",
  "shopping-cart",
  "car",
  "heart",
  "book",
  "repeat",
  "credit-card",
];

export default function TagsSettingsPage() {
  const tags = useAppStore((s) => s.tags);
  const addTag = useAppStore((s) => s.addTag);
  const updateTag = useAppStore((s) => s.updateTag);
  const deleteTag = useAppStore((s) => s.deleteTag);

  const [q, setQ] = useState("");
  const [openNew, setOpenNew] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // form (novo/editar)
  const [name, setName] = useState("");
  const [type, setType] = useState<"expense" | "income" | "both">("expense");
  const [color, setColor] = useState(COLORS[0]!);
  const [icon, setIcon] = useState(ICONS[0]!);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [...tags].sort((a, b) => a.name.localeCompare(b.name));
    return [...tags]
      .filter((t) => t.name.toLowerCase().includes(needle))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [q, tags]);

  function resetForm() {
    setName("");
    setType("expense");
    setColor(COLORS[0]!);
    setIcon(ICONS[0]!);
    setError(null);
  }

  function openNewTag() {
    resetForm();
    setOpenNew(true);
  }

  function openEditTag(id: string) {
    const t = tags.find((x) => x.id === id);
    if (!t) return;
    setEditingId(id);
    setName(t.name);
    setType(t.type);
    setColor(t.color);
    setIcon(t.icon ?? "repeat");
    setError(null);
    setOpenEdit(true);
  }

  async function onCreate() {
    setError(null);
    if (!name.trim()) {
      setError("Informe um nome.");
      return;
    }
    const exists = tags.some((t) => t.name.trim().toLowerCase() === name.trim().toLowerCase());
    if (exists) {
      setError("Já existe uma tag com esse nome.");
      return;
    }
    await addTag({ name, type, color, icon });
    setOpenNew(false);
    resetForm();
  }

  async function onSaveEdit() {
    setError(null);
    if (!editingId) return;
    if (!name.trim()) {
      setError("Informe um nome.");
      return;
    }
    await updateTag(editingId, { name, type, color, icon });
    setOpenEdit(false);
    setEditingId(null);
    resetForm();
  }

  async function onDelete() {
    if (!editingId) return;
    await deleteTag(editingId);
    setOpenEdit(false);
    setEditingId(null);
    resetForm();
  }

  return (
    <div className="min-h-dvh bg-[var(--bg)] px-4 py-4 text-[var(--text)]">
      <div className="mx-auto w-full max-w-[520px] space-y-4">
        <SettingsHeader
          title="Tags"
          subtitle="Criar/editar tags (nome, cor e ícone)."
        />

        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar tag..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button
            type="button"
            onClick={openNewTag}
            className="whitespace-nowrap rounded-xl bg-[var(--primary)] px-4 py-3 text-base font-semibold text-black"
          >
            + Nova
          </button>
        </div>

        <Card className="space-y-2">
          <div className="flex items-baseline justify-between">
            <div className="text-base font-semibold">Suas tags</div>
            <div className="text-sm text-[var(--muted)]">{filtered.length}</div>
          </div>
          <div className="space-y-2">
            {filtered.length === 0 ? (
              <div className="text-sm text-[var(--muted)]">Nenhuma tag encontrada.</div>
            ) : (
              filtered.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => openEditTag(t.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/10 px-3 py-3 text-left"
                >
                  <div className="flex items-center gap-3">
                    <TagIcon tag={t} />
                    <div>
                      <div className="text-sm font-semibold">{t.name}</div>
                      <div className="mt-1 text-xs text-[var(--muted)]">{t.type}</div>
                    </div>
                  </div>
                  <div className="text-xs text-[var(--muted)]">Editar</div>
                </button>
              ))
            )}
          </div>
        </Card>

        <BottomSheet
          open={openNew}
          onClose={() => {
            setOpenNew(false);
            resetForm();
          }}
          title="Nova tag"
        >
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold">Nome</div>
              <div className="mt-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Academia" />
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Tipo</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {([
                  { id: "expense", label: "Despesa" },
                  { id: "income", label: "Entrada" },
                  { id: "both", label: "Ambos" },
                ] as const).map((x) => (
                  <Chip
                    key={x.id}
                    type="button"
                    active={type === x.id}
                    color="var(--primary)"
                    onClick={() => setType(x.id)}
                  >
                    {x.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Cor</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={
                      "h-9 w-9 rounded-xl ring-1 ring-white/10 " +
                      (color === c ? "outline outline-2 outline-[var(--primary)]" : "")
                    }
                    style={{ backgroundColor: c }}
                    aria-label={`cor ${c}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Ícone (texto)</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {ICONS.map((ic) => (
                  <Chip
                    key={ic}
                    type="button"
                    active={icon === ic}
                    color={color}
                    onClick={() => setIcon(ic)}
                  >
                    {ic}
                  </Chip>
                ))}
              </div>
            </div>

            {error ? <div className="text-sm text-[var(--danger)]">{error}</div> : null}

            <Button onClick={() => void onCreate()}>Salvar tag</Button>
          </div>
        </BottomSheet>

        <BottomSheet
          open={openEdit}
          onClose={() => {
            setOpenEdit(false);
            setEditingId(null);
            resetForm();
          }}
          title="Editar tag"
        >
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold">Nome</div>
              <div className="mt-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Tipo</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {([
                  { id: "expense", label: "Despesa" },
                  { id: "income", label: "Entrada" },
                  { id: "both", label: "Ambos" },
                ] as const).map((x) => (
                  <Chip
                    key={x.id}
                    type="button"
                    active={type === x.id}
                    color="var(--primary)"
                    onClick={() => setType(x.id)}
                  >
                    {x.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Cor</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={
                      "h-9 w-9 rounded-xl ring-1 ring-white/10 " +
                      (color === c ? "outline outline-2 outline-[var(--primary)]" : "")
                    }
                    style={{ backgroundColor: c }}
                    aria-label={`cor ${c}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold">Ícone (texto)</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {ICONS.map((ic) => (
                  <Chip
                    key={ic}
                    type="button"
                    active={icon === ic}
                    color={color}
                    onClick={() => setIcon(ic)}
                  >
                    {ic}
                  </Chip>
                ))}
              </div>
            </div>

            {error ? <div className="text-sm text-[var(--danger)]">{error}</div> : null}

            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => void onSaveEdit()}>Salvar</Button>
              <Button variant="danger" onClick={() => void onDelete()}>
                Apagar
              </Button>
            </div>
          </div>
        </BottomSheet>
      </div>
    </div>
  );
}

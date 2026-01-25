"use client";

import { useMemo, useState } from "react";
import { useAppStore } from "@/state/useAppStore";
import Input from "@/components/ui/Input";
import Chip from "@/components/ui/Chip";
import Button from "@/components/ui/Button";
import TagIcon from "@/components/tags/TagIcon";

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
];

export default function TagPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const tags = useAppStore((s) => s.tags);
  const addTag = useAppStore((s) => s.addTag);
  const transactions = useAppStore((s) => s.transactions);

  const [q, setQ] = useState("");
  const [creating, setCreating] = useState(false);
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newIcon, setNewIcon] = useState(ICONS[0]);

  const usageRank = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tx of transactions) {
      for (const t of tx.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return counts;
  }, [transactions]);

  const topTags = useMemo(() => {
    const sorted = [...tags].sort((a, b) => (usageRank.get(b.id) ?? 0) - (usageRank.get(a.id) ?? 0));
    return sorted.slice(0, 8);
  }, [tags, usageRank]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return tags;
    return tags.filter((t) => t.name.toLowerCase().includes(needle));
  }, [q, tags]);

  const exactExists = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return tags.some((t) => t.name.trim().toLowerCase() === needle);
  }, [q, tags]);

  function toggle(id: string) {
    if (selected.includes(id)) onChange(selected.filter((x) => x !== id));
    else onChange([...selected, id]);
  }

  async function createNew() {
    const name = q.trim();
    if (!name) return;
    const created = await addTag({ name, type: "both", color: newColor, icon: newIcon });
    onChange([...selected, created.id]);
    setCreating(false);
    setQ("");
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="text-sm font-semibold">Tags</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {topTags.map((t) => (
            <Chip
              key={t.id}
              type="button"
              active={selected.includes(t.id)}
              color={t.color}
              onClick={() => toggle(t.id)}
            >
              {t.name}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <Input
          placeholder="Buscar ou criar tag..."
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setCreating(false);
          }}
        />
      </div>

      {!exactExists && q.trim() ? (
        <div className="rounded-xl border border-white/10 bg-[var(--surface-2)] p-3">
          {!creating ? (
            <Button variant="secondary" size="md" onClick={() => setCreating(true)}>
              Criar tag “{q.trim()}”
            </Button>
          ) : (
            <div className="space-y-3">
              <div className="text-sm font-semibold">Nova tag: {q.trim()}</div>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={
                      "h-8 w-8 rounded-xl ring-1 ring-white/10 " +
                      (newColor === c ? "outline outline-2 outline-[var(--primary)]" : "")
                    }
                    style={{ backgroundColor: c }}
                    aria-label={`cor ${c}`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {ICONS.map((ic) => (
                  <Chip
                    key={ic}
                    type="button"
                    active={newIcon === ic}
                    color={newColor}
                    onClick={() => setNewIcon(ic)}
                  >
                    {ic}
                  </Chip>
                ))}
              </div>
              <Button onClick={createNew}>Salvar tag</Button>
            </div>
          )}
        </div>
      ) : null}

      <div className="max-h-56 space-y-2 overflow-auto rounded-xl border border-white/10 bg-black/10 p-2">
        {filtered.map((t) => (
          <button
            type="button"
            key={t.id}
            onClick={() => toggle(t.id)}
            className={
              "flex w-full items-center justify-between rounded-xl px-3 py-2 transition " +
              (selected.includes(t.id) ? "bg-white/10" : "hover:bg-white/5")
            }
          >
            <div className="flex items-center gap-3">
              <TagIcon tag={t} />
              <div className="text-sm font-semibold">{t.name}</div>
            </div>
            <div className="text-xs text-[var(--muted)]">
              {selected.includes(t.id) ? "Selecionada" : ""}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

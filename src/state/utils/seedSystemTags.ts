import type { LocalSnapshot } from "@/state/utils/localPersistence";
import type { Tag } from "@/lib/domain/types";
import { uuid } from "@/lib/ids";

const SYSTEM_TAGS: Array<Pick<Tag, "name" | "type" | "color" | "icon">> = [
  { name: "Imposto de Renda", type: "expense", color: "#f59e0b", icon: "receipt" },
  { name: "Aluguel", type: "expense", color: "#a855f7", icon: "home" },
  { name: "Condomínio", type: "expense", color: "#3b82f6", icon: "building" },
  { name: "Luz", type: "expense", color: "#fbbf24", icon: "bolt" },
  { name: "Gás", type: "expense", color: "#fb7185", icon: "flame" },
  { name: "Internet", type: "expense", color: "#06b6d4", icon: "wifi" },
  { name: "Telefone", type: "expense", color: "#22c55e", icon: "phone" },
  { name: "Diarista", type: "expense", color: "#14b8a6", icon: "sparkles" },
  { name: "Recorrentes", type: "both", color: "#94a3b8", icon: "repeat" },
  { name: "Mercado", type: "expense", color: "#84cc16", icon: "shopping-cart" },
  { name: "Transporte", type: "expense", color: "#38bdf8", icon: "car" },
  { name: "Saúde", type: "expense", color: "#f43f5e", icon: "heart" },
  { name: "Lazer", type: "expense", color: "#8b5cf6", icon: "gamepad" },
  { name: "Educação", type: "expense", color: "#0ea5e9", icon: "book" },
];

export async function seedSystemTags(snapshot: LocalSnapshot): Promise<LocalSnapshot> {
  if (snapshot.tags.length) return snapshot;

  const now = new Date().toISOString();

  const tags: Tag[] = SYSTEM_TAGS.map((t) => ({
    id: uuid(),
    user_id: "local",
    name: t.name,
    type: t.type,
    color: t.color,
    icon: t.icon,
    is_system: true,
    created_at: now,
    updated_at: now,
  }));

  // Garante campos novos (v2) sem quebrar backups antigos.
  return {
    ...snapshot,
    tags,
    incomeSources: snapshot.incomeSources ?? [],
    cardTags: snapshot.cardTags ?? [],
    cardPurchases: snapshot.cardPurchases ?? [],
  };
}

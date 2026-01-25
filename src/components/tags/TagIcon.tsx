import type { Tag } from "@/lib/domain/types";

export default function TagIcon({ tag }: { tag: Tag }) {
  const letter = tag.name.trim().slice(0, 1).toUpperCase();
  return (
    <div
      className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold text-black"
      style={{ backgroundColor: tag.color }}
      title={tag.icon ?? ""}
    >
      {letter}
    </div>
  );
}

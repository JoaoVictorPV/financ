import SettingsHeader from "@/components/layout/SettingsHeader";

export default function TagsSettingsPage() {
  return (
    <div className="min-h-dvh bg-[var(--bg)] px-4 py-4 text-[var(--text)]">
      <div className="mx-auto w-full max-w-[520px] space-y-4">
        <SettingsHeader
          title="Tags"
          subtitle="Criar/editar tags (nome, cor e ícone)."
        />

        <div className="rounded-2xl border border-white/10 bg-[var(--surface)] p-4 text-sm text-[var(--muted)]">
          MVP em construção: em breve terá gerenciamento completo de tags.
        </div>
      </div>
    </div>
  );
}

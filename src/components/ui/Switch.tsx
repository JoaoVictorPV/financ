"use client";

export default function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-black/10 px-4 py-3"
    >
      <span className="text-sm font-semibold">{label}</span>
      <span
        className={
          "relative inline-flex h-6 w-11 items-center rounded-full transition " +
          (checked ? "bg-[var(--primary)]" : "bg-white/15")
        }
      >
        <span
          className={
            "inline-block h-5 w-5 transform rounded-full bg-black/70 transition " +
            (checked ? "translate-x-5" : "translate-x-1")
          }
        />
      </span>
    </button>
  );
}

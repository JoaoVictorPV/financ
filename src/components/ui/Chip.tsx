"use client";

import type { ButtonHTMLAttributes } from "react";

export default function Chip({
  active,
  color,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  color?: string;
}) {
  return (
    <button
      {...props}
      className={
        "rounded-full px-3 py-2 text-sm font-semibold transition " +
        (active
          ? "text-black"
          : "border border-white/10 bg-[var(--surface-2)] text-[var(--text)]") +
        " " +
        className
      }
      style={
        active
          ? {
              backgroundColor: color ?? "var(--primary)",
            }
          : undefined
      }
    />
  );
}

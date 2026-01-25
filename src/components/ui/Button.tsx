"use client";

import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

export default function Button({
  variant = "primary",
  size = "lg",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  const base =
    "w-full rounded-xl font-semibold transition disabled:opacity-60 disabled:cursor-not-allowed";
  const sizes = {
    md: "px-4 py-2 text-sm",
    lg: "px-4 py-3 text-base",
  }[size];

  const variants: Record<Variant, string> = {
    primary: "bg-[var(--primary)] text-black",
    secondary: "bg-[var(--surface)] text-[var(--text)] border border-white/10",
    ghost: "bg-transparent text-[var(--text)] border border-white/10",
    danger: "bg-[var(--danger)] text-white",
  };

  return (
    <button
      {...props}
      className={`${base} ${sizes} ${variants[variant]} ${className}`}
    />
  );
}

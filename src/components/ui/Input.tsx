"use client";

import type { InputHTMLAttributes } from "react";

export default function Input({
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "w-full rounded-xl bg-black/20 px-4 py-3 text-base outline-none ring-1 ring-white/10 focus:ring-[var(--primary)] " +
        className
      }
    />
  );
}

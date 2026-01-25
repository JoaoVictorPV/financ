"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginClient() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/home";

  const supabase = useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!supabase) {
      setStatus("error");
      setErrorMsg(
        "Supabase ainda não configurado. Crie um arquivo .env.local com as variáveis do .env.example.",
      );
      return;
    }

    if (!email.trim()) {
      setStatus("error");
      setErrorMsg("Informe seu e-mail.");
      return;
    }

    setStatus("sending");

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const emailRedirectTo = `${siteUrl}/auth/callback?redirect=${encodeURIComponent(redirectTo)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo },
    });

    if (error) {
      setStatus("error");
      setErrorMsg(error.message);
      return;
    }

    setStatus("sent");
  }

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto w-full max-w-[520px] px-4 py-10">
        <div className="mb-6">
          <div className="text-2xl font-semibold">Fin.SYS</div>
          <div className="mt-1 text-sm text-[var(--muted)]">
            Login por e-mail (magic link)
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-2xl border border-white/10 bg-[var(--surface)] p-4"
        >
          <label className="block text-sm font-medium">E-mail</label>
          <input
            className="mt-2 w-full rounded-xl bg-black/20 px-4 py-3 text-base outline-none ring-1 ring-white/10 focus:ring-[var(--primary)]"
            inputMode="email"
            autoComplete="email"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {errorMsg ? (
            <div className="mt-3 text-sm text-[var(--danger)]">{errorMsg}</div>
          ) : null}

          {status === "sent" ? (
            <div className="mt-3 rounded-xl bg-[var(--primary)]/15 px-4 py-3 text-sm">
              Link enviado! Abra seu e-mail e clique para entrar.
            </div>
          ) : null}

          <button
            type="submit"
            disabled={status === "sending"}
            className="mt-4 w-full rounded-xl bg-[var(--primary)] px-4 py-3 text-base font-semibold text-black disabled:opacity-60"
          >
            {status === "sending" ? "Enviando..." : "Enviar link"}
          </button>
        </form>

        <div className="mt-6 text-xs text-[var(--muted)]">
          Se você ainda não configurou o Supabase, siga o arquivo PLANO_FIN_SYS.md.
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";

type Props = {
  onLogin?: () => void;
};

export default function LoginClient({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Erro ao logar");
      }

      localStorage.setItem("fin_auth_token", data.token);
      onLogin?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-[var(--bg)] text-[var(--text)] px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-[var(--surface)] p-6"
      >
        <div className="text-2xl font-semibold mb-4">Fin.SYS</div>

        <input
          placeholder="Usuário"
          className="w-full mb-3 rounded-xl bg-black/20 px-4 py-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          className="w-full mb-3 rounded-xl bg-black/20 px-4 py-3"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div className="text-sm text-red-400 mb-2">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-[var(--primary)] py-3 font-semibold text-black"
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
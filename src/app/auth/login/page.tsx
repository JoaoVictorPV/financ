import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
          <div className="mx-auto w-full max-w-[520px] px-4 py-10">
            <div className="text-sm text-[var(--muted)]">Carregando...</div>
          </div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}

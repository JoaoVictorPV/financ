"use client";

import { useEffect } from "react";
import { useAppStore } from "@/state/useAppStore";
import { snapshotFromStoreForSync } from "@/state/useAppStore";
import { getLastRemoteAt, pullRemoteSnapshot, pushRemoteSnapshot, setLastRemoteAt } from "@/features/sync/client/syncClient";

const KEY_SUPPRESS_PUSH_UNTIL = "finSys.sync.suppressPushUntil";

function suppressPushFor(ms: number) {
  try {
    localStorage.setItem(KEY_SUPPRESS_PUSH_UNTIL, String(Date.now() + ms));
  } catch {
    // ignore
  }
}

function isPushSuppressed(): boolean {
  try {
    const raw = localStorage.getItem(KEY_SUPPRESS_PUSH_UNTIL);
    const until = raw ? Number(raw) : 0;
    return Number.isFinite(until) && Date.now() < until;
  } catch {
    return false;
  }
}

/**
 * Ponto único para:
 * - criar dados iniciais (tags do sistema)
 * - carregar dados locais (IndexedDB/localforage)
 * - se Supabase estiver configurado e logado, puxar dados remotos
 */
export default function AppBootstrap() {
  const bootstrap = useAppStore((s) => s.bootstrap);
  const replaceAll = useAppStore((s) => s.replaceAll);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // 1) carrega local (offline-first)
      await bootstrap();
      if (cancelled) return;

      // 2) tenta puxar remoto (se usuário estiver logado)
      // Se estiver deslogado, a API retorna 401 e ignoramos.
      try {
        const remote = await pullRemoteSnapshot();
        if (cancelled) return;
        if (remote.exists) {
          const lastRemoteAt = getLastRemoteAt();
          const remoteIsNewer = !lastRemoteAt || new Date(remote.updated_at) > new Date(lastRemoteAt);
          if (remoteIsNewer) {
            suppressPushFor(3000);
            await replaceAll(remote.snapshot);
            setLastRemoteAt(remote.updated_at);
          }
        } else {
          // Sem snapshot remoto ainda: cria o primeiro a partir do local
          const localSnap = snapshotFromStoreForSync();
          const pushed = await pushRemoteSnapshot(localSnap);
          setLastRemoteAt(pushed.updated_at);
        }
      } catch {
        // Sem Supabase/logado: segue offline
      }

      // 3) loop de pull (política simples e robusta)
      const pullId = window.setInterval(async () => {
        try {
          const remote = await pullRemoteSnapshot();
          if (!remote.exists) return;
          const lastRemoteAt = getLastRemoteAt();
          const remoteIsNewer = !lastRemoteAt || new Date(remote.updated_at) > new Date(lastRemoteAt);
          if (remoteIsNewer) {
            suppressPushFor(3000);
            await replaceAll(remote.snapshot);
            setLastRemoteAt(remote.updated_at);
          }
        } catch {
          // ignore
        }
      }, 5000);

      // 4) loop de push (debounce) - observa mudanças do zustand
      let t: number | null = null;
      const unsubscribe = useAppStore.subscribe(
        () => {
          if (t != null) window.clearTimeout(t);
          t = window.setTimeout(async () => {
            try {
              if (isPushSuppressed()) return;
              const snap = snapshotFromStoreForSync();
              const pushed = await pushRemoteSnapshot(snap);
              setLastRemoteAt(pushed.updated_at);
            } catch {
              // ignore
            }
          }, 1200);
        },
        // sem selector: qualquer alteração gera push (para uso pessoal está ok)
      );

      return () => {
        window.clearInterval(pullId);
        unsubscribe();
        if (t != null) window.clearTimeout(t);
      };
    }

    let cleanup: null | (() => void) = null;
    run().then((c) => {
      if (typeof c === "function") cleanup = c;
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [bootstrap]);

  return null;
}

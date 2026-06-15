"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/state/useAppStore";
import { snapshotFromStoreForSync } from "@/state/useAppStore";
import {
  getLastRemoteAt,
  pullRemoteSnapshot,
  pushRemoteSnapshot,
  setLastRemoteAt,
} from "@/features/sync/client/syncClient";
import { isAuthenticated } from "@/state/utils/localPersistence";
import LoginClient from "@/app/auth/login/LoginClient";

const KEY_SUPPRESS_PUSH_UNTIL = "finSys.sync.suppressPushUntil";

function suppressPushFor(ms: number) {
  try {
    localStorage.setItem(KEY_SUPPRESS_PUSH_UNTIL, String(Date.now() + ms));
  } catch {}
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

export default function AppBootstrap({ children }: { children?: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [auth, setAuth] = useState(false);

  const bootstrap = useAppStore((s) => s.bootstrap);
  const replaceAll = useAppStore((s) => s.replaceAll);

  useEffect(() => {
    const ok = isAuthenticated();
    setAuth(ok);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!auth) return;

    let cancelled = false;

    async function run() {
      await bootstrap();
      if (cancelled) return;

      try {
        const remote = await pullRemoteSnapshot();
        if (cancelled) return;

        if (remote.exists) {
          const lastRemoteAt = getLastRemoteAt();
          const remoteIsNewer =
            !lastRemoteAt || new Date(remote.updated_at) > new Date(lastRemoteAt);

          if (remoteIsNewer) {
            suppressPushFor(3000);
            await replaceAll(remote.snapshot);
            setLastRemoteAt(remote.updated_at);
          }
        } else {
          const localSnap = snapshotFromStoreForSync();
          const pushed = await pushRemoteSnapshot(localSnap);
          setLastRemoteAt(pushed.updated_at);
        }
      } catch {}

      const pullId = window.setInterval(async () => {
        try {
          const remote = await pullRemoteSnapshot();
          if (!remote.exists) return;

          const lastRemoteAt = getLastRemoteAt();
          const remoteIsNewer =
            !lastRemoteAt || new Date(remote.updated_at) > new Date(lastRemoteAt);

          if (remoteIsNewer) {
            suppressPushFor(3000);
            await replaceAll(remote.snapshot);
            setLastRemoteAt(remote.updated_at);
          }
        } catch {}
      }, 5000);

      let t: number | null = null;

      const unsubscribe = useAppStore.subscribe(() => {
        if (t != null) window.clearTimeout(t);

        t = window.setTimeout(async () => {
          try {
            if (isPushSuppressed()) return;

            const snap = snapshotFromStoreForSync();
            const pushed = await pushRemoteSnapshot(snap);
            setLastRemoteAt(pushed.updated_at);
          } catch {}
        }, 1200);
      });

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
  }, [auth, bootstrap, replaceAll]);

  if (!ready) return null;

  if (!auth) {
    return <LoginClient onLogin={() => setAuth(true)} />;
  }

  return <>{children}</>;
}
import type { LocalSnapshot } from "@/state/utils/localPersistence";
import type { SyncPullResponse, SyncPushResponse } from "@/features/sync/domain/types";

const KEY_LAST_REMOTE_AT = "finSys.sync.lastRemoteAt";

function readLastRemoteAt(): string | null {
  try {
    return localStorage.getItem(KEY_LAST_REMOTE_AT);
  } catch {
    return null;
  }
}

function writeLastRemoteAt(v: string) {
  try {
    localStorage.setItem(KEY_LAST_REMOTE_AT, v);
  } catch {
    // ignore
  }
}

export async function pullRemoteSnapshot(): Promise<SyncPullResponse> {
  const res = await fetch("/api/sync/snapshot", { cache: "no-store" });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`SYNC_PULL_FAILED (HTTP ${res.status}) ${txt.slice(0, 140)}`);
  }
  return (await res.json()) as SyncPullResponse;
}

export async function pushRemoteSnapshot(snapshot: LocalSnapshot, updatedAt?: string): Promise<SyncPushResponse> {
  const res = await fetch("/api/sync/snapshot", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ snapshot, updated_at: updatedAt }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`SYNC_PUSH_FAILED (HTTP ${res.status}) ${txt.slice(0, 140)}`);
  }
  return (await res.json()) as SyncPushResponse;
}

export function getLastRemoteAt(): string | null {
  return readLastRemoteAt();
}

export function setLastRemoteAt(v: string) {
  writeLastRemoteAt(v);
}

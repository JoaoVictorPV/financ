import type { LocalSnapshot } from "@/state/utils/localPersistence";

export type SyncPullResponse =
  | { exists: false }
  | {
      exists: true;
      updated_at: string;
      snapshot: LocalSnapshot;
    };

export type SyncPushResponse = {
  ok: true;
  updated_at: string;
};

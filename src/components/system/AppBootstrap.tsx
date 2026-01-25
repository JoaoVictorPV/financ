"use client";

import { useEffect } from "react";
import { useAppStore } from "@/state/useAppStore";

/**
 * Ponto único para:
 * - criar dados iniciais (tags do sistema)
 * - carregar dados locais (IndexedDB/localforage)
 * - se Supabase estiver configurado e logado, puxar dados remotos
 */
export default function AppBootstrap() {
  const bootstrap = useAppStore((s) => s.bootstrap);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  return null;
}

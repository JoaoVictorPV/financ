import type { ReactNode } from "react";
import AppHeader from "@/components/layout/AppHeader";
import TabBar from "@/components/layout/TabBar";
import AppBootstrap from "@/components/system/AppBootstrap";

export default function TabsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text)]">
      <AppBootstrap />
      <AppHeader />
      <main className="mx-auto w-full max-w-[520px] px-4 pb-24 pt-4">
        {children}
      </main>
      <TabBar />
    </div>
  );
}

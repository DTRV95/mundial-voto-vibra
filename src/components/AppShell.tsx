import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import { Shield } from "lucide-react";

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);

  return (
    <div className="relative min-h-screen pb-20">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-gold text-background font-display text-lg">V</span>
            <div className="leading-tight">
              <div className="font-display text-base tracking-wide">VOZ DO MUNDIAL</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Comunidade · Previsões</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin" className="flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold">
                <Shield className="h-3 w-3" /> Admin
              </Link>
            )}
            {!user ? (
              <Link to="/auth" className="rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-background">
                Entrar
              </Link>
            ) : null}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl">{children}</main>
      <BottomNav />
    </div>
  );
}

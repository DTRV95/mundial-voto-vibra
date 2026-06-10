import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";
import { SideNav } from "./SideNav";
import { TopNav } from "./TopNav";
import { Footer } from "./Footer";
import { CookieBanner } from "./CookieBanner";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import { Shield, HelpCircle } from "lucide-react";
import logoSvg from "@/assets/logo.svg";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const loggedIn = !loading && !!user;

  return (
    <div className="relative min-h-screen bg-background">

      {/* Barra tricolor FIFA WC2026 — fixa no topo */}
      <div className="wc-tricolor fixed top-0 left-0 z-50 h-[3px] w-full" />

      {/* Barras laterais decorativas */}
      {!loggedIn && (
        <>
          <div className="hidden md:block fixed left-0 top-0 h-full w-3 z-30"
            style={{ background: "linear-gradient(180deg, #E61D25 0%, #3CAC3B 50%, #2A398D 100%)", opacity: 0.55 }} />
          <div className="hidden md:block fixed right-0 top-0 h-full w-3 z-30"
            style={{ background: "linear-gradient(180deg, #2A398D 0%, #3CAC3B 50%, #E61D25 100%)", opacity: 0.55 }} />
        </>
      )}
      {/* Barra lateral direita quando logged in (esquerda tem a sidebar) */}
      {loggedIn && (
        <div className="hidden md:block fixed right-0 top-0 h-full w-3 z-30"
          style={{ background: "linear-gradient(180deg, #E61D25 0%, #3CAC3B 50%, #2A398D 100%)", opacity: 0.55 }} />
      )}

      {/* ── DESKTOP ──────────────────────────────────────────── */}
      {!loggedIn && (
        <div className="hidden md:block">
          <TopNav />
        </div>
      )}
      {loggedIn && <SideNav />}

      {/* ── MOBILE header ─────────────────────────────────── */}
      <header className="sticky top-[3px] z-40 border-b border-border bg-background/90 backdrop-blur-xl shadow-elegant md:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoSvg} alt="Logo" className="h-8 w-8" />
            <div className="leading-tight">
              <div className="font-display text-base tracking-wide text-foreground">UMA GERAÇÃO</div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">Mundial 2026</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/como-funciona" className="grid h-8 w-8 place-items-center rounded-full border border-border text-muted-foreground hover:border-gold/40 hover:text-gold transition-smooth">
              <HelpCircle className="h-4.5 w-4.5" />
            </Link>
            {user && isAdmin && (
              <Link to="/admin" className="flex items-center gap-1 rounded-full border border-wc-red/30 bg-wc-red/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-wc-red">
                <Shield className="h-3 w-3" /> Admin
              </Link>
            )}
            {user && !isAdmin && (
              <Link to="/perfil" className="grid h-8 w-8 place-items-center rounded-full bg-muted font-display text-sm text-foreground">
                {(user.user_metadata?.display_name ?? user.email ?? "U").charAt(0).toUpperCase()}
              </Link>
            )}
            {!user && (
              <Link to="/auth" className="rounded-full bg-wc-red px-3 py-1.5 text-xs font-bold text-white shadow-gold">
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── CONTEÚDO ─────────────────────────────────────────── */}
      <main className={`pb-24 md:pb-10 ${loggedIn ? "md:ml-56" : ""}`}>
        <div className={`mx-auto ${loggedIn ? "max-w-6xl" : "max-w-7xl"}`}>
          {children}
        </div>
      </main>

      <div className={`${loggedIn ? "md:ml-56" : ""}`}>
        <Footer />
      </div>
      <BottomNav />
      <CookieBanner />
    </div>
  );
}

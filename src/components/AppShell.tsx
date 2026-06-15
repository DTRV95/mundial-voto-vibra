import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BottomNav } from "./BottomNav";
import { SideNav } from "./SideNav";
import { TopNav } from "./TopNav";
import { Footer } from "./Footer";
import { CookieBanner } from "./CookieBanner";
import { UserAvatar } from "./AvatarPicker";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import { useNotifications } from "@/lib/useNotifications";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Shield, HelpCircle } from "lucide-react";
import logoSvg from "@/assets/logo.svg";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const loggedIn = !loading && !!user;
  const { data: notifs } = useNotifications();
  const unreadCount = notifs?.total ?? 0;

  const { data: profile } = useQuery({
    queryKey: ["profile-avatar", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("avatar_url, display_name").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

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
              <Link to="/perfil" className="relative">
                <UserAvatar avatarUrl={profile?.avatar_url} name={profile?.display_name ?? user.email ?? "U"} size={8} className="rounded-full" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-wc-red text-[9px] font-bold text-white ring-1 ring-background">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            )}
            {!user && (
              <Link to="/auth" className="rounded-full bg-wc-red px-3 py-1.5 text-xs font-bold text-white shadow-gold transition-all duration-200 hover:bg-wc-red/80 hover:shadow-[0_4px_14px_oklch(0.54_0.24_27_/_0.55)] hover:-translate-y-px active:translate-y-0 active:scale-95">
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

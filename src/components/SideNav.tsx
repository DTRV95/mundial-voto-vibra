import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarClock, Trophy, Gift, User, Shield, LogOut, Newspaper, Users, HelpCircle } from "lucide-react";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoSvg from "@/assets/logo.svg";
import { useQuery } from "@tanstack/react-query";
import { UserAvatar } from "@/components/AvatarPicker";
import { useUnreadMessages } from "@/lib/useUnreadMessages";

const items = [
  { to: "/",        label: "Home",     icon: Home },
  { to: "/jogos",   label: "Jogos",    icon: CalendarClock },
  { to: "/ligas",   label: "Torneios",    icon: Users },
  { to: "/noticias",label: "Notícias", icon: Newspaper },
  { to: "/rankings",label: "Rankings", icon: Trophy },
  { to: "/premios",       label: "Prémios",       icon: Gift },
  { to: "/como-funciona", label: "Como Funciona", icon: HelpCircle },
  { to: "/perfil",        label: "Perfil",        icon: User },
];

export function SideNav() {
  const { location } = useRouterState();
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Sessão terminada");
  }

  const displayName = user?.user_metadata?.display_name
    ?? user?.user_metadata?.full_name
    ?? user?.email?.split("@")[0]
    ?? "Utilizador";

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("avatar_url,display_name").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: unread } = useUnreadMessages();
  const unreadCount = unread?.total ?? 0;

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 flex-col border-r border-border bg-card z-40 shadow-elegant">

      {/* Stripe tricolor no topo */}
      <div className="wc-tricolor h-[3px] w-full shrink-0" />

      {/* Logo */}
      <div className="px-5 py-4 border-b border-border">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoSvg} alt="Logo" className="h-9 w-9 shrink-0" />
          <div className="leading-tight">
            <div className="font-display text-sm tracking-wide text-foreground">UMA GERAÇÃO</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Comunidade</div>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <Link key={to} to={to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-smooth ${
                active
                  ? "bg-wc-red/15 text-wc-red"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.4 : 1.8} />
              {label}
              {active && <span className="ml-auto h-2 w-2 rounded-full bg-wc-red" />}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-2 border-t border-border" />
            <Link to="/admin"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-smooth ${
                location.pathname.startsWith("/admin")
                  ? "bg-wc-red/15 text-wc-red"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Shield className="h-5 w-5 shrink-0" strokeWidth={1.8} />
              Admin
            </Link>
          </>
        )}
      </nav>

      {/* Instagram */}
      <div className="px-4 pb-2">
        <a
          href="https://instagram.com/umageracao2026"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-smooth hover:border-pink-500/40 hover:text-pink-500"
        >
          <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          @umageracao2026
        </a>
      </div>

      {/* User info */}
      {user ? (
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Link to="/perfil" className="relative shrink-0">
              <UserAvatar avatarUrl={profile?.avatar_url} name={profile?.display_name ?? displayName} size={9} className="rounded-full" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-wc-red text-[9px] font-bold text-white ring-2 ring-background">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{displayName}</p>
              {isAdmin ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-wc-red/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-wc-red">
                  <Shield className="h-2.5 w-2.5" /> Admin
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
              )}
            </div>
          </div>
          <button onClick={signOut}
            className="flex w-full items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-smooth hover:border-wc-red/40 hover:text-wc-red">
            <LogOut className="h-3.5 w-3.5" /> Terminar sessão
          </button>
        </div>
      ) : (
        <div className="border-t border-border p-4">
          <Link to="/auth"
            className="block w-full rounded-xl bg-wc-red py-2.5 text-center text-sm font-bold text-white shadow-gold transition-all duration-200 hover:bg-wc-red/80 hover:shadow-[0_4px_14px_oklch(0.54_0.24_27_/_0.55)] hover:-translate-y-px active:translate-y-0 active:scale-[0.98]">
            Entrar
          </Link>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Vota, compara e vibra.</p>
        </div>
      )}
    </aside>
  );
}

import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarClock, Trophy, Gift, User, Shield, LogOut } from "lucide-react";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const items = [
  { to: "/",         label: "Home",     icon: Home },
  { to: "/jogos",    label: "Jogos",    icon: CalendarClock },
  { to: "/rankings", label: "Rankings", icon: Trophy },
  { to: "/premios",  label: "Prémios",  icon: Gift },
  { to: "/perfil",   label: "Perfil",   icon: User },
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

  const initial = displayName.charAt(0).toUpperCase();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 h-full w-56 flex-col border-r border-border bg-card/60 backdrop-blur-xl z-40">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold font-display text-lg text-background shadow-gold">
            V
          </span>
          <div className="leading-tight">
            <div className="font-display text-sm tracking-wide">VOZ DO MUNDIAL</div>
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
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth ${
                active ? "bg-gold/15 text-gold" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.4 : 1.8} />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="my-2 border-t border-border" />
            <Link to="/admin"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth ${
                location.pathname.startsWith("/admin")
                  ? "bg-gold/15 text-gold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Shield className="h-5 w-5 shrink-0" strokeWidth={1.8} />
              Admin
            </Link>
          </>
        )}
      </nav>

      {/* User info */}
      {user ? (
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary font-display text-base text-foreground">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isAdmin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
                    <Shield className="h-2.5 w-2.5" /> Admin
                  </span>
                )}
                {!isAdmin && (
                  <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={signOut}
            className="flex w-full items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-smooth hover:border-destructive/40 hover:text-destructive">
            <LogOut className="h-3.5 w-3.5" /> Terminar sessão
          </button>
        </div>
      ) : (
        <div className="border-t border-border p-4">
          <Link to="/auth"
            className="block w-full rounded-xl bg-gold py-2.5 text-center text-sm font-semibold text-background shadow-gold transition-smooth hover:scale-[1.02]">
            Entrar
          </Link>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Vota, compara e vibra.</p>
        </div>
      )}
    </aside>
  );
}

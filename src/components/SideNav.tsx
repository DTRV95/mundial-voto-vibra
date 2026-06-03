import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarClock, Trophy, Gift, User, Shield } from "lucide-react";
import { useAuth, useIsAdmin } from "@/lib/useAuth";

const items = [
  { to: "/",        label: "Home",     icon: Home },
  { to: "/jogos",   label: "Jogos",    icon: CalendarClock },
  { to: "/rankings",label: "Rankings", icon: Trophy },
  { to: "/premios", label: "Prémios",  icon: Gift },
  { to: "/perfil",  label: "Perfil",   icon: User },
];

export function SideNav() {
  const { location } = useRouterState();
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-full w-56 flex-col border-r border-border bg-card/60 backdrop-blur-xl z-40">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold font-display text-xl text-background shadow-gold">
            V
          </span>
          <div className="leading-tight">
            <div className="font-display text-sm tracking-wide">VOZ DO MUNDIAL</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Comunidade</div>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth ${
                active
                  ? "bg-gold/15 text-gold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" strokeWidth={active ? 2.4 : 1.8} />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            to="/admin"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-smooth ${
              location.pathname.startsWith("/admin")
                ? "bg-gold/15 text-gold"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Shield className="h-5 w-5 shrink-0" strokeWidth={1.8} />
            Admin
          </Link>
        )}
      </nav>

      {/* Bottom CTA */}
      {!user && (
        <div className="px-4 py-5 border-t border-border">
          <Link
            to="/auth"
            className="block w-full rounded-xl bg-gold py-2.5 text-center text-sm font-semibold text-background shadow-gold transition-smooth hover:scale-[1.02]"
          >
            Entrar
          </Link>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Vota, compara e vibra.
          </p>
        </div>
      )}
    </aside>
  );
}

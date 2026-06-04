import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarClock, Users, Trophy, Newspaper, Gift, Shield } from "lucide-react";
import { useAuth, useIsAdmin } from "@/lib/useAuth";

const items = [
  { to: "/",         label: "Home",     icon: Home },
  { to: "/jogos",    label: "Jogos",    icon: CalendarClock },
  { to: "/noticias", label: "Notícias", icon: Newspaper },
  { to: "/grupos",   label: "Grupos",   icon: Users },
  { to: "/rankings", label: "Rankings", icon: Trophy },
  { to: "/premios",  label: "Prémios",  icon: Gift },
];

export function TopNav() {
  const { location } = useRouterState();
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gold font-display text-lg text-background shadow-gold">
            V
          </span>
          <div className="leading-tight">
            <div className="font-display text-base tracking-wide">UMA GERAÇÃO</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Mundial 2026</div>
          </div>
        </Link>

        {/* Nav links — centro */}
        <nav className="flex items-center gap-1">
          {items.map(({ to, label }) => {
            const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`relative rounded-full px-4 py-2 text-sm font-medium transition-smooth ${
                  active
                    ? "bg-gold/15 text-gold"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {label}
                {active && (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-gold" />
                )}
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-smooth ${
                location.pathname.startsWith("/admin")
                  ? "bg-gold/15 text-gold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </nav>

        {/* CTA direita */}
        <div className="shrink-0">
          <Link
            to="/auth"
            className="rounded-full bg-gold px-5 py-2 text-sm font-bold text-background shadow-gold transition-smooth hover:scale-[1.02]"
          >
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}

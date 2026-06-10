import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarClock, Users, Trophy, Newspaper, Gift, Shield, HelpCircle } from "lucide-react";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import logoSvg from "@/assets/logo.svg";

const items = [
  { to: "/",         label: "Home",     icon: Home },
  { to: "/jogos",    label: "Jogos",    icon: CalendarClock },
  { to: "/ligas",    label: "Torneios",    icon: Users },
  { to: "/noticias", label: "Notícias", icon: Newspaper },
  { to: "/rankings", label: "Rankings", icon: Trophy },
  { to: "/premios",  label: "Prémios",  icon: Gift },
];

export function TopNav() {
  const { location } = useRouterState();
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);

  return (
    <header className="sticky top-[3px] z-40 border-b border-border bg-background/90 backdrop-blur-xl shadow-elegant">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img src={logoSvg} alt="Logo" className="h-9 w-9" />
          <div className="leading-tight">
            <div className="font-display text-base tracking-wide text-foreground">UMA GERAÇÃO</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Mundial 2026</div>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-0.5">
          {items.map(({ to, label }) => {
            const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <Link key={to} to={to}
                className={`relative rounded-full px-4 py-2 text-sm font-semibold transition-smooth ${
                  active
                    ? "bg-wc-red/15 text-wc-red"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                {label}
                {active && (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-wc-red" />
                )}
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/admin"
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-smooth ${
                location.pathname.startsWith("/admin")
                  ? "bg-wc-red/15 text-wc-red"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-2 shrink-0">
          {!user && (
            <Link to="/como-funciona"
              className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold transition-smooth ${
                location.pathname === "/como-funciona"
                  ? "bg-gold/15 text-gold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <HelpCircle className="h-4 w-4" /> Como funciona
            </Link>
          )}
          <Link to="/auth"
            className="rounded-full bg-wc-red px-5 py-2 text-sm font-bold text-white shadow-gold transition-all duration-200 hover:bg-wc-red/80 hover:shadow-[0_4px_14px_oklch(0.54_0.24_27_/_0.55)] hover:-translate-y-px active:translate-y-0 active:scale-95"
          >
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}

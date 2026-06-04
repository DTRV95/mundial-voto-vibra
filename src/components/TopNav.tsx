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
    <header className="sticky top-[3px] z-40 border-b border-gray-200 bg-white/90 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-wc-red font-display text-lg text-white shadow-gold">
            V
          </span>
          <div className="leading-tight">
            <div className="font-display text-base tracking-wide text-gray-900">UMA GERAÇÃO</div>
            <div className="text-[10px] uppercase tracking-widest text-gray-400">Mundial 2026</div>
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
                    ? "bg-red-50 text-wc-red"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
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
                  ? "bg-red-50 text-wc-red"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
        </nav>

        {/* CTA */}
        <div className="shrink-0">
          <Link to="/auth"
            className="rounded-full bg-wc-red px-5 py-2 text-sm font-bold text-white shadow-gold transition-smooth hover:scale-[1.02]"
          >
            Entrar
          </Link>
        </div>
      </div>
    </header>
  );
}

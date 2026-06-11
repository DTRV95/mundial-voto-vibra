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
          <a
            href="https://instagram.com/umageracao2026"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-muted-foreground transition-smooth hover:text-pink-500"
          >
            <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
          </a>
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

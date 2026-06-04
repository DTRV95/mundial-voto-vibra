import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarClock, Trophy, Newspaper, User } from "lucide-react";

const items = [
  { to: "/",          label: "Home",      icon: Home },
  { to: "/jogos",     label: "Jogos",     icon: CalendarClock },
  { to: "/noticias",  label: "Notícias",  icon: Newspaper },
  { to: "/rankings",  label: "Rankings",  icon: Trophy },
  { to: "/perfil",    label: "Perfil",    icon: User },
];

export function BottomNav() {
  const { location } = useRouterState();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <li key={to}>
              <Link
                to={to}
                className={`relative flex flex-col items-center gap-1 py-3 text-[11px] font-semibold tracking-wide uppercase transition-smooth ${
                  active ? "text-gold" : "text-muted-foreground"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-gold" />
                )}
                <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.6} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

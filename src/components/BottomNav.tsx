import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarClock, Trophy, Users, User } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useNotifications } from "@/lib/useNotifications";
import { UserAvatar } from "@/components/AvatarPicker";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef } from "react";

const NAV_ITEMS = [
  { to: "/",         label: "Home",     icon: Home },
  { to: "/jogos",    label: "Jogos",    icon: CalendarClock },
  { to: "/ligas",    label: "Torneios", icon: Users },
  { to: "/rankings", label: "Rankings", icon: Trophy },
];

function NavItem({ to, label, icon: Icon, active }: { to: string; label: string; icon: React.ElementType; active: boolean }) {
  const prevActive = useRef(false);
  const justActivated = active && !prevActive.current;
  prevActive.current = active;

  return (
    <li>
      <Link to={to}
        className={`relative flex flex-col items-center gap-1 py-3 text-[10px] font-bold tracking-wide uppercase transition-smooth ${
          active ? "text-wc-red" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {active && (
          <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-wc-red animate-scale-in" />
        )}
        <span className={justActivated ? "animate-nav-pop" : ""}>
          <Icon className={`h-6 w-6 transition-all duration-200 ${active ? "drop-shadow-[0_0_6px_oklch(0.54_0.24_27/0.6)]" : ""}`}
            strokeWidth={active ? 2.4 : 1.6} />
        </span>
        <span>{label}</span>
      </Link>
    </li>
  );
}

export function BottomNav() {
  const { location } = useRouterState();
  const { user } = useAuth();
  const { data: notifs } = useNotifications();
  const unreadCount = notifs?.total ?? 0;
  const profileActive = location.pathname.startsWith("/perfil");
  const prevProfileActive = useRef(false);
  const profileJustActivated = profileActive && !prevProfileActive.current;
  prevProfileActive.current = profileActive;

  const { data: profile } = useQuery({
    queryKey: ["profile-avatar", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("avatar_url, display_name").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border/60 bg-card/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden"
      style={{ boxShadow: "0 -4px 24px oklch(0 0 0 / 0.18)" }}>
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV_ITEMS.map(({ to, label, icon }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return <NavItem key={to} to={to} label={label} icon={icon} active={active} />;
        })}

        {/* Perfil */}
        <li>
          <Link to="/perfil"
            className={`relative flex flex-col items-center gap-1 py-3 text-[10px] font-bold tracking-wide uppercase transition-smooth ${
              profileActive ? "text-wc-red" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {profileActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-wc-red animate-scale-in" />
            )}
            <span className={profileJustActivated ? "animate-nav-pop" : ""}>
              <div className={`relative transition-all duration-200 ${profileActive ? "drop-shadow-[0_0_6px_oklch(0.54_0.24_27/0.6)]" : ""}`}>
                {user && profile ? (
                  <UserAvatar avatarUrl={profile.avatar_url} name={profile.display_name} size={6}
                    className={`rounded-full ring-2 transition-all ${profileActive ? "ring-wc-red/60" : "ring-transparent"}`} />
                ) : (
                  <User className="h-6 w-6" strokeWidth={profileActive ? 2.4 : 1.6} />
                )}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-wc-red text-[9px] font-bold text-white ring-1 ring-background animate-glow">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
            </span>
            <span>Perfil</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}

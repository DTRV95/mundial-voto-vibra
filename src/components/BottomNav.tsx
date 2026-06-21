import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarClock, Trophy, Users, User, Target } from "lucide-react";
import { useAuth } from "@/lib/useAuth";
import { useNotifications } from "@/lib/useNotifications";
import { UserAvatar } from "@/components/AvatarPicker";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const NAV_ITEMS = [
  { to: "/",         label: "Home",     icon: Home },
  { to: "/jogos",    label: "Jogos",    icon: CalendarClock },
  { to: "/ligas",    label: "Torneios", icon: Users },
  { to: "/rankings", label: "Rankings", icon: Trophy },
];

export function BottomNav() {
  const { location } = useRouterState();
  const { user } = useAuth();
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

  const profileActive = location.pathname.startsWith("/perfil");

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] md:hidden shadow-elegant">
      <ul className="mx-auto grid max-w-lg grid-cols-6">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
          return (
            <li key={to}>
              <Link to={to}
                className={`relative flex flex-col items-center gap-1 py-3 text-[10px] font-bold tracking-wide uppercase transition-smooth ${
                  active ? "text-wc-red" : "text-muted-foreground"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-wc-red" />
                )}
                <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 1.6} />
                <span>{label}</span>
              </Link>
            </li>
          );
        })}

        {/* Prognósticos */}
        <li>
          <Link to="/noticias" search={{ prog: true } as any}
            className={`relative flex flex-col items-center gap-1 py-3 text-[10px] font-bold tracking-wide uppercase transition-smooth ${
              location.pathname.startsWith("/noticias") ? "text-wc-red" : "text-muted-foreground"
            }`}
          >
            {location.pathname.startsWith("/noticias") && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-wc-red" />
            )}
            <Target className="h-6 w-6" strokeWidth={location.pathname.startsWith("/noticias") ? 2.4 : 1.6} />
            <span>Picks</span>
          </Link>
        </li>

        {/* Perfil */}
        <li>
          <Link to="/perfil"
            className={`relative flex flex-col items-center gap-1 py-3 text-[10px] font-bold tracking-wide uppercase transition-smooth ${
              profileActive ? "text-wc-red" : "text-muted-foreground"
            }`}
          >
            {profileActive && (
              <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-wc-red" />
            )}
            <div className="relative">
              {user && profile ? (
                <UserAvatar avatarUrl={profile.avatar_url} name={profile.display_name} size={6} className="rounded-full" />
              ) : (
                <User className="h-6 w-6" strokeWidth={profileActive ? 2.4 : 1.6} />
              )}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-wc-red text-[9px] font-bold text-white ring-1 ring-background">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </div>
            <span>Perfil</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}

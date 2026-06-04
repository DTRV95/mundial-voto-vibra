import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { LogOut, Trophy, Target, Percent } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Uma Geração" }] }),
  component: Perfil,
});

function Perfil() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/perfil" } });
  }, [user, loading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id], enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: history = [] } = useQuery({
    queryKey: ["history", user?.id], enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("predictions")
        .select("id,points,created_at,match:match_id(id,kickoff_at,home:home_team_id(name,flag),away:away_team_id(name,flag))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  if (!user) return null;
  const acc = profile && profile.predictions_made > 0
    ? Math.round((profile.predictions_correct / profile.predictions_made) * 100) : 0;

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Sessão terminada");
    navigate({ to: "/" });
  }

  return (
    <div className="px-5 pt-6 pb-6">
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-gold font-display text-2xl text-background">
            {(profile?.display_name ?? "?").charAt(0).toUpperCase()}
          </span>
          <div>
            <h1 className="font-display text-2xl">{profile?.display_name ?? "Adepto"}</h1>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <button onClick={signOut} className="rounded-full border border-border p-2.5 text-muted-foreground hover:text-foreground">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Trophy className="h-4 w-4 text-gold" />} label="Pontos" value={profile?.total_points ?? 0} />
        <Stat icon={<Target className="h-4 w-4 text-gold" />} label="Previsões" value={profile?.predictions_made ?? 0} />
        <Stat icon={<Percent className="h-4 w-4 text-gold" />} label="Acerto" value={`${acc}%`} />
      </div>

      <h2 className="mt-8 mb-3 font-display text-xl">Histórico de Previsões</h2>
      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
          <p className="text-sm text-muted-foreground">Ainda não tens previsões.</p>
          <Link to="/jogos" className="mt-3 inline-block rounded-full bg-gold px-4 py-2 text-xs font-semibold text-background">Ver jogos de hoje</Link>
        </div>
      ) : (
        <ul className="space-y-2">
          {history.map((h: any) => (
            <li key={h.id}>
              <Link to="/jogo/$id" params={{ id: h.match.id }}
                className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-3 transition-smooth hover:border-gold/40">
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-xl">{h.match.home.flag ?? "⚽"}</span>
                  <span className="font-medium">{h.match.home.name} vs {h.match.away.name}</span>
                  <span className="text-xl">{h.match.away.flag ?? "⚽"}</span>
                </div>
                <span className="font-display text-gold">{h.points} pts</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4 text-center">
      <div className="mb-1 flex justify-center">{icon}</div>
      <div className="font-display text-2xl text-gold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { LogOut, Trophy, Target, Percent, Pencil, CheckCircle2, XCircle, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/perfil")({
  head: () => ({ meta: [{ title: "Perfil — Uma Geração" }] }),
  component: Perfil,
});

function Perfil() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

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

  // Edição de nome
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameStatus, setNameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [savingName, setSavingName] = useState(false);
  let nameTimer: ReturnType<typeof setTimeout>;

  function startEdit() {
    setNewName(profile?.display_name ?? "");
    setNameStatus("idle");
    setEditing(true);
  }

  async function checkName(val: string) {
    setNewName(val);
    if (val.trim() === profile?.display_name) { setNameStatus("idle"); return; }
    if (val.trim().length < 2) { setNameStatus("idle"); return; }
    clearTimeout(nameTimer);
    setNameStatus("checking");
    nameTimer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .ilike("display_name", val.trim())
        .maybeSingle();
      setNameStatus(data ? "taken" : "available");
    }, 500);
  }

  async function saveName() {
    if (nameStatus === "taken") return;
    if (newName.trim().length < 2) { toast.error("Nome demasiado curto."); return; }
    setSavingName(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: newName.trim() })
      .eq("id", user!.id);
    setSavingName(false);
    if (error) {
      if (error.message.includes("unique") || error.message.includes("duplicate")) {
        toast.error("Este nome já está em uso.");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Nome actualizado!");
    setEditing(false);
    qc.invalidateQueries({ queryKey: ["profile", user?.id] });
  }

  if (!user) return null;

  const acc = profile && profile.predictions_made > 0
    ? Math.round((profile.predictions_correct / profile.predictions_made) * 100) : 0;

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Sessão terminada");
    navigate({ to: "/" });
  }

  const initial = (profile?.display_name ?? user.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="px-5 pt-6 pb-6 md:px-8 max-w-2xl">

      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-gold font-display text-2xl text-background shadow-gold">
            {initial}
          </span>
          <div>
            {editing ? (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    autoFocus
                    value={newName}
                    onChange={e => checkName(e.target.value)}
                    maxLength={30}
                    className="rounded-lg border border-border bg-input px-3 py-1.5 text-sm font-semibold outline-none focus:border-gold/60 pr-8 w-44"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {nameStatus === "checking"  && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
                    {nameStatus === "available" && <CheckCircle2 className="h-3.5 w-3.5 text-primary" />}
                    {nameStatus === "taken"     && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                  </div>
                </div>
                <button onClick={saveName} disabled={savingName || nameStatus === "taken"}
                  className="rounded-lg bg-gold px-2.5 py-1.5 text-xs font-bold text-background disabled:opacity-50">
                  {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar"}
                </button>
                <button onClick={() => setEditing(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl">{profile?.display_name ?? "Adepto"}</h1>
                <button onClick={startEdit} className="text-muted-foreground hover:text-gold transition-smooth">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {editing && nameStatus === "taken" && (
              <p className="text-xs text-destructive mt-0.5">Nome já em uso.</p>
            )}
            {!editing && <p className="text-xs text-muted-foreground">{user.email}</p>}
          </div>
        </div>
        <button onClick={signOut} className="rounded-full border border-border p-2.5 text-muted-foreground hover:text-destructive transition-smooth">
          <LogOut className="h-4 w-4" />
        </button>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Stat icon={<Trophy className="h-4 w-4 text-gold" />} label="Pontos" value={profile?.total_points ?? 0} />
        <Stat icon={<Target className="h-4 w-4 text-gold" />} label="Previsões" value={profile?.predictions_made ?? 0} />
        <Stat icon={<Percent className="h-4 w-4 text-gold" />} label="Acerto" value={`${acc}%`} />
      </div>

      {/* Histórico */}
      <h2 className="mt-8 mb-3 font-display text-xl">Histórico de Previsões</h2>
      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
          <p className="text-sm text-muted-foreground">Ainda não tens previsões.</p>
          <Link to="/jogos" className="mt-3 inline-block rounded-full bg-gold px-4 py-2 text-xs font-semibold text-background">
            Ver jogos de hoje
          </Link>
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
                <span className={`font-display text-gold ${h.points > 0 ? "" : "opacity-40"}`}>
                  {h.points} pts
                </span>
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

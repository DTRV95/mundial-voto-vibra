import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { LogOut, Trophy, Target, Percent, Pencil, CheckCircle2, XCircle, Loader2, X, Star, Flame, Calendar, ImageIcon, Bell } from "lucide-react";
import { AvatarPicker, UserAvatar } from "@/components/AvatarPicker";
import { toast } from "sonner";
import { TeamBadge } from "@/lib/teamColors.tsx";
import { formatDate } from "@/lib/format";
import { useNotifications, markChatRead, markResultsSeen, markRankSeen } from "@/lib/useNotifications";

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

  const { data: notifs, refetch: refetchNotifs } = useNotifications();

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
        .select("id,points,result_90,exact_home,exact_away,created_at,match:match_id(id,kickoff_at,home_score,away_score,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  const { data: myPools = [] } = useQuery({
    queryKey: ["my-pools", user?.id], enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("pool_members")
        .select("pool:pool_id(id,name,code)")
        .eq("user_id", user!.id);
      return (data ?? []).map((d: any) => d.pool).filter(Boolean);
    },
  });

  // Edição de nome
  const [avatarOpen, setAvatarOpen] = useState(false);

  async function saveAvatar(url: string) {
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user!.id);
    qc.invalidateQueries({ queryKey: ["profile", user?.id] });
    toast.success("Avatar actualizado!");
  }

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
        .neq("id", user!.id)
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

  const pointsHistory = history.filter((h: any) => h.points != null && h.points > 0);
  const bestGame = pointsHistory.length > 0
    ? pointsHistory.reduce((a: any, b: any) => a.points > b.points ? a : b)
    : null;

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Sessão terminada");
    navigate({ to: "/" });
  }

  return (
    <div className="px-5 pt-6 pb-24 md:pb-10 md:px-8 max-w-2xl mx-auto">

      {avatarOpen && (
        <AvatarPicker
          current={profile?.avatar_url}
          onSave={saveAvatar}
          onClose={() => setAvatarOpen(false)}
        />
      )}

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl mb-6"
        style={{ background: "linear-gradient(135deg, oklch(0.25 0.06 27) 0%, oklch(0.22 0.08 250) 100%)" }}>
        <div className="card-stripe" />
        {/* Trophy watermark */}
        <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[96px] opacity-[0.06] select-none">🏆</div>

        <div className="relative px-5 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <button
                onClick={() => setAvatarOpen(true)}
                className="relative shrink-0 group"
                title="Alterar avatar"
              >
                <UserAvatar avatarUrl={profile?.avatar_url} name={profile?.display_name ?? user.email} size={16} />
                <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                  <ImageIcon className="h-5 w-5 text-white" />
                </div>
              </button>
              <div>
                {editing ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          autoFocus
                          value={newName}
                          onChange={e => checkName(e.target.value)}
                          maxLength={30}
                          className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-semibold text-white outline-none focus:border-white/50 pr-8 w-40 placeholder:text-white/40"
                          placeholder="Novo nome"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          {nameStatus === "checking"  && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/60" />}
                          {nameStatus === "available" && <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />}
                          {nameStatus === "taken"     && <XCircle className="h-3.5 w-3.5 text-red-400" />}
                        </div>
                      </div>
                      <button onClick={saveName} disabled={savingName || nameStatus === "taken"}
                        className="rounded-lg bg-gold px-2.5 py-1.5 text-xs font-bold text-background disabled:opacity-50">
                        {savingName ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar"}
                      </button>
                      <button onClick={() => setEditing(false)} className="text-white/50 hover:text-white">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {nameStatus === "taken" && <p className="text-xs text-red-400">Nome já em uso.</p>}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl text-white">{profile?.display_name ?? "Adepto"}</h1>
                    <button onClick={startEdit} className="text-white/40 hover:text-gold transition-smooth">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <p className="text-xs text-white/50 mt-0.5">{user.email}</p>
              </div>
            </div>
            <button onClick={signOut}
              className="rounded-full border border-white/20 bg-white/10 p-2.5 text-white/60 hover:text-white hover:border-white/40 transition-smooth">
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {/* Stats row */}
          <div className="mt-8 grid grid-cols-3 gap-3">
            <StatCard icon={<Trophy className="h-4 w-4 text-gold" />} label="Pontos" value={profile?.total_points ?? 0} />
            <StatCard icon={<Target className="h-4 w-4 text-wc-green" />} label="Previsões" value={profile?.predictions_made ?? 0} />
            <StatCard icon={<Percent className="h-4 w-4 text-wc-blue" />} label="Acerto" value={`${acc}%`} />
          </div>
        </div>
      </div>

      {/* Torneios */}
      {myPools.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-3 font-display text-lg flex items-center gap-2">
            <Star className="h-4 w-4 text-gold" /> Os meus torneios
          </h2>
          <div className="flex flex-wrap gap-2">
            {myPools.map((p: any) => (
              <Link key={p.id} to="/liga/$code" params={{ code: p.code }}
                className="flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1.5 text-sm font-semibold transition-smooth hover:border-gold/40 hover:text-gold">
                🏆 {p.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Melhor jogo */}
      {bestGame && (
        <section className="mb-6">
          <h2 className="mb-3 font-display text-lg flex items-center gap-2">
            <Flame className="h-4 w-4 text-wc-red" /> Melhor jogo
          </h2>
          <Link to="/jogo/$id" params={{ id: (bestGame as any).match.id }}
            className="flex items-center justify-between rounded-2xl border border-gold/30 bg-gold/10 p-4 transition-smooth hover:border-gold/60">
            <div className="flex items-center gap-3">
              <TeamBadge code={(bestGame as any).match.home.code} flag={(bestGame as any).match.home.flag} name={(bestGame as any).match.home.name} size="sm" />
              <div>
                <p className="font-semibold text-sm">{(bestGame as any).match.home.name} vs {(bestGame as any).match.away.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate((bestGame as any).match.kickoff_at)}</p>
              </div>
              <TeamBadge code={(bestGame as any).match.away.code} flag={(bestGame as any).match.away.flag} name={(bestGame as any).match.away.name} size="sm" />
            </div>
            <div className="text-right">
              <p className="font-display text-2xl text-gold">{(bestGame as any).points}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">pts</p>
            </div>
          </Link>
        </section>
      )}

      {/* Histórico */}
      <section>
        <h2 className="mb-3 font-display text-lg flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" /> Histórico de Previsões
        </h2>
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center">
            <p className="text-2xl mb-2">⚽</p>
            <p className="text-sm text-muted-foreground mb-4">Ainda não tens previsões.</p>
            <Link to="/jogos" className="inline-block rounded-full bg-gold px-5 py-2 text-xs font-semibold text-background">
              Ver jogos
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {history.map((h: any) => {
              const hasResult = h.match.home_score != null && h.match.away_score != null;
              const pts = h.points ?? 0;
              return (
                <li key={h.id}>
                  <Link to="/jogo/$id" params={{ id: h.match.id }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-3 transition-smooth hover:border-gold/30 group">
                    {/* Badges lado a lado */}
                    <div className="flex items-center gap-1 shrink-0">
                      <TeamBadge code={h.match.home?.code} flag={h.match.home?.flag} name={h.match.home?.name ?? ""} size="sm" />
                      <span className="text-[10px] font-bold text-muted-foreground">vs</span>
                      <TeamBadge code={h.match.away?.code} flag={h.match.away?.flag} name={h.match.away?.name ?? ""} size="sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">
                        {h.match.home?.name} vs {h.match.away?.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground">{formatDate(h.match.kickoff_at)}</span>
                        {hasResult && (
                          <span className="text-[11px] font-bold text-muted-foreground">
                            {h.match.home_score}–{h.match.away_score}
                          </span>
                        )}
                        {h.result_90 && (
                          <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            {h.result_90 === "home" ? "Casa" : h.result_90 === "draw" ? "Empate" : "Fora"}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 w-12">
                      {hasResult ? (
                        <>
                          <p className={`font-display text-lg leading-tight ${pts > 0 ? "text-gold" : "text-muted-foreground"}`}>
                            {pts > 0 ? `+${pts}` : "—"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">pts</p>
                        </>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground/60">—</span>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Notificações */}
      {notifs && notifs.total > 0 && (
        <section className="mt-8">
          <div className="mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4 text-wc-red" />
            <h2 className="font-display text-xl">Notificações</h2>
            <span className="rounded-full bg-wc-red px-2 py-0.5 text-[10px] font-bold text-white">{notifs.total}</span>
          </div>
          <div className="space-y-3">
            {notifs.items.map((notif, i) => {
              if (notif.type === "chat") return (
                <Link
                  key={`chat-${notif.poolCode}`}
                  to="/liga/$code"
                  params={{ code: notif.poolCode }}
                  onClick={() => { markChatRead(notif.poolCode); refetchNotifs(); }}
                  className="block overflow-hidden rounded-2xl border border-wc-red/30 bg-wc-red/5 hover:bg-wc-red/10 transition-smooth"
                >
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-wc-red/20">
                    <div className="flex items-center gap-2">
                      <Bell className="h-3.5 w-3.5 text-wc-red" />
                      <span className="text-sm font-bold">{notif.poolName}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-wc-red">{notif.messages.length} mensagem{notif.messages.length !== 1 ? "s" : ""} nova{notif.messages.length !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="divide-y divide-border/50">
                    {notif.messages.slice(0, 3).map(msg => (
                      <div key={msg.id} className="px-4 py-2">
                        <p className="text-[11px] font-semibold text-muted-foreground">{msg.sender}</p>
                        <p className="text-sm truncate">{msg.body}</p>
                      </div>
                    ))}
                    {notif.messages.length > 3 && (
                      <div className="px-4 py-2 text-[11px] text-muted-foreground">
                        +{notif.messages.length - 3} mensagens...
                      </div>
                    )}
                  </div>
                </Link>
              );

              if (notif.type === "result") return (
                <button
                  key={`result-${notif.matchId}`}
                  onClick={() => { markResultsSeen([notif.matchId]); refetchNotifs(); }}
                  className="w-full text-left overflow-hidden rounded-2xl border border-wc-green/30 bg-wc-green/5 hover:bg-wc-green/10 transition-smooth px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Trophy className="h-4 w-4 text-wc-green shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Resultado</p>
                      <p className="text-sm font-semibold truncate">{notif.home} {notif.homeScore}–{notif.awayScore} {notif.away}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 font-bold text-sm ${notif.pointsEarned > 0 ? "text-wc-green" : "text-muted-foreground"}`}>
                    {notif.pointsEarned > 0 ? `+${notif.pointsEarned} pts` : "0 pts"}
                  </span>
                </button>
              );

              if (notif.type === "rank") return (
                <button
                  key={`rank-${i}`}
                  onClick={() => { markRankSeen(notif.currentRank); refetchNotifs(); }}
                  className="w-full text-left overflow-hidden rounded-2xl border border-orange-400/30 bg-orange-400/5 hover:bg-orange-400/10 transition-smooth px-4 py-3 flex items-center gap-3"
                >
                  <Trophy className="h-4 w-4 text-orange-400 shrink-0" />
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ranking global</p>
                    <p className="text-sm font-semibold">Desceste do #{notif.previousRank}º para o #{notif.currentRank}º lugar</p>
                  </div>
                </button>
              );

              return null;
            })}
          </div>
        </section>
      )}

      {/* Terminar sessão — visível em mobile */}
      <div className="mt-8 md:hidden">
        <button
          onClick={signOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card/60 px-4 py-3.5 text-sm font-semibold text-muted-foreground transition-smooth hover:border-wc-red/40 hover:text-wc-red"
        >
          <LogOut className="h-4 w-4" />
          Terminar sessão
        </button>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/10 p-3 text-center backdrop-blur-sm">
      <div className="mb-1 flex justify-center">{icon}</div>
      <div className="font-display text-xl text-white">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { Users, Plus, LogIn, Copy, Check, Trash2, Gift, HelpCircle, Clock, CalendarDays, Layers } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/ligas")({
  head: () => ({
    meta: [
      { title: "Torneios Privados — Uma Geração" },
      { name: "description", content: "Cria ou junta-te a um torneio privado com os teus amigos." },
    ],
  }),
  component: Ligas,
});

function genCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function Ligas() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [newName, setNewName] = useState("");
  const [newPrize, setNewPrize] = useState("");
  const [newEmoji, setNewEmoji] = useState("⚽");
  const [newDurationType, setNewDurationType] = useState<"ongoing" | "phase" | "date">("ongoing");
  const [newDurationPhase, setNewDurationPhase] = useState("ronda32");
  const [newDurationDate, setNewDurationDate] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const PHASES = [
    { value: "ronda32", label: "16 Avos de Final" },
    { value: "oitavos", label: "Oitavos de Final" },
    { value: "quartos", label: "Quartos de Final" },
    { value: "meias", label: "Meias-Finais" },
    { value: "final", label: "Final" },
  ];

  const EMOJIS = ["⚽", "🍺", "👨‍👩‍👧", "💼", "🏆", "🎮", "🎓", "🏋️", "🎉", "🔥", "💪", "🤝", "🦁", "🐉", "🌍"];

  // Ligas onde o utilizador é membro
  const { data: myPools = [] } = useQuery({
    queryKey: ["my-pools", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("pool_members")
        .select("pool:pool_id(id, name, code, created_by, prize, emoji, duration_type, duration_value)")
        .eq("user_id", user!.id);
      return (data ?? []).map((r: any) => r.pool).filter(Boolean);
    },
  });

  // Contagem de membros por liga
  const { data: memberCounts = {} } = useQuery({
    queryKey: ["pool-counts", myPools.map((p: any) => p.id)],
    enabled: myPools.length > 0,
    queryFn: async () => {
      const ids = myPools.map((p: any) => p.id);
      const { data } = await supabase
        .from("pool_members")
        .select("pool_id")
        .in("pool_id", ids);
      const counts: Record<string, number> = {};
      for (const r of data ?? []) {
        counts[r.pool_id] = (counts[r.pool_id] ?? 0) + 1;
      }
      return counts;
    },
  });

  const createPool = useMutation({
    mutationFn: async ({ name, prize, emoji, duration_type, duration_value }: { name: string; prize: string; emoji: string; duration_type: string; duration_value: string | null }) => {
      let code = genCode();
      const { data: existing } = await supabase.from("pools").select("id").eq("code", code).maybeSingle();
      if (existing) code = genCode();

      const { data: pool, error } = await (supabase as any)
        .from("pools")
        .insert({ name, code, created_by: user!.id, prize: prize || null, emoji, duration_type, duration_value })
        .select()
        .single();
      if (error) throw error;

      // auto-entrar na liga
      const { data: myProfile } = await supabase.from("profiles").select("total_points").eq("id", user!.id).maybeSingle();
      const start_points = myProfile?.total_points ?? 0;
      await supabase.from("pool_members").insert({ pool_id: pool.id, user_id: user!.id, start_points });
      return pool;
    },
    onSuccess: (pool: any) => {
      setNewName("");
      setNewPrize("");
      setNewEmoji("⚽");
      setNewDurationType("ongoing");
      setNewDurationPhase("ronda32");
      setNewDurationDate("");
      qc.invalidateQueries({ queryKey: ["my-pools"] });
      toast.success("Torneio criado!");
      navigate({ to: "/liga/$code", params: { code: pool.code } });
    },
    onError: () => toast.error("Erro ao criar liga."),
  });

  const joinPool = useMutation({
    mutationFn: async (code: string) => {
      const { data: pool, error } = await supabase
        .from("pools")
        .select("id, name")
        .eq("code", code.toUpperCase().trim())
        .maybeSingle();
      if (error || !pool) throw new Error("Liga não encontrada.");

      const { data: myProfile } = await supabase.from("profiles").select("total_points").eq("id", user!.id).maybeSingle();
      const start_points = myProfile?.total_points ?? 0;
      const { error: joinError } = await supabase
        .from("pool_members")
        .insert({ pool_id: pool.id, user_id: user!.id, start_points });
      if (joinError?.code === "23505") throw new Error("Já és membro deste torneio.");
      if (joinError) throw joinError;
      return pool;
    },
    onSuccess: (pool: any) => {
      setJoinCode("");
      qc.invalidateQueries({ queryKey: ["my-pools"] });
      toast.success(`Entraste na liga "${pool.name}"!`);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao entrar no torneio."),
  });

  const leavePool = useMutation({
    mutationFn: async (poolId: string) => {
      await supabase.from("pool_members").delete().eq("pool_id", poolId).eq("user_id", user!.id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-pools"] });
      toast.success("Saíste do torneio.");
    },
  });

  const deletePool = useMutation({
    mutationFn: async (poolId: string) => {
      await supabase.from("pool_members").delete().eq("pool_id", poolId);
      const { error } = await supabase.from("pools").delete().eq("id", poolId).eq("created_by", user!.id);
      if (error) throw new Error("Não foi possível eliminar o torneio.");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-pools"] });
      toast.success("Torneio eliminado.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  function copyLink(code: string, poolId: string) {
    const url = `${window.location.origin}/liga/${code}`;
    if (navigator.share) {
      navigator.share({ title: "Junta-te ao meu torneio!", text: "Vota comigo no Mundial 2026 🏆", url });
    } else {
      navigator.clipboard.writeText(url);
      setCopiedId(poolId);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success("Link copiado!");
    }
  }

  function shareWhatsApp(code: string, name: string) {
    const url = `${window.location.origin}/liga/${code}`;
    const text = encodeURIComponent(`🏆 Junta-te ao meu torneio "${name}" no Uma Geração!\nVota no Mundial 2026 e compete comigo: ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  if (!user) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-5 text-center">
        <Users className="mb-3 h-12 w-12 text-muted-foreground" />
        <h2 className="font-display text-2xl">Torneios Privados</h2>
        <p className="mt-2 text-sm text-muted-foreground">Entra na tua conta para criar ou juntar-te a um torneio.</p>
        <Link to="/auth" className="mt-4 rounded-full bg-wc-red px-6 py-2.5 text-sm font-bold text-white shadow-gold">
          Entrar / Registar
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-10 max-w-2xl">
      {/* ── HERO BANNER ─────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, oklch(0.30 0.12 142) 0%, oklch(0.18 0.06 165) 100%)",
        }}
      >
        {/* Trophy watermark */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-8 opacity-10 pointer-events-none select-none">
          <Users className="h-40 w-40 text-white" />
        </div>
        <div className="relative px-5 pt-8 pb-6 md:px-8">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">Mundial 2026</p>
              <h1 className="font-display text-[clamp(2rem,8vw,3rem)] leading-none text-gold-metallic">
                Torneios Privados
              </h1>
              <p className="mt-2 text-sm text-white/60 max-w-xs">Cria um torneio privado, convida os amigos e compete entre si.</p>
            </div>
            <Link
              to="/como-funciona"
              className="mt-1 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] text-white/70 hover:border-gold/40 hover:text-gold transition-smooth shrink-0"
            >
              <HelpCircle className="h-3.5 w-3.5" /> Como funciona?
            </Link>
          </div>
        </div>
        {/* Gold shimmer line at bottom */}
        <div className="wc-tricolor h-1 w-full" />
      </div>

      <div className="px-5 pt-6 md:px-8">
        {/* ── CRIAR TORNEIO ──────────────────────────────────── */}
        <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 font-display text-lg flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-wc-red/15 text-wc-red">
              <Plus className="h-4 w-4" />
            </span>
            Criar Torneio
          </h2>
          <div className="space-y-3">
            {/* Emoji picker */}
            <div>
              <p className="mb-2 text-xs text-muted-foreground font-medium">Escolhe um ícone para o torneio</p>
              <div className="flex flex-wrap gap-2">
                {EMOJIS.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setNewEmoji(e)}
                    className={`h-9 w-9 rounded-xl text-xl transition-all ${newEmoji === e ? "bg-gold/15 ring-2 ring-gold scale-110 shadow-sm" : "bg-secondary hover:bg-secondary/80"}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <input
              type="text"
              id="nome-torneio"
              placeholder="Nome do torneio (ex: Família Silva)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              maxLength={40}
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition-all"
            />
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Gift className="h-3.5 w-3.5" /> Prémio do vencedor
              </p>
              <div className="flex flex-wrap gap-2 mb-2">
                {["🍽️ Jantar", "🍺 Grade de cerveja", "🥃 Borracheira", "🍩 Caixinha de bolos", "☕ Pequeno-almoço", "🎳 Bowling", "🎬 Cinema", "💆 Massagem", "🍕 Pizza", "🎲 Noite de jogos", "🧃 Sumos (o pobre paga)", "🏊 Piscina"].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setNewPrize(p => p === s ? "" : s)}
                    className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                      newPrize === s
                        ? "border-gold bg-gold/15 text-gold"
                        : "border-border bg-secondary/50 text-muted-foreground hover:border-gold/30 hover:text-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Ou escreve outro prémio..."
                value={newPrize}
                onChange={e => setNewPrize(e.target.value)}
                maxLength={80}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold/40 transition-all"
              />
            </div>

            {/* ── Duração do torneio ── */}
            <div>
              <p className="mb-2 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Duração do torneio
              </p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[
                  { value: "ongoing", label: "Sem limite", icon: "♾️" },
                  { value: "phase",   label: "Por fase",   icon: "🏟️" },
                  { value: "date",    label: "Por data",   icon: "📅" },
                ].map(opt => (
                  <button key={opt.value} type="button"
                    onClick={() => setNewDurationType(opt.value as any)}
                    className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-xs font-bold transition-all ${
                      newDurationType === opt.value
                        ? "border-gold bg-gold/10 text-gold"
                        : "border-border bg-secondary/50 text-muted-foreground hover:border-gold/30"
                    }`}>
                    <span className="text-lg leading-none">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>

              {newDurationType === "phase" && (
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-gold shrink-0" />
                  <select
                    value={newDurationPhase}
                    onChange={e => setNewDurationPhase(e.target.value)}
                    className="flex-1 rounded-xl border border-gold/30 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                  >
                    {PHASES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
              )}

              {newDurationType === "date" && (
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-gold shrink-0" />
                  <input
                    type="date"
                    value={newDurationDate}
                    onChange={e => setNewDurationDate(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="flex-1 rounded-xl border border-gold/30 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold/40"
                  />
                </div>
              )}
            </div>

            <button
              onClick={() => newName.trim() && createPool.mutate({
                name: newName.trim(), prize: newPrize.trim(), emoji: newEmoji,
                duration_type: newDurationType,
                duration_value: newDurationType === "phase" ? newDurationPhase : newDurationType === "date" ? newDurationDate : null,
              })}
              disabled={!newName.trim() || createPool.isPending}
              className="w-full rounded-xl bg-wc-red py-2.5 text-sm font-bold text-white shadow-gold disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-95"
            >
              {newEmoji} Criar Torneio
            </button>
          </div>
        </div>

        {/* ── ENTRAR COM CÓDIGO ──────────────────────────────── */}
        <div className="mb-8 rounded-2xl border border-wc-green/20 bg-wc-green/5 p-5">
          <h2 className="mb-3 font-display text-lg flex items-center gap-2 text-wc-green">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-wc-green/15">
              <LogIn className="h-4 w-4" />
            </span>
            Entrar com Código
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Código do torneio (ex: XK92PL)"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === "Enter" && joinCode.trim() && joinPool.mutate(joinCode)}
              maxLength={6}
              className="flex-1 rounded-xl border border-wc-green/30 bg-background px-4 py-2.5 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-wc-green/40 focus:border-wc-green/40 transition-all"
            />
            <button
              onClick={() => joinCode.trim() && joinPool.mutate(joinCode)}
              disabled={joinCode.length < 6 || joinPool.isPending}
              className="rounded-xl bg-wc-green px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-95"
            >
              Entrar
            </button>
          </div>
        </div>

        {/* ── OS MEUS TORNEIOS ───────────────────────────────── */}
        <h2 className="mb-3 font-display text-xl">Os meus torneios</h2>
        {myPools.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card/60">
            {/* Podium illustration */}
            <div className="flex items-end justify-center gap-3 px-8 pt-8 pb-4 opacity-25 pointer-events-none select-none">
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">👤</span>
                <div className="w-16 rounded-t-2xl bg-muted-foreground/60 flex items-start justify-center pt-1.5" style={{ height: "48px" }}>
                  <span className="font-display text-xs text-background/80">2º</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">👑</span>
                <div className="w-20 rounded-t-2xl bg-gold/80 flex items-start justify-center pt-2" style={{ height: "72px" }}>
                  <span className="font-display text-sm text-background/80">1º</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl">👤</span>
                <div className="w-16 rounded-t-2xl bg-muted-foreground/60 flex items-start justify-center pt-1.5" style={{ height: "36px" }}>
                  <span className="font-display text-xs text-background/80">3º</span>
                </div>
              </div>
            </div>
            <div className="px-6 pb-8 text-center">
              <p className="font-display text-xl">Imagina o teu nome aqui.</p>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">Cria um torneio, partilha o código com os teus amigos — a batalha começa agora.</p>
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  onClick={() => document.getElementById("nome-torneio")?.focus()}
                  className="rounded-xl bg-wc-red px-5 py-2.5 text-sm font-bold text-white shadow-gold transition-smooth hover:scale-[1.01] active:scale-95"
                >
                  Criar o meu torneio
                </button>
                <p className="self-center text-xs text-muted-foreground">ou entra com um código acima</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {myPools.map((pool: any) => {
              const memberCount = memberCounts[pool.id] ?? 1;
              return (
                <div key={pool.id} className="overflow-hidden rounded-2xl border border-gold/30 bg-card"
                  style={{ boxShadow: "0 2px 16px rgba(200,150,12,0.10), 0 0 0 1px rgba(200,150,12,0.20)" }}>
                  <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, transparent 0%, #c8960c 50%, transparent 100%)" }} />
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Big emoji on left */}
                      <div className="shrink-0 text-4xl leading-none pt-0.5">{pool.emoji || "⚽"}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to="/liga/$code"
                            params={{ code: pool.code }}
                            className="font-display text-lg hover:text-wc-red transition-smooth leading-tight"
                          >
                            {pool.name}
                          </Link>
                          {pool.created_by === user.id && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 border border-gold/30 px-2 py-0.5 text-[10px] font-bold text-gold">
                              👑 Criador
                            </span>
                          )}
                        </div>
                        {/* Stats row */}
                        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {memberCount} membro{memberCount !== 1 ? "s" : ""}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono font-bold tracking-wider">{pool.code}</span>
                          {pool.prize && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-wc-red">
                              <Gift className="h-3 w-3" /> {pool.prize}
                            </span>
                          )}
                          {pool.duration_type && pool.duration_type !== "ongoing" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 border border-gold/25 px-2.5 py-0.5 text-[11px] font-semibold text-gold">
                              {pool.duration_type === "phase" && (
                                <>{PHASES.find(p => p.value === pool.duration_value)?.label ?? pool.duration_value}</>
                              )}
                              {pool.duration_type === "date" && pool.duration_value && (
                                <>📅 até {new Date(pool.duration_value).toLocaleDateString("pt-PT", { day: "numeric", month: "short" })}</>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Action: delete or leave */}
                      {pool.created_by === user.id ? (
                        <button
                          onClick={() => {
                            if (confirm(`Eliminar "${pool.name}"? Esta ação não pode ser desfeita.`)) {
                              deletePool.mutate(pool.id);
                            }
                          }}
                          className="shrink-0 text-muted-foreground hover:text-destructive transition-smooth p-1"
                          title="Eliminar torneio"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (confirm(`Sair de "${pool.name}"? Perdes o teu lugar no ranking deste torneio.`)) {
                              leavePool.mutate(pool.id);
                            }
                          }}
                          className="shrink-0 text-[11px] text-muted-foreground hover:text-destructive transition-smooth border border-border rounded-lg px-2 py-1"
                          title="Sair do torneio"
                        >
                          Sair
                        </button>
                      )}
                    </div>
                    {/* Action buttons */}
                    <div className="mt-3 flex gap-2">
                      <Link
                        to="/liga/$code"
                        params={{ code: pool.code }}
                        className="flex-1 rounded-xl border border-border py-2 text-center text-xs font-bold text-foreground transition-smooth hover:border-wc-red/40 hover:text-wc-red"
                      >
                        Ver Ranking
                      </Link>
                      <button
                        onClick={() => shareWhatsApp(pool.code, pool.name)}
                        className="flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white transition-smooth hover:scale-[1.02] active:scale-95"
                      >
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.524 5.851L0 24l6.336-1.498A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.214-3.727.881.933-3.625-.235-.372A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                        WhatsApp
                      </button>
                      <button
                        onClick={() => copyLink(pool.code, pool.id)}
                        className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition-smooth hover:border-wc-red/40 hover:text-wc-red"
                      >
                        {copiedId === pool.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedId === pool.id ? "Copiado" : "Link"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

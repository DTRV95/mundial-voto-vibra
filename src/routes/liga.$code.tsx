import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { Trophy, Users, Copy, Check, ArrowLeft, Gift, Target, Zap, Crown, ArrowRight, Eye, ChevronDown, ChevronUp, MessageCircle, Send, UserX, UserPlus, Search, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/AvatarPicker";

export const Route = createFileRoute("/liga/$code")({
  component: LigaPage,
});

const MEDAL = ["🥇", "🥈", "🥉"];
const PODIUM_H = ["h-28", "h-20", "h-16"];
const PODIUM_BG = [
  "bg-gradient-to-b from-[#FFD700] to-[#B8860B]",
  "bg-gradient-to-b from-[#C0C0C0] to-[#808080]",
  "bg-gradient-to-b from-[#CD7F32] to-[#8B4513]",
];

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const colors = [
    "from-wc-red to-[#b01020]",
    "from-wc-green to-[#2a7a2a]",
    "from-wc-blue to-[#1a2560]",
    "from-[#7C3AED] to-[#4C1D95]",
    "from-[#D97706] to-[#92400E]",
  ];
  const color = colors[initials.charCodeAt(0) % colors.length];
  const sz = size === "lg" ? "h-14 w-14 text-xl" : size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-sm";
  return (
    <div className={`${sz} shrink-0 grid place-items-center rounded-full bg-gradient-to-br ${color} font-display text-white shadow-md`}>
      {initials}
    </div>
  );
}

function RankTrend({ userId, poolId, currentRank }: { userId: string; poolId: string; currentRank: number }) {
  const key = `liga_rank_prev_${poolId}_${userId}`;
  const stored = typeof window !== "undefined" ? localStorage.getItem(key) : null;
  const prev = stored ? Number(stored) : null;

  useEffect(() => {
    localStorage.setItem(key, String(currentRank));
  }, [key, currentRank]);

  if (prev === null || prev === currentRank) return <Minus className="h-3 w-3 text-muted-foreground/30" />;
  if (currentRank < prev) return <ArrowUp className="h-3 w-3 text-green-400" />;
  return <ArrowDown className="h-3 w-3 text-red-400" />;
}

function LigaPage() {
  const { code } = Route.useParams();
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [addTarget, setAddTarget] = useState<{ id: string; display_name: string; total_points: number; avatar_url: string | null } | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const EMOJIS = ["⚽", "🍺", "👨‍👩‍👧", "💼", "🏆", "🎮", "🎓", "🏋️", "🎉", "🔥", "💪", "🤝", "🦁", "🐉", "🌍"];

  const { data: pool, isLoading, isError } = useQuery({
    queryKey: ["pool", code],
    retry: false,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pools")
        .select("id, name, code, created_by, prize, created_at, emoji")
        .eq("code", code.toUpperCase())
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

  const { data: isMember } = useQuery({
    queryKey: ["pool-member", pool?.id, user?.id],
    enabled: !!pool && !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("pool_members")
        .select("user_id")
        .eq("pool_id", pool!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return !!data;
    },
  });

  const { data: ranking = [] } = useQuery({
    queryKey: ["pool-ranking", pool?.id],
    enabled: !!pool,
    queryFn: async () => {
      const { data: members } = await supabase
        .from("pool_members")
        .select("user_id, start_points")
        .eq("pool_id", pool!.id);

      if (!members || members.length === 0) return [];

      const userIds = members.map((m) => m.user_id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, total_points, predictions_made, predictions_correct")
        .in("id", userIds);

      return (profiles ?? [])
        .map((profile) => {
          const member = members.find(m => m.user_id === profile.id);
          const league_points = (profile.total_points ?? 0) - (member?.start_points ?? 0);
          return {
            id: profile.id,
            display_name: profile.display_name ?? "Adepto",
            avatar_url: (profile as any).avatar_url ?? null,
            total_points: Math.max(0, league_points),
            predictions_made: profile.predictions_made ?? 0,
            predictions_correct: profile.predictions_correct ?? 0,
          };
        })
        .sort((a, b) => {
          if (b.total_points !== a.total_points) return b.total_points - a.total_points;
          const accA = a.predictions_made > 0 ? a.predictions_correct / a.predictions_made : 0;
          const accB = b.predictions_made > 0 ? b.predictions_correct / b.predictions_made : 0;
          return accB - accA;
        });
    },
  });

  const { data: votedTodayIds = new Set<string>() } = useQuery({
    queryKey: ["pool-voted-today", pool?.id],
    enabled: !!pool && ranking.length > 0,
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(); end.setHours(23, 59, 59, 999);

      // jogos de hoje
      const { data: todayMatches } = await supabase
        .from("matches")
        .select("id")
        .gte("kickoff_at", start.toISOString())
        .lte("kickoff_at", end.toISOString());

      if (!todayMatches || todayMatches.length === 0) return new Set<string>();

      const matchIds = todayMatches.map(m => m.id);
      const memberIds = ranking.map(r => r.id);

      const { data: preds } = await supabase
        .from("predictions")
        .select("user_id")
        .in("user_id", memberIds)
        .in("match_id", matchIds);

      return new Set((preds ?? []).map(p => p.user_id));
    },
  });

  // Rank global de cada membro
  const { data: globalRanks = {} } = useQuery({
    queryKey: ["pool-global-ranks", pool?.id],
    enabled: !!pool && ranking.length > 0,
    queryFn: async () => {
      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("id,total_points")
        .order("total_points", { ascending: false });

      if (!allProfiles) return {};
      const memberIds = new Set(ranking.map(r => r.id));
      const ranks: Record<string, number> = {};
      allProfiles.forEach((p, i) => {
        if (memberIds.has(p.id)) ranks[p.id] = i + 1;
      });
      return ranks;
    },
  });

  // Previsões do grupo — jogos iniciados nos últimos 3 dias
  const { data: groupPredictions = [] } = useQuery({
    queryKey: ["pool-group-preds", pool?.id],
    enabled: !!pool && !!isMember && ranking.length > 0,
    queryFn: async () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
      // Nunca mostrar jogos anteriores à criação da liga
      const since = pool!.created_at && pool!.created_at > threeDaysAgo ? pool!.created_at : threeDaysAgo;
      const now = new Date().toISOString();

      const { data: matches } = await supabase
        .from("matches")
        .select("id,kickoff_at,home:home_team_id(name,flag,code),away:away_team_id(name,flag,code),status")
        .gte("kickoff_at", since)
        .lte("kickoff_at", now)
        .order("kickoff_at", { ascending: false })
        .limit(5);

      if (!matches || matches.length === 0) return [];

      const matchIds = matches.map(m => m.id);
      const memberIds = ranking.map(r => r.id);

      const { data: preds } = await supabase
        .from("predictions")
        .select("user_id,match_id,result_90,btts,total_25,total_35,exact_home,exact_away,points")
        .in("match_id", matchIds)
        .in("user_id", memberIds);

      return matches
        .filter((m: any) => m.home && m.away)
        .map((m: any) => ({
          match: m,
          predictions: (preds ?? [])
            .filter(p => p.match_id === m.id)
            .map(p => ({
              ...p,
              member: ranking.find(r => r.id === p.user_id),
            }))
            .filter(p => p.member),
        })).filter(m => m.predictions.length > 0);
    },
  });

  const joinPool = useMutation({
    mutationFn: async () => {
      // Busca pontos actuais para usar como ponto de partida na liga
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_points")
        .eq("id", user!.id)
        .maybeSingle();

      const start_points = profile?.total_points ?? 0;

      const { error } = await supabase
        .from("pool_members")
        .insert({ pool_id: pool!.id, user_id: user!.id, start_points });
      if (error?.code === "23505") return;
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pool-member"] });
      qc.invalidateQueries({ queryKey: ["pool-ranking"] });
      qc.invalidateQueries({ queryKey: ["my-pools"] });
      toast.success(`Bem-vindo ao torneio "${pool?.name}"! 🏆`);
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao entrar."),
  });

  const updateEmoji = useMutation({
    mutationFn: async (emoji: string) => {
      const { error } = await supabase.from("pools").update({ emoji }).eq("id", pool!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pool", code] });
      setShowEmojiPicker(false);
      toast.success("Ícone atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar ícone."),
  });

  const kickMember = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("pool_members")
        .delete()
        .eq("pool_id", pool!.id)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pool-ranking"] });
      qc.invalidateQueries({ queryKey: ["pool-member"] });
      toast.success("Membro removido do torneio.");
    },
    onError: () => toast.error("Erro ao remover membro."),
  });

  const isCreator = user?.id === pool?.created_by;

  const { data: searchResults = [] } = useQuery({
    queryKey: ["user-search", addSearch],
    enabled: addSearch.trim().length >= 2,
    queryFn: async () => {
      const memberIds = new Set(ranking.map((r: any) => r.id));
      const { data } = await supabase
        .from("profiles")
        .select("id, display_name, total_points, avatar_url")
        .ilike("display_name", `%${addSearch.trim()}%`)
        .order("total_points", { ascending: false })
        .limit(8);
      return (data ?? []).filter((u: any) => !memberIds.has(u.id));
    },
  });

  const addMember = useMutation({
    mutationFn: async ({ userId, startFromZero }: { userId: string; startFromZero: boolean }) => {
      const { data: profile } = await supabase
        .from("profiles").select("total_points").eq("id", userId).maybeSingle();
      const start_points = startFromZero ? (profile?.total_points ?? 0) : 0;
      const { error } = await supabase
        .from("pool_members")
        .insert({ pool_id: pool!.id, user_id: userId, start_points });
      if (error?.code === "23505") throw new Error("Utilizador já é membro.");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pool-ranking"] });
      qc.invalidateQueries({ queryKey: ["pool-member"] });
      setAddSearch("");
      setAddTarget(null);
      toast.success("Membro adicionado!");
    },
    onError: (e: any) => toast.error(e.message ?? "Erro ao adicionar membro."),
  });

function copyLink() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `Liga "${pool?.name}"`, text: "Junta-te ao meu torneio no Uma Geração 🏆", url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copiado!");
    }
  }

  function shareWhatsApp() {
    const url = `${window.location.origin}/entrar/${pool?.code}`;
    const text = encodeURIComponent(`🏆 Junta-te ao meu torneio "${pool?.name}" no Uma Geração!\nVota no Mundial 2026 e compete comigo: ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-wc-red border-t-transparent" />
      </div>
    );
  }

  if (!isLoading && (isError || !pool)) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-5 text-center gap-2">
        <span className="text-5xl mb-2">🔍</span>
        <h2 className="font-display text-2xl">Liga não encontrada</h2>
        <p className="text-sm text-muted-foreground">
          O código <span className="font-mono font-bold text-foreground">{code.toUpperCase()}</span> não corresponde a nenhuma liga.
        </p>
        <p className="text-xs text-muted-foreground">Verifica se o link está correto ou pede ao criador do torneio para te enviar novamente.</p>
        <Link to="/ligas" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-wc-red px-5 py-2.5 text-sm font-bold text-white hover:bg-wc-red/80 transition-smooth">
          <ArrowLeft className="h-3.5 w-3.5" /> Ver os meus torneios
        </Link>
      </div>
    );
  }

  const topPoints = ranking[0]?.total_points ?? 1;
  const totalPoints = ranking.reduce((s, r: any) => s + (r.total_points ?? 0), 0);
  const podium = ranking.slice(0, 3);
  const rest = ranking.slice(3);
  const myRank = ranking.findIndex((r: any) => r.id === user?.id);

  return (
    <div className="pb-16">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <div className="px-5 pt-5 md:px-8">
      <div
        className="relative overflow-hidden rounded-3xl panini-stripes"
        style={{
          background: "linear-gradient(145deg, oklch(0.54 0.24 27) 0%, oklch(0.40 0.20 15) 55%, oklch(0.28 0.14 270) 100%)",
          minHeight: "220px",
          boxShadow: "0 12px 40px oklch(0.54 0.24 27 / 0.35)",
        }}
      >
        {/* Tricolor strip no fundo */}
        <div className="absolute bottom-0 left-0 right-0 h-1 wc-tricolor" />

        {/* Troféu decorativo */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-6 opacity-10 pointer-events-none select-none">
          <Trophy className="h-48 w-48 text-white" />
        </div>

        <div className="relative px-5 pt-5 pb-6 md:px-8">
          <Link to="/ligas" className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-white/60 hover:text-white/90 transition-smooth">
            <ArrowLeft className="h-3.5 w-3.5" /> Torneios
          </Link>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 mb-1">Torneio Privado · {pool.code}</p>
          <h1 className="font-display text-[clamp(2rem,8vw,3.5rem)] leading-none text-white flex items-center gap-3">
            <button
              onClick={() => isCreator && setShowEmojiPicker(p => !p)}
              className={`text-[clamp(1.8rem,7vw,3rem)] leading-none ${isCreator ? "cursor-pointer hover:scale-110 transition-transform" : "cursor-default"}`}
              title={isCreator ? "Mudar ícone" : undefined}
            >
              {(pool as any).emoji || "⚽"}
            </button>
            {pool.name}
          </h1>
          {isCreator && showEmojiPicker && (
            <div className="mt-3 flex flex-wrap gap-2 p-3 rounded-2xl bg-black/30 backdrop-blur-sm w-fit">
              {EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => updateEmoji.mutate(e)}
                  className={`h-10 w-10 rounded-xl text-2xl transition-all hover:scale-110 ${(pool as any).emoji === e ? "bg-white/30 ring-2 ring-white" : "bg-white/10 hover:bg-white/20"}`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}

          {/* Stats strip */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-1.5 text-xs text-white/70">
              <Users className="h-3.5 w-3.5" />
              <span><strong className="text-white">{ranking.length}</strong> membro{ranking.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-white/70">
              <Zap className="h-3.5 w-3.5" />
              <span><strong className="text-white">{totalPoints}</strong> pontos totais</span>
            </div>
            {pool.prize && (
              <div className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-white">
                <Gift className="h-3 w-3" /> {pool.prize}
              </div>
            )}
          </div>

          {/* Botões de partilha */}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              onClick={shareWhatsApp}
              className="flex items-center gap-1.5 rounded-xl bg-[#25D366] px-4 py-2 text-xs font-bold text-white shadow-md transition-smooth hover:scale-[1.02] active:scale-95"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.524 5.851L0 24l6.336-1.498A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.214-3.727.881.933-3.625-.235-.372A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
              WhatsApp
            </button>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-xs font-bold text-white hover:bg-white/25 transition-smooth active:scale-95"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado!" : "Copiar link"}
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* ── CONVITE (não autenticado) ─────────────────────────── */}
      {!user && !loading && (
        <div className="mx-5 mt-5 md:mx-8 overflow-hidden rounded-2xl border border-border bg-muted/40 p-5">
          <p className="text-sm text-muted-foreground text-center">Este torneio é privado. Faz <Link to="/auth" className="underline">login</Link> para verificar o teu acesso.</p>
        </div>
      )}


      {/* ── JOIN — não membro: acesso negado ─────────────────── */}
      {user && isMember === false && (
        <div className="mx-5 mt-5 md:mx-8 overflow-hidden rounded-2xl border border-border bg-muted/40 p-5">
          <p className="text-sm text-muted-foreground text-center">Este torneio é privado. Pede ao criador para te adicionar.</p>
        </div>
      )}

      {/* ── O MEU RANKING (membro, fora do top 3) ────────────── */}
      {user && isMember && myRank >= 3 && ranking[myRank] && (
        <div className="mx-5 mt-5 md:mx-8">
          <div className="flex items-center gap-3 rounded-2xl border-2 border-wc-red/40 bg-wc-red/5 px-4 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-wc-red font-display text-sm text-white">
              {myRank + 1}
            </span>
            <UserAvatar avatarUrl={(ranking[myRank] as any).avatar_url} name={(ranking[myRank] as any).display_name} size={8} className="rounded-full" />
            <span className="flex-1 text-sm font-semibold">{(ranking[myRank] as any).display_name} <span className="text-[10px] font-bold text-wc-red">Tu</span></span>
            <span className="font-display text-lg text-gold">{(ranking[myRank] as any).total_points} <span className="text-xs font-sans text-muted-foreground">pts</span></span>
          </div>
        </div>
      )}

      {/* ── PÓDIO ────────────────────────────────────────────── */}
      {ranking.length >= 2 && (
        <div className="mx-5 mt-8 md:mx-8">
          <div className="mb-4 flex items-center gap-2">
            <Crown className="h-4 w-4 text-gold" />
            <h2 className="font-display text-xl">Pódio</h2>
          </div>

          <div className="flex items-end justify-center gap-3 px-4 pb-2">
            {/* 2º lugar */}
            {podium[1] && (
              <div className="flex flex-1 flex-col items-center gap-2">
                <UserAvatar avatarUrl={(podium[1] as any).avatar_url} name={(podium[1] as any).display_name} size={10} className="rounded-full" />
                <div className="text-center">
                  <p className="text-xs font-semibold leading-tight line-clamp-1 max-w-[80px]">{(podium[1] as any).display_name}</p>
                  {votedTodayIds.has((podium[1] as any).id) && <p className="text-[9px] text-wc-green font-bold">✓ votou hoje</p>}
                </div>
                <p className="font-display text-sm text-muted-foreground">{(podium[1] as any).total_points} pts</p>
                <div className={`w-full ${PODIUM_H[1]} ${PODIUM_BG[1]} rounded-t-xl flex items-start justify-center pt-2`}>
                  <span className="text-xl">🥈</span>
                </div>
              </div>
            )}
            {/* 1º lugar */}
            {podium[0] && (
              <div className="flex flex-1 flex-col items-center gap-2">
                <div className="relative">
                  <UserAvatar avatarUrl={(podium[0] as any).avatar_url} name={(podium[0] as any).display_name} size={14} className="rounded-full" />
                  <span className="absolute -top-2 -right-1 text-lg">👑</span>
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold leading-tight line-clamp-1 max-w-[80px]">
                    {(podium[0] as any).display_name}
                    {(podium[0] as any).id === pool?.created_by && " 👑"}
                  </p>
                  {votedTodayIds.has((podium[0] as any).id) && <p className="text-[9px] text-wc-green font-bold">✓ votou hoje</p>}
                </div>
                <p className="font-display text-base text-gold font-bold">{(podium[0] as any).total_points} pts</p>
                <div className={`w-full ${PODIUM_H[0]} ${PODIUM_BG[0]} rounded-t-xl flex items-start justify-center pt-2 trophy-shine`}>
                  <span className="text-2xl">🥇</span>
                </div>
              </div>
            )}
            {/* 3º lugar */}
            {podium[2] && (
              <div className="flex flex-1 flex-col items-center gap-2">
                <UserAvatar avatarUrl={(podium[2] as any).avatar_url} name={(podium[2] as any).display_name} size={10} className="rounded-full" />
                <div className="text-center">
                  <p className="text-xs font-semibold leading-tight line-clamp-1 max-w-[80px]">{(podium[2] as any).display_name}</p>
                  {votedTodayIds.has((podium[2] as any).id) && <p className="text-[9px] text-wc-green font-bold">✓ votou hoje</p>}
                </div>
                <p className="font-display text-sm text-muted-foreground">{(podium[2] as any).total_points} pts</p>
                <div className={`w-full ${PODIUM_H[2]} ${PODIUM_BG[2]} rounded-t-xl flex items-start justify-center pt-2`}>
                  <span className="text-xl">🥉</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RANKING COMPLETO ─────────────────────────────────── */}
      <div className="mx-5 mt-8 md:mx-8">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display text-xl">Classificação Completa</h2>
        </div>

        {ranking.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="font-display text-lg">Ainda sem membros</p>
            <p className="mt-1 text-sm text-muted-foreground">Convida os teus amigos para começar a competir.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ranking.map((r: any, i: number) => {
              const isMe = r.id === user?.id;
              const pct = topPoints > 0 ? Math.round((r.total_points / topPoints) * 100) : 0;
              const acc = r.predictions_made > 0
                ? Math.round((r.predictions_correct / r.predictions_made) * 100)
                : 0;

              return (
                <div
                  key={r.id}
                  className={`overflow-hidden rounded-2xl border transition-smooth ${
                    isMe
                      ? "border-wc-red/40 bg-wc-red/5 shadow-gold"
                      : "border-border bg-card/70"
                  }`}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    {/* Posição */}
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      i === 0
                        ? "bg-gradient-to-b from-[#FFD700] to-[#B8860B] text-white"
                        : i === 1
                        ? "bg-gradient-to-b from-[#C0C0C0] to-[#808080] text-white"
                        : i === 2
                        ? "bg-gradient-to-b from-[#CD7F32] to-[#8B4513] text-white"
                        : "bg-secondary text-muted-foreground"
                    }`}>
                      {i < 3 ? MEDAL[i] : i + 1}
                    </span>

                    <Link to="/adepto/$id" params={{ id: r.id }}>
                      <UserAvatar avatarUrl={r.avatar_url} name={r.display_name} size={8} className="rounded-full hover:opacity-80 transition-smooth" />
                    </Link>

                    {/* Nome + barra de progresso */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-0.5 min-w-0">
                          <Link to="/adepto/$id" params={{ id: r.id }} className="truncate text-sm font-semibold hover:underline">{r.display_name}</Link>
                          <RankTrend userId={r.id} poolId={pool!.id} currentRank={i + 1} />
                        </span>
                        {isMe && <span className="shrink-0 text-[9px] font-bold text-wc-red uppercase tracking-wider">Tu</span>}
                        {r.id === pool?.created_by && (
                          <span className="shrink-0 text-[10px]" title="Criador do torneio">👑</span>
                        )}
                        {globalRanks[r.id] && (
                          <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-gold/15 px-1.5 py-0.5 text-[9px] font-bold text-gold">
                            #{globalRanks[r.id]}º global
                          </span>
                        )}
                        {votedTodayIds.has(r.id) && (
                          <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-wc-green/15 px-1.5 py-0.5 text-[9px] font-bold text-wc-green">
                            ✓ votou hoje
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-wc-red to-[#ff6b35] transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{acc}%</span>
                      </div>
                    </div>

                    {/* Pontos */}
                    <div className="shrink-0 text-right">
                      <div className="font-display text-lg leading-none text-gold">{r.total_points}</div>
                      <div className="text-[10px] text-muted-foreground">{r.predictions_correct}/{r.predictions_made}</div>
                    </div>

                    {/* Expulsar — só criador, nunca a si próprio */}
                    {isCreator && !isMe && (
                      <button
                        onClick={() => {
                          if (confirm(`Expulsar ${r.display_name} do torneio?`)) kickMember.mutate(r.id);
                        }}
                        className="shrink-0 rounded-lg p-1.5 text-muted-foreground/40 hover:bg-wc-red/10 hover:text-wc-red transition-smooth"
                        title="Expulsar membro"
                      >
                        <UserX className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── PREVISÕES DO GRUPO ───────────────────────────────── */}
      {user && isMember && groupPredictions.length > 0 && (
        <div className="mx-5 mt-8 md:mx-8">
          <div className="mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-xl">Previsões do Grupo</h2>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">após início do jogo</span>
          </div>
          <div className="space-y-3">
            {groupPredictions.map(({ match, predictions }: any) => (
              <MatchPredCard key={match.id} match={match} predictions={predictions} currentUserId={user.id} />
            ))}
          </div>
        </div>
      )}

      {/* ── VOTAR NOS JOGOS ──────────────────────────────────── */}
      {user && isMember && (
        <div className="mx-5 mt-4 md:mx-8">
          <Link
            to="/jogos"
            search={{ filter: "hoje", phase: "todas" } as any}
            className="flex items-center justify-between gap-4 rounded-2xl bg-wc-red px-5 py-4 text-white shadow-gold transition-smooth hover:scale-[1.01] active:scale-95 panini-stripes"
          >
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-0.5">Os teus pontos contam aqui</p>
              <p className="font-display text-xl leading-tight">Votar nos jogos de hoje</p>
            </div>
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/20">
              <ArrowRight className="h-6 w-6 text-white" />
            </div>
          </Link>
        </div>
      )}

      {/* ── CHAT ─────────────────────────────────────────────── */}
      {user && isMember && (
        <LeagueChat poolCode={code} userId={user.id} ranking={ranking} />
      )}

      {/* ── CONVIDAR ─────────────────────────────────────────── */}
      {user && isMember && (
        <div className="mx-5 mt-6 md:mx-8">
          <div
            className="overflow-hidden rounded-2xl panini-stripes text-white"
            style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", boxShadow: "0 4px 20px oklch(0 0 0 / 0.25)" }}
          >
            <div className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-1">Convida</p>
                <p className="font-display text-lg leading-tight">Chama mais amigos</p>
                <p className="mt-0.5 text-xs text-white/60">Quanto mais, mais emocionante fica.</p>
                {/* Código pequeno e copiável */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pool.code);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                    toast.success("Código copiado!");
                  }}
                  className="mt-2 flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1 hover:bg-white/20 transition-smooth active:scale-95"
                >
                  <span className="text-[11px] text-white/50">Código:</span>
                  <span className="font-mono text-xs font-bold text-white tracking-widest">{pool.code}</span>
                  {copied ? <Check className="h-3 w-3 text-white/70" /> : <Copy className="h-3 w-3 text-white/50" />}
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={shareWhatsApp} className="flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white transition-smooth hover:scale-[1.02]">
                  <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.524 5.851L0 24l6.336-1.498A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.214-3.727.881.933-3.625-.235-.372A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
                  WhatsApp
                </button>
                <button onClick={copyLink} className="flex items-center gap-1 rounded-xl bg-white/15 px-3 py-2 text-xs font-bold text-white hover:bg-white/25 transition-smooth">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ADICIONAR MEMBRO (só criador) ──────────────────────── */}
      {isCreator && (
        <div className="mx-5 mt-8 md:mx-8">
          <div className="mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-display text-xl">Adicionar membro</h2>
          </div>
          <div className="rounded-2xl border border-border bg-card/70 p-4">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Pesquisar utilizador pelo nome..."
                value={addSearch}
                onChange={e => setAddSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wc-red/40"
              />
            </div>
            {addSearch.trim().length >= 2 && (
              <div className="space-y-1">
                {searchResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-3">Nenhum utilizador encontrado.</p>
                ) : searchResults.map((u: any) => (
                  <button
                    key={u.id}
                    onClick={() => setAddTarget(u)}
                    className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-accent transition-smooth"
                  >
                    <UserAvatar avatarUrl={u.avatar_url} name={u.display_name} size={7} className="rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{u.display_name}</p>
                      <p className="text-[11px] text-muted-foreground">{u.total_points} pts globais</p>
                    </div>
                    <span className="shrink-0 text-xs text-wc-red font-semibold">Adicionar</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de confirmação de pontos */}
      {addTarget && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setAddTarget(null)} />
          <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <UserAvatar avatarUrl={addTarget.avatar_url} name={addTarget.display_name} size={10} className="rounded-full" />
              <div>
                <p className="font-display text-lg">{addTarget.display_name}</p>
                <p className="text-sm text-muted-foreground">{addTarget.total_points} pontos globais</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">Como deve entrar neste torneio?</p>
            <div className="space-y-2">
              <button
                onClick={() => addMember.mutate({ userId: addTarget.id, startFromZero: false })}
                disabled={addMember.isPending}
                className="w-full rounded-2xl border-2 border-gold/40 bg-gold/10 px-4 py-3.5 text-left hover:bg-gold/20 transition-smooth disabled:opacity-50"
              >
                <p className="font-bold text-sm">Com os pontos que já tem</p>
                <p className="text-xs text-muted-foreground mt-0.5">Entra com {addTarget.total_points} pts — conta tudo desde o início do torneio</p>
              </button>
              <button
                onClick={() => addMember.mutate({ userId: addTarget.id, startFromZero: true })}
                disabled={addMember.isPending}
                className="w-full rounded-2xl border-2 border-wc-red/40 bg-wc-red/10 px-4 py-3.5 text-left hover:bg-wc-red/20 transition-smooth disabled:opacity-50"
              >
                <p className="font-bold text-sm">A partir do zero</p>
                <p className="text-xs text-muted-foreground mt-0.5">Só contam os pontos feitos a partir de agora</p>
              </button>
            </div>
            <button onClick={() => setAddTarget(null)} className="mt-3 w-full text-center text-xs text-muted-foreground hover:text-foreground transition-smooth">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── CHAT ──────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  user_id: string;
  body: string;
  created_at: string;
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "agora";
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function LeagueChat({ poolCode, userId, ranking }: { poolCode: string; userId: string; ranking: any[] }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const memberMap = Object.fromEntries(ranking.map(r => [r.id, r]));

  useEffect(() => {
    // Carrega as últimas 50 mensagens
    supabase
      .from("league_messages")
      .select("id,user_id,body,created_at")
      .eq("pool_code", poolCode)
      .order("created_at", { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (data) setMessages(data as ChatMessage[]);
      });

    // Subscreve a novas mensagens em tempo real
    const channel = supabase
      .channel(`chat:${poolCode}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "league_messages", filter: `pool_code=eq.${poolCode}` },
        (payload) => {
          setMessages(prev => {
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new as ChatMessage];
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [poolCode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setInput("");
    await supabase.from("league_messages").insert({ pool_code: poolCode, user_id: userId, body });
    setSending(false);
  }

  return (
    <div className="mx-5 mt-8 md:mx-8">
      <div className="mb-4 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-display text-xl">Chat do Grupo</h2>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card/70">
        {/* Mensagens */}
        <div className="flex flex-col gap-1 px-4 py-4 overflow-y-auto max-h-72 min-h-[120px]">
          {messages.length === 0 && (
            <p className="text-center text-xs text-muted-foreground py-6">
              Ninguém falou ainda. Sê o primeiro! 👋
            </p>
          )}
          {messages.map((msg, i) => {
            const isMe = msg.user_id === userId;
            const member = memberMap[msg.user_id];
            const name = member?.display_name ?? "Adepto";
            // Só mostra nome/avatar se for a primeira mensagem desta pessoa em sequência
            const prev = messages[i - 1];
            const showHeader = !prev || prev.user_id !== msg.user_id;

            return (
              <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""} ${showHeader && i > 0 ? "mt-3" : ""}`}>
                {/* Avatar — placeholder invisível quando não é cabeçalho, para manter alinhamento */}
                <div className="shrink-0 w-6 h-6 mb-0.5">
                  {showHeader && (
                    <UserAvatar avatarUrl={member?.avatar_url} name={name} size={6} className="rounded-full" />
                  )}
                </div>
                <div className={`max-w-[75%] flex flex-col gap-0.5 ${isMe ? "items-end" : "items-start"}`}>
                  {showHeader && (
                    <span className={`text-[10px] font-semibold px-1 ${isMe ? "text-wc-red/70" : "text-muted-foreground"}`}>
                      {isMe ? "Tu" : name}
                    </span>
                  )}
                  <div className={`rounded-2xl px-3 py-2 text-sm leading-snug ${
                    isMe
                      ? "bg-wc-red text-white rounded-br-sm"
                      : "bg-secondary text-foreground rounded-bl-sm"
                  }`}>
                    {msg.body}
                  </div>
                  <span className="text-[9px] text-muted-foreground/60 px-1">{timeAgo(msg.created_at)}</span>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value.slice(0, 300))}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Escreve uma mensagem…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
          />
          <span className="text-[10px] text-muted-foreground/40 shrink-0">{input.length}/300</span>
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-wc-red text-white disabled:opacity-40 transition-smooth hover:bg-wc-red/80 active:scale-95"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

const RESULT_LABEL: Record<string, string> = { home: "Casa", draw: "Empate", away: "Fora" };
const BTTS_LABEL: Record<string, string> = { yes: "Sim", no: "Não" };
const GOALS_LABEL: Record<string, string> = { over: "Mais", under: "Menos" };

function MatchPredCard({ match, predictions, currentUserId }: { match: any; predictions: any[]; currentUserId: string }) {
  const [open, setOpen] = useState(false);
  const finished = match.status === "finished";

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card/70">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-accent/50 transition-smooth"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-lg">{match.home?.flag ?? "🏳"}</span>
          <span className="text-sm font-bold truncate">{match.home?.name}</span>
          <span className="text-xs text-muted-foreground shrink-0">vs</span>
          <span className="text-sm font-bold truncate">{match.away?.name}</span>
          <span className="text-lg">{match.away?.flag ?? "🏳"}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {finished && <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-muted-foreground">FIM</span>}
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border divide-y divide-border/50">
          {predictions.map((p: any) => {
            const isMe = p.user_id === currentUserId;
            const scored = finished && p.points != null && p.points > 0;
            const missed = finished && p.points != null && p.points === 0;
            return (
              <div key={p.user_id} className={`flex items-center gap-3 px-4 py-2.5 ${isMe ? "bg-gold/5" : ""}`}>
                <UserAvatar avatarUrl={p.member?.avatar_url} name={p.member?.display_name ?? "?"} size={7} className="rounded-full shrink-0" />
                <span className={`text-xs font-semibold shrink-0 w-20 truncate ${isMe ? "text-gold" : ""}`}>
                  {p.member?.display_name}{isMe ? " (tu)" : ""}
                </span>
                <div className="flex flex-1 flex-wrap gap-1.5">
                  {p.result_90 && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">
                      {RESULT_LABEL[p.result_90] ?? p.result_90}
                    </span>
                  )}
                  {p.btts && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">
                      BTTS {BTTS_LABEL[p.btts] ?? p.btts}
                    </span>
                  )}
                  {p.total_25 && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">
                      2.5 {GOALS_LABEL[p.total_25] ?? p.total_25}
                    </span>
                  )}
                  {p.total_35 && (
                    <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold">
                      3.5 {GOALS_LABEL[p.total_35] ?? p.total_35}
                    </span>
                  )}
                  {p.exact_home != null && p.exact_away != null && (
                    <span className="rounded-full bg-wc-blue/20 px-2 py-0.5 text-[10px] font-bold text-wc-blue">
                      {p.exact_home}–{p.exact_away}
                    </span>
                  )}
                </div>
                {finished && (
                  <span className={`shrink-0 text-xs font-bold ${scored ? "text-wc-green" : missed ? "text-muted-foreground/50" : ""}`}>
                    {scored ? `+${p.points}` : missed ? "0" : ""}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

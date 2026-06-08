import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { Trophy, Users, Copy, Check, ArrowLeft, Gift, Target, Zap, Crown, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

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

function LigaPage() {
  const { code } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [copied, setCopied] = useState(false);

  const { data: pool, isLoading } = useQuery({
    queryKey: ["pool", code],
    queryFn: async () => {
      const { data } = await supabase
        .from("pools")
        .select("id, name, code, created_by, prize")
        .eq("code", code.toUpperCase())
        .maybeSingle();
      return data;
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
        .select("user_id, joined_at")
        .eq("pool_id", pool!.id);

      if (!members || members.length === 0) return [];

      const userIds = members.map((m) => m.user_id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);

      const results = await Promise.all(
        members.map(async (member) => {
          try {
            const { data: preds } = await supabase
              .from("predictions")
              .select("points, created_at")
              .eq("user_id", member.user_id)
              .gte("created_at", member.joined_at);

            const points = (preds ?? []).reduce((sum, p) => sum + (p.points ?? 0), 0);
            const made = (preds ?? []).length;
            const correct = (preds ?? []).filter((p) => (p.points ?? 0) > 0).length;
            const profile = profiles?.find((pr) => pr.id === member.user_id);

            return {
              id: member.user_id,
              display_name: profile?.display_name ?? "Adepto",
              total_points: points,
              predictions_made: made,
              predictions_correct: correct,
              joined_at: member.joined_at,
            };
          } catch {
            const profile = profiles?.find((pr) => pr.id === member.user_id);
            return {
              id: member.user_id,
              display_name: profile?.display_name ?? "Adepto",
              total_points: 0,
              predictions_made: 0,
              predictions_correct: 0,
              joined_at: member.joined_at,
            };
          }
        })
      );

      return results.sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points;
        const accA = a.predictions_made > 0 ? a.predictions_correct / a.predictions_made : 0;
        const accB = b.predictions_made > 0 ? b.predictions_correct / b.predictions_made : 0;
        return accB - accA;
      });
    },
  });

  const joinPool = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("pool_members")
        .insert({ pool_id: pool!.id, user_id: user!.id });
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

  useEffect(() => {
    if (user && pool && isMember === false && !joinPool.isPending && !joinPool.isSuccess) {
      joinPool.mutate();
    }
  }, [user?.id, pool?.id, isMember, joinPool.isPending]);

  function copyLink() {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: `Liga "${pool?.name}"`, text: "Junta-te ao meu torneio no Ultima Geração 🏆", url });
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Link copiado!");
    }
  }

  function shareWhatsApp() {
    const url = window.location.href;
    const text = encodeURIComponent(`🏆 Junta-te ao meu torneio "${pool?.name}" no Ultima Geração!\nVota no Mundial 2026 e compete comigo: ${url}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-wc-red border-t-transparent" />
      </div>
    );
  }

  if (!pool) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-5 text-center">
        <h2 className="font-display text-2xl">Liga não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">O código <span className="font-mono font-bold">{code}</span> não corresponde a nenhuma liga.</p>
        <Link to="/ligas" className="mt-4 text-sm font-bold text-wc-red hover:underline">← Voltar às ligas</Link>
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
          <h1 className="font-display text-[clamp(2rem,8vw,3.5rem)] leading-none text-white">{pool.name}</h1>

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
      {!user && (
        <div className="mx-5 mt-5 md:mx-8 overflow-hidden rounded-2xl bg-wc-green panini-stripes" style={{ boxShadow: "0 6px 24px -4px oklch(0.55 0.20 142 / 0.35)" }}>
          <div className="p-5 text-white">
            <p className="font-display text-xl mb-1">Foste convidado!</p>
            <p className="text-sm text-white/80 mb-4">
              Cria uma conta gratuita em menos de 1 minuto, entra no torneio e começa a votar nos jogos do Mundial 2026.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to="/auth"
                search={{ redirect: `/liga/${code}` } as any}
                className="block w-full rounded-xl bg-white py-3 text-center text-sm font-bold text-wc-green shadow-elegant transition-smooth hover:scale-[1.01]"
              >
                Criar conta grátis e entrar no torneio
              </Link>
              <Link
                to="/auth"
                search={{ redirect: `/liga/${code}` } as any}
                className="block w-full rounded-xl border border-white/30 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/10 transition-smooth"
              >
                Já tenho conta — entrar
              </Link>
            </div>
            <p className="mt-3 text-center text-[11px] text-white/60">Grátis. Sem apostas. Só diversão.</p>
          </div>
        </div>
      )}

      {/* ── JOIN (autenticado, não membro) ───────────────────── */}
      {user && isMember === false && (
        <div className="mx-5 mt-5 md:mx-8 overflow-hidden rounded-2xl bg-wc-green panini-stripes" style={{ boxShadow: "0 6px 24px -4px oklch(0.55 0.20 142 / 0.35)" }}>
          <div className="flex items-center justify-between gap-3 p-5 text-white">
            <div>
              <p className="font-semibold">Aceitas o desafio?</p>
              <p className="text-sm text-white/80">Junta-te ao torneio e compete a partir de agora.</p>
            </div>
            <button
              onClick={() => joinPool.mutate()}
              disabled={joinPool.isPending}
              className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-wc-green disabled:opacity-50 transition-smooth hover:scale-[1.02]"
            >
              Entrar no Torneio
            </button>
          </div>
        </div>
      )}

      {/* ── O MEU RANKING (membro, fora do top 3) ────────────── */}
      {user && isMember && myRank >= 3 && ranking[myRank] && (
        <div className="mx-5 mt-5 md:mx-8">
          <div className="flex items-center gap-3 rounded-2xl border-2 border-wc-red/40 bg-wc-red/5 px-4 py-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-wc-red font-display text-sm text-white">
              {myRank + 1}
            </span>
            <Avatar name={(ranking[myRank] as any).display_name} size="sm" />
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
                <Avatar name={(podium[1] as any).display_name} size="md" />
                <p className="text-center text-xs font-semibold leading-tight line-clamp-1 max-w-[80px]">{(podium[1] as any).display_name}</p>
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
                  <Avatar name={(podium[0] as any).display_name} size="lg" />
                  <span className="absolute -top-2 -right-1 text-lg">👑</span>
                </div>
                <p className="text-center text-xs font-bold leading-tight line-clamp-1 max-w-[80px]">{(podium[0] as any).display_name}</p>
                <p className="font-display text-base text-gold font-bold">{(podium[0] as any).total_points} pts</p>
                <div className={`w-full ${PODIUM_H[0]} ${PODIUM_BG[0]} rounded-t-xl flex items-start justify-center pt-2 trophy-shine`}>
                  <span className="text-2xl">🥇</span>
                </div>
              </div>
            )}
            {/* 3º lugar */}
            {podium[2] && (
              <div className="flex flex-1 flex-col items-center gap-2">
                <Avatar name={(podium[2] as any).display_name} size="md" />
                <p className="text-center text-xs font-semibold leading-tight line-clamp-1 max-w-[80px]">{(podium[2] as any).display_name}</p>
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

                    <Avatar name={r.display_name} size="sm" />

                    {/* Nome + barra de progresso */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold">{r.display_name}</span>
                        {isMe && <span className="shrink-0 text-[9px] font-bold text-wc-red uppercase tracking-wider">Tu</span>}
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
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── VOTAR NOS JOGOS ──────────────────────────────────── */}
      {user && isMember && (
        <div className="mx-5 mt-4 md:mx-8">
          <Link
            to="/jogos"
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
    </div>
  );
}

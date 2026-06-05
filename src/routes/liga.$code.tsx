import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/useAuth";
import { Trophy, Users, Copy, Check, ArrowLeft, Gift } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/liga/$code")({
  component: LigaPage,
});

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

      // Buscar nome de cada membro
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);

      // Para cada membro, somar só os pontos de previsões feitas APÓS entrar na liga
      const results = await Promise.all(
        members.map(async (member) => {
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
      if (error?.code === "23505") return; // já membro, ignorar silenciosamente
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

  // Auto-join quando o utilizador acaba de fazer login via link de convite
  useEffect(() => {
    if (user && pool && isMember === false && !joinPool.isPending) {
      joinPool.mutate();
    }
  }, [user?.id, pool?.id, isMember]);

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
    const url = window.location.href;
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

  if (!pool) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-5 text-center">
        <h2 className="font-display text-2xl">Liga não encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">O código <span className="font-mono font-bold">{code}</span> não corresponde a nenhuma liga.</p>
        <Link to="/ligas" className="mt-4 text-sm font-bold text-wc-red hover:underline">← Voltar às ligas</Link>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-10 max-w-2xl">
      {/* Header */}
      <Link to="/ligas" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Torneios
      </Link>

      <div className="mb-6 overflow-hidden rounded-2xl bg-wc-red panini-stripes" style={{ boxShadow: "0 6px 24px -4px oklch(0.54 0.24 27 / 0.40)" }}>
        <div className="p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Torneio Privado</p>
              <h1 className="font-display text-3xl leading-tight">{pool.name}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-white/70">
                <Users className="h-3.5 w-3.5" />
                {ranking.length} membro{ranking.length !== 1 ? "s" : ""} · código: <span className="font-mono font-bold text-white">{pool.code}</span>
              </p>
              {pool.prize && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white">
                  <Gift className="h-3.5 w-3.5" /> {pool.prize}
                </p>
              )}
            </div>
            <Trophy className="h-10 w-10 shrink-0 text-white/30" />
          </div>

          {/* Botões de partilha */}
          <div className="mt-4 flex gap-2">
            <button
              onClick={shareWhatsApp}
              className="flex items-center gap-1.5 rounded-xl bg-[#25D366] px-3 py-2 text-xs font-bold text-white"
            >
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.524 5.851L0 24l6.336-1.498A11.96 11.96 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.373l-.36-.214-3.727.881.933-3.625-.235-.372A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z"/></svg>
              Partilhar no WhatsApp
            </button>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 rounded-xl bg-white/20 px-3 py-2 text-xs font-bold text-white hover:bg-white/30 transition-smooth"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado!" : "Copiar link"}
            </button>
          </div>
        </div>
      </div>

      {/* Não autenticado — experiência de convite */}
      {!user && (
        <div className="mb-6 overflow-hidden rounded-2xl bg-wc-green panini-stripes" style={{ boxShadow: "0 6px 24px -4px oklch(0.55 0.20 142 / 0.35)" }}>
          <div className="p-5 text-white">
            <p className="font-display text-xl mb-1">Foste convidado!</p>
            <p className="text-sm text-white/80 mb-4">
              Cria uma conta gratuita em menos de 1 minuto, entra no torneio e começa a votar nos jogos do Mundial 2026.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                to="/auth"
                search={{ redirect: `/liga/${code}` } as any}
                className="block w-full rounded-xl bg-white py-3 text-center text-sm font-bold text-wc-green shadow-elegant"
              >
                Criar conta grátis e entrar no torneio
              </Link>
              <Link
                to="/auth"
                search={{ redirect: `/liga/${code}` } as any}
                className="block w-full rounded-xl border border-white/30 py-2.5 text-center text-sm font-semibold text-white"
              >
                Já tenho conta — entrar
              </Link>
            </div>
            <p className="mt-3 text-center text-[11px] text-white/60">Grátis. Sem apostas. Só diversão.</p>
          </div>
        </div>
      )}

      {/* Autenticado mas ainda não membro */}
      {user && !isMember && (
        <div className="mb-6 overflow-hidden rounded-2xl bg-wc-green panini-stripes" style={{ boxShadow: "0 6px 24px -4px oklch(0.55 0.20 142 / 0.35)" }}>
          <div className="flex items-center justify-between gap-3 p-5 text-white">
            <div>
              <p className="font-semibold">Aceitas o desafio?</p>
              <p className="text-sm text-white/80">Junta-te ao torneio e compete a partir de agora.</p>
            </div>
            <button
              onClick={() => joinPool.mutate()}
              disabled={joinPool.isPending}
              className="shrink-0 rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-wc-green disabled:opacity-50"
            >
              Entrar no Torneio
            </button>
          </div>
        </div>
      )}

      {/* Ranking da liga */}
      <h2 className="mb-3 font-display text-xl">Ranking da Liga</h2>
      <div className="overflow-hidden rounded-2xl border border-border bg-card/70">
        {ranking.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="font-display text-lg">Ainda sem membros</p>
            <p className="text-sm text-muted-foreground">Convida os teus amigos para começar.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Adepto</th>
                <th className="px-2 py-2 text-right">Pts</th>
                <th className="px-2 py-2 text-right">Acertos</th>
                <th className="px-2 py-2 text-right hidden sm:table-cell">%</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r: any, i: number) => {
                const acc = r.predictions_made > 0
                  ? Math.round((r.predictions_correct / r.predictions_made) * 100)
                  : 0;
                const isMe = r.id === user?.id;
                return (
                  <tr key={r.id} className={`border-t border-border ${isMe ? "bg-wc-red/5" : ""}`}>
                    <td className="px-3 py-2.5">
                      <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                        i === 0 ? "bg-gold text-background" : i < 3 ? "bg-gold/30 text-gold" : "bg-secondary"
                      }`}>{i + 1}</span>
                    </td>
                    <td className="px-3 py-2.5 font-medium">
                      {r.display_name ?? "Adepto"}
                      {isMe && <span className="ml-1.5 text-[10px] font-bold text-wc-red">Tu</span>}
                    </td>
                    <td className="px-2 py-2.5 text-right font-display text-gold">{r.total_points ?? 0}</td>
                    <td className="px-2 py-2.5 text-right text-muted-foreground">{r.predictions_correct ?? 0}/{r.predictions_made ?? 0}</td>
                    <td className="px-2 py-2.5 text-right text-muted-foreground hidden sm:table-cell">{acc}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

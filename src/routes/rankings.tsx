import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, TrendingUp, TrendingDown, Minus, Share2 } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/AvatarPicker";
import { useAuth } from "@/lib/useAuth";

function RankTrend({ userId, currentRank }: { userId: string; currentRank: number }) {
  const key = `rank_prev_${userId}`;
  const [prev, setPrev] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(key);
    if (stored) setPrev(Number(stored));
    localStorage.setItem(key, String(currentRank));
  }, [key, currentRank]);

  if (!prev || prev === currentRank) return <Minus className="h-3 w-3 text-muted-foreground" />;
  if (currentRank < prev) return <TrendingUp className="h-3 w-3 text-green-400" />;
  return <TrendingDown className="h-3 w-3 text-red-400" />;
}

const PHASES = [
  { key: "geral", label: "Ranking Geral" },
  { key: "grupos", label: "Fase de Grupos" },
  { key: "oitavos", label: "Oitavos" },
  { key: "quartos", label: "Quartos" },
  { key: "meias", label: "Meias-Finais" },
] as const;

export const Route = createFileRoute("/rankings")({
  head: () => ({
    meta: [
      { title: "Rankings — Uma Geração" },
      { name: "description", content: "Vê o ranking dos adeptos por fase do Mundial." },
    ],
  }),
  component: Rankings,
});

function Rankings() {
  const [phase, setPhase] = useState<typeof PHASES[number]["key"]>("geral");
  const { user } = useAuth();

  const { data: rows = [] } = useQuery({
    queryKey: ["ranking", phase],
    queryFn: async () => {
      if (phase === "geral") {
        const { data } = await supabase
          .from("profiles")
          .select("id,display_name,avatar_url,total_points,predictions_made,predictions_correct")
          .order("total_points", { ascending: false })
          .limit(5);
        return (data ?? []).map((r) => ({
          id: r.id,
          display_name: r.display_name,
          avatar_url: (r as any).avatar_url,
          points: r.total_points,
          predictions_made: r.predictions_made,
          predictions_correct: r.predictions_correct,
        }));
      }

      // Ranking por fase: usar !inner para filtrar por fase do jogo
      const { data: preds } = await supabase
        .from("predictions")
        .select("user_id,points,match:match_id!inner(phase)")
        .eq("match.phase", phase);

      if (!preds || preds.length === 0) return [];

      // Agregar por utilizador
      const map: Record<string, { points: number; made: number; correct: number }> = {};
      for (const p of preds) {
        if (!map[p.user_id]) map[p.user_id] = { points: 0, made: 0, correct: 0 };
        map[p.user_id].points += p.points ?? 0;
        map[p.user_id].made += 1;
        if ((p.points ?? 0) > 0) map[p.user_id].correct += 1;
      }

      const userIds = Object.keys(map);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url")
        .in("id", userIds);

      return (profiles ?? [])
        .map((pr) => ({
          id: pr.id,
          display_name: pr.display_name,
          avatar_url: (pr as any).avatar_url,
          points: map[pr.id]?.points ?? 0,
          predictions_made: map[pr.id]?.made ?? 0,
          predictions_correct: map[pr.id]?.correct ?? 0,
        }))
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          const accA = a.predictions_made > 0 ? a.predictions_correct / a.predictions_made : 0;
          const accB = b.predictions_made > 0 ? b.predictions_correct / b.predictions_made : 0;
          if (accB !== accA) return accB - accA;
          return a.predictions_made - b.predictions_made;
        })
        .slice(0, 5);
    },
  });

  // Posição do utilizador autenticado — sempre mostrada no fundo
  const myEntry = rows.find(r => r.id === user?.id);
  const myRank  = myEntry ? rows.indexOf(myEntry) + 1 : null;

  const { data: myPosition } = useQuery({
    queryKey: ["my-rank", phase, user?.id],
    enabled: !!user?.id && rows.length > 0,
    queryFn: async () => {
      if (phase === "geral") {
        const { data: me } = await supabase
          .from("profiles")
          .select("id,display_name,avatar_url,total_points,predictions_made,predictions_correct")
          .eq("id", user!.id)
          .maybeSingle();
        if (!me) return null;
        const { count } = await supabase
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .gt("total_points", me.total_points);
        return {
          id: me.id,
          display_name: me.display_name,
          avatar_url: (me as any).avatar_url,
          points: me.total_points,
          predictions_made: me.predictions_made,
          predictions_correct: me.predictions_correct,
          rank: (count ?? 0) + 1,
        };
      }
      return null;
    },
  });

  return (
    <div className="px-5 pt-6">
      <header className="mb-5">
        <h1 className="font-display text-3xl">Rankings</h1>
        <p className="text-sm text-muted-foreground">Compete por fase do Mundial e ganha prémios.</p>
      </header>

      <div className="mb-5 -mx-5 overflow-x-auto px-5">
        <div className="flex gap-2">
          {PHASES.map((p) => (
            <button
              key={p.key}
              onClick={() => setPhase(p.key)}
              className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-smooth ${
                phase === p.key
                  ? "border-gold bg-gold text-background"
                  : "border-border bg-card/60 text-muted-foreground hover:border-gold/40"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Partilhar posição */}
      {user && (myRank || myPosition) && (
        <div className="mb-4">
          <button
            onClick={() => {
              const rank = myRank ?? myPosition?.rank;
              const pts  = myRank ? rows[myRank - 1]?.points : myPosition?.points;
              const text = `Estou em ${rank}º lugar com ${pts} pontos no ranking do Uma Geração 🏆\nVota no Mundial 2026: ${window.location.origin}/rankings`;
              if (navigator.share) {
                navigator.share({ title: "O meu ranking — Uma Geração", text, url: `${window.location.origin}/rankings` });
              } else {
                navigator.clipboard.writeText(text);
                toast.success("Texto copiado para partilhar!");
              }
            }}
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold hover:bg-gold/20 transition-smooth"
          >
            <Share2 className="h-3.5 w-3.5" />
            Partilhar a minha posição
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card/70">
        {rows.length === 0 ? (
          <div className="p-10 text-center">
            <Trophy className="mx-auto mb-2 h-8 w-8 text-gold" />
            <p className="font-display text-lg">Ainda sem ranking</p>
            <p className="text-sm text-muted-foreground">Sê o primeiro a votar para subir ao topo.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Adepto</th>
                <th className="px-2 py-2 text-right">Pts</th>
                <th className="px-2 py-2 text-right">Acertos</th>
                <th className="px-2 py-2 text-right">%</th>
                <th className="px-2 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const acc = r.predictions_made > 0
                  ? Math.round((r.predictions_correct / r.predictions_made) * 100)
                  : 0;
                const isMe = r.id === user?.id;
                return (
                  <tr key={r.id} className={`border-t border-border ${isMe ? "bg-gold/5" : ""}`}>
                    <td className="px-3 py-2.5">
                      <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${
                        i === 0 ? "bg-gold text-background" : i < 3 ? "bg-gold/30 text-gold" : isMe ? "bg-wc-red/20 text-wc-red" : "bg-secondary"
                      }`}>{i + 1}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <UserAvatar avatarUrl={(r as any).avatar_url} name={r.display_name} size={7} className="rounded-full" />
                        <span className={`font-medium ${isMe ? "text-wc-red" : ""}`}>{r.display_name ?? "Adepto"}{isMe && " (tu)"}</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-right font-display text-gold">{r.points}</td>
                    <td className="px-2 py-2.5 text-right text-muted-foreground">{r.predictions_correct}/{r.predictions_made}</td>
                    <td className="px-2 py-2.5 text-right text-muted-foreground">{acc}%</td>
                    <td className="px-2 py-2.5 text-right">
                      {isMe && user && <RankTrend userId={user.id} currentRank={i + 1} />}
                    </td>
                  </tr>
                );
              })}

              {/* Posição do utilizador fora do top 5 */}
              {myPosition && (
                <>
                  <tr className="border-t border-border">
                    <td colSpan={5} className="px-3 py-1 text-center text-[10px] text-muted-foreground tracking-widest">
                      · · ·
                    </td>
                  </tr>
                  <tr className="border-t border-wc-red/20 bg-wc-red/5">
                    <td className="px-3 py-2.5">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-wc-red/20 text-xs font-bold text-wc-red">
                        {myPosition.rank}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <UserAvatar avatarUrl={myPosition.avatar_url} name={myPosition.display_name} size={7} className="rounded-full" />
                        <span className="font-medium text-wc-red">{myPosition.display_name ?? "Tu"} (tu)</span>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 text-right font-display text-gold">{myPosition.points}</td>
                    <td className="px-2 py-2.5 text-right text-muted-foreground">{myPosition.predictions_correct}/{myPosition.predictions_made}</td>
                    <td className="px-2 py-2.5 text-right text-muted-foreground">
                      {myPosition.predictions_made > 0 ? Math.round((myPosition.predictions_correct / myPosition.predictions_made) * 100) : 0}%
                    </td>
                    <td className="px-2 py-2.5 text-right">
                      {user && <RankTrend userId={user.id} currentRank={myPosition.rank} />}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card/50 p-5 text-xs text-muted-foreground">
        <h3 className="mb-2 font-display text-base text-foreground">Critérios de desempate</h3>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Maior pontuação total.</li>
          <li>Maior percentagem de acerto.</li>
          <li>Menor número de previsões feitas.</li>
          <li>Quem submeteu primeiro a previsão.</li>
        </ol>
      </div>
    </div>
  );
}

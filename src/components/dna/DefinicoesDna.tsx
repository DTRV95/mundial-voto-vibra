import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Heart, Lock, AlertTriangle } from "lucide-react";
import {
  useClubeFavorito, useDefinirClubeFavorito,
  usePreferencias, useGuardarPreferencias,
} from "@/lib/useDna";

/**
 * Clube favorito e privacidade, dentro do perfil.
 *
 * O clube favorito serve para as métricas de clubismo — e por isso
 * só pode mudar uma vez por época, com o histórico a garantir que
 * os dados passados continuam a apontar para o clube da altura.
 */
export function DefinicoesDna({ userId }: { userId: string | undefined }) {
  const { data: clube } = useClubeFavorito(userId);
  const { data: prefs } = usePreferencias(userId);
  const definir = useDefinirClubeFavorito(userId);
  const guardar = useGuardarPreferencias(userId);
  const [aEscolher, setAEscolher] = useState(false);

  const { data: clubes = [] } = useQuery({
    queryKey: ["clubes-favorito"],
    enabled: aEscolher,
    staleTime: 600_000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("teams")
        .select("id,name,short_name,crest_url")
        .eq("kind", "club")
        .order("name");
      return (data ?? []) as any[];
    },
  });

  if (!userId) return null;

  function escolher(teamId: string | null) {
    definir.mutate(teamId, {
      onSuccess: (r: any) => {
        setAEscolher(false);
        toast.success(r?.inicial ? "Clube favorito definido." : "Clube favorito alterado.");
      },
      onError: (e: any) => toast.error(e.message),
    });
  }

  return (
    <section className="mb-8 space-y-3">
      <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-muted-foreground">
        <Heart className="h-4 w-4" /> Clube e privacidade
      </h2>

      {/* Clube favorito */}
      <div className="rounded-2xl border border-border bg-card/70 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {clube?.crest_url
              ? <img src={clube.crest_url} alt="" className="h-9 w-9 object-contain" />
              : <span className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground">—</span>}
            <div className="min-w-0">
              <p className="text-sm font-bold">{clube?.nome ?? "Sem clube favorito"}</p>
              <p className="text-[11px] text-muted-foreground">
                {clube?.team_id
                  ? "Usado para perceber se o coração te atrapalha as previsões."
                  : "Opcional. Ajuda-nos a perceber se o clubismo te afeta."}
              </p>
            </div>
          </div>
          <button onClick={() => setAEscolher(v => !v)}
            className="shrink-0 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-smooth hover:text-foreground">
            {clube?.team_id ? "Mudar" : "Escolher"}
          </button>
        </div>

        {aEscolher && (
          <div className="mt-4 border-t border-border pt-4">
            {clube?.jaAlterou ? (
              <p className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                Já alteraste o teu clube favorito esta época. Podes voltar a mudar na próxima.
              </p>
            ) : (
              <>
                {!clube?.primeiraVez && (
                  <p className="mb-3 rounded-xl border border-gold/30 bg-gold/5 px-3 py-2 text-[11px] text-muted-foreground">
                    Podes alterar o teu clube favorito apenas uma vez por época. Esta alteração
                    não modifica os teus dados nem os resumos anteriores.
                  </p>
                )}
                <div className="grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-3">
                  {clubes.map(c => (
                    <button key={c.id} onClick={() => escolher(c.id)}
                      disabled={definir.isPending}
                      className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-smooth disabled:opacity-50 ${
                        c.id === clube?.team_id
                          ? "border-gold bg-gold/10" : "border-border hover:border-gold/40"
                      }`}>
                      {c.crest_url && <img src={c.crest_url} alt="" className="h-6 w-6 shrink-0 object-contain" />}
                      <span className="truncate text-xs font-semibold">{c.short_name ?? c.name}</span>
                    </button>
                  ))}
                </div>
                {clube?.team_id && (
                  <button onClick={() => escolher(null)} disabled={definir.isPending}
                    className="mt-3 text-xs font-semibold text-muted-foreground hover:text-destructive">
                    Remover clube favorito
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Privacidade */}
      <div className="rounded-2xl border border-border bg-card/70 p-4">
        <p className="mb-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Lock className="h-3.5 w-3.5" /> O que os outros veem
        </p>
        <div className="space-y-1">
          {([
            ["dna_publico", "O meu DNA no perfil público", "Perfil principal e traço secundário."],
            ["talisma_publico", "A minha equipa-talismã", "A equipa em que acertas mais."],
            ["aceita_rival", "Participar no rival do mês", "Serás emparelhado com alguém do teu nível."],
          ] as const).map(([chave, titulo, nota]) => {
            const ligado = prefs?.[chave] ?? true;
            return (
              <button key={chave}
                onClick={() => guardar.mutate({ [chave]: !ligado })}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-2 py-2.5 text-left transition-smooth hover:bg-accent/40">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{titulo}</p>
                  <p className="text-[11px] text-muted-foreground">{nota}</p>
                </div>
                <span className={`h-5 w-9 shrink-0 rounded-full p-0.5 transition-smooth ${ligado ? "bg-gold" : "bg-border"}`}>
                  <span className={`block h-4 w-4 rounded-full bg-white transition-transform ${ligado ? "translate-x-4" : ""}`} />
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          A equipa-fantasma, o rival, a missão e os teus pontos fracos são sempre privados.
        </p>
      </div>
    </section>
  );
}

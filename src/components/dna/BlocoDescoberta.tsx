import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, X } from "lucide-react";
import type { Competition } from "@/lib/useCompetitions";
import type { DnaCompleto } from "@/lib/useDnaCompleto";
import { frasesRelacao } from "@/lib/dnaMotor";

/**
 * Bloco 3 — A última descoberta.
 *
 * Mostra UMA coisa de cada vez, a de maior prioridade que esteja
 * válida e por ver. É o que cria a sensação de haver sempre algo
 * novo sem encher a página de cartões.
 *
 * As descobertas não são guardadas — vivem nas tabelas de origem.
 * Só se guarda o que já foi visto.
 */

interface Descoberta {
  chave: string;
  etiqueta: string;
  titulo: string;
  detalhe: string;
  emblema?: string | null;
}

/** Chaves já vistas por este utilizador. */
function useJaVistas(userId: string | undefined) {
  return useQuery({
    queryKey: ["descobertas-vistas", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<Set<string>> => {
      const { data } = await (supabase as any)
        .from("user_discovery_seen").select("chave").eq("user_id", userId);
      return new Set(((data ?? []) as any[]).map(l => l.chave));
    },
  });
}

/**
 * Escolhe a descoberta a mostrar, por ordem de prioridade.
 * As de prioridade 1 a 6 chegam nas fases seguintes; por agora
 * existem o talismã, o fantasma e o Contra a Bancada.
 */
function escolher(dna: DnaCompleto, vistas: Set<string>): Descoberta | null {
  const candidatas: Descoberta[] = [];

  if (dna.talisma) {
    candidatas.push({
      chave: `talisma:${dna.talisma.team_id}`,
      etiqueta: "Descoberta",
      titulo: `O ${dna.talisma.nome} é a equipa que melhor interpretas`,
      detalhe: frasesRelacao(dna.talisma.nome, dna.talisma, "talisma"),
      emblema: dna.talisma.crest,
    });
  }

  if (dna.fantasma) {
    candidatas.push({
      chave: `fantasma:${dna.fantasma.team_id}`,
      etiqueta: "Descoberta",
      titulo: `O ${dna.fantasma.nome} é a tua equipa-fantasma`,
      detalhe: frasesRelacao(dna.fantasma.nome, dna.fantasma, "fantasma"),
      emblema: dna.fantasma.crest,
    });
  }

  if (dna.clube) {
    candidatas.push({
      chave: `clube:${dna.clube.acertoNoClube}-${dna.clube.acertoFora}`,
      etiqueta: "O coração e a cabeça",
      titulo: dna.clube.acertoNoClube < dna.clube.acertoFora
        ? "O teu clube atrapalha-te as previsões"
        : "Não deixas o coração decidir",
      detalhe: `Nos jogos do ${dna.clube.nome} acertas ${dna.clube.acertoNoClube}%. Nos restantes, ${dna.clube.acertoFora}%.`,
    });
  }

  if (dna.bancada && dna.bancada.contra >= 5) {
    candidatas.push({
      chave: `bancada:${dna.bancada.avaliadas}`,
      etiqueta: "Contra a Bancada",
      titulo: `Quando discordas da maioria, acertas ${dna.bancada.acertoContra}%`,
      detalhe: `Já foste contra a bancada ${dna.bancada.contra} vezes em ${dna.bancada.avaliadas} previsões.`,
    });
  }

  if (candidatas.length === 0) return null;

  // Primeiro as que ainda não foram vistas; se todas foram, mostra
  // a primeira na mesma, sem o realce de novidade.
  return candidatas.find(c => !vistas.has(c.chave)) ?? candidatas[0];
}

export function BlocoDescoberta({ userId, dna, comp }: {
  userId: string | undefined;
  dna: DnaCompleto;
  comp: Competition | null;
}) {
  const { data: vistas = new Set<string>() } = useJaVistas(userId);
  const qc = useQueryClient();

  const marcar = useMutation({
    mutationFn: async (chave: string) => {
      await (supabase as any)
        .from("user_discovery_seen")
        .upsert({ user_id: userId, chave }, { onConflict: "user_id,chave" });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["descobertas-vistas", userId] }),
  });

  const d = escolher(dna, vistas);
  if (!d) return null;   // sem conteúdo verdadeiro, o bloco não existe

  const nova = !vistas.has(d.chave);
  const cor = comp?.electric ?? "var(--gold)";

  return (
    <section className={`relative overflow-hidden rounded-2xl border bg-card/70 p-5 ${
      nova ? "animate-enter" : ""
    }`} style={{ borderColor: nova ? `${cor}55` : "var(--border)" }}>

      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: cor }}>
          <Sparkles className="h-3 w-3" />
          {d.etiqueta}
        </span>
        {nova && (
          <button onClick={() => marcar.mutate(d.chave)}
            title="Já vi"
            className="text-muted-foreground transition-smooth hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex items-start gap-3.5">
        {d.emblema && (
          <img src={d.emblema} alt="" className="h-11 w-11 shrink-0 object-contain" />
        )}
        <div className="min-w-0">
          <p className="font-display text-lg leading-tight">{d.titulo}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{d.detalhe}</p>
        </div>
      </div>
    </section>
  );
}

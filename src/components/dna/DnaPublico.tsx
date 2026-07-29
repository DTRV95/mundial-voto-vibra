import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SimboloPerfil } from "@/components/dna/SimboloPerfil";
import { PERFIS } from "@/lib/dnaPerfis";
import { useDnaCompleto } from "@/lib/useDnaCompleto";
import { useActiveCompetition } from "@/lib/useActiveCompetition";

/**
 * O DNA de outra pessoa.
 *
 * Só aparece o que é público: perfil, traço e equipa-talismã. O
 * fantasma, o rival, a missão e os pontos fracos nunca saem daqui.
 *
 * Se a pessoa tiver isto privado, o componente não devolve nada —
 * não há qualquer indicação de que escondeu alguma coisa.
 */
export function DnaPublico({ userId }: { userId: string }) {
  const { active: comp } = useActiveCompetition();

  const { data: prefs } = useQuery({
    queryKey: ["prefs-publicas", userId],
    staleTime: 300_000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("v_dna_publico")
        .select("dna_publico,talisma_publico")
        .eq("user_id", userId)
        .maybeSingle();
      // Sem registo, valem os valores por omissão
      return data ?? { dna_publico: true, talisma_publico: true };
    },
  });

  const { data: dna } = useDnaCompleto(prefs?.dna_publico ? userId : undefined);

  if (!prefs?.dna_publico) return null;
  if (!dna?.atribuicao) return null;

  const p = PERFIS[dna.atribuicao.perfil];
  const eletrico = comp?.electric ?? "var(--gold)";
  const mostraTalisma = prefs.talisma_publico && dna.talisma;

  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4">
      <div className="flex items-start gap-3.5">
        <SimboloPerfil perfil={dna.atribuicao.perfil} cor={eletrico} tamanho={44} />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            DNA
          </p>
          <p className="font-display text-lg leading-tight">{p.nome}</p>
          {dna.atribuicao.traco && (
            <p className="text-xs text-muted-foreground">
              {PERFIS[dna.atribuicao.traco].traco}
            </p>
          )}
          <p className="mt-1.5 text-sm text-muted-foreground">{p.descricao}</p>
        </div>
      </div>

      {mostraTalisma && (
        <div className="mt-3 flex items-center gap-2.5 border-t border-border/60 pt-3">
          {dna.talisma!.crest && (
            <img src={dna.talisma!.crest} alt="" className="h-7 w-7 shrink-0 object-contain" />
          )}
          <p className="text-xs text-muted-foreground">
            Equipa-talismã: <strong className="text-foreground">{dna.talisma!.nome}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

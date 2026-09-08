import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { nomeCurto } from "@/lib/clubBadge";
import { toast } from "sonner";

/**
 * Votar sem abrir o jogo.
 *
 * Uma jornada de oito jogos com quatro mercados cada dá quarenta
 * decisões, espalhadas por oito páginas. Ninguém faz isso a caminho do
 * trabalho — e foi isso que as pessoas disseram: cansam-se só de pensar
 * nisso.
 *
 * Aqui é um toque por jogo: casa, empate ou fora. Oito toques e a
 * jornada está entregue, com a maior parte dos pontos garantidos — o
 * resultado vale 3 ou 4, contra 2 dos golos e 2 do ambas marcam.
 *
 * Quem quiser os outros mercados abre o jogo e faz o resto. O caminho
 * longo continua lá; deixou é de ser o único.
 */
export function VotoRapido({ matchId, casa, fora, escolhaAtual, corCasa, corFora }: {
  matchId: string;
  casa: string;
  fora: string;
  /** O que já lá está: "home" | "draw" | "away" */
  escolhaAtual?: string | null;
  corCasa: string;
  corFora: string;
}) {
  const qc = useQueryClient();
  const [otimista, setOtimista] = useState<string | null>(escolhaAtual ?? null);

  const guardar = useMutation({
    mutationFn: async (escolha: string) => {
      const { data: sessao } = await supabase.auth.getUser();
      const uid = sessao.user?.id;
      if (!uid) throw new Error("Sem sessão iniciada.");

      const { error } = await supabase
        .from("predictions")
        .upsert({ user_id: uid, match_id: matchId, result_90: escolha } as any,
                { onConflict: "user_id,match_id" });
      if (error) throw new Error(error.message);
      return escolha;
    },
    onError: (e: any) => {
      setOtimista(escolhaAtual ?? null);   // desfaz o que se mostrou
      toast.error(e?.message ?? "Não deu para guardar.");
    },
    onSuccess: () => {
      // A jornada e os contadores mudaram; deixa-os ir buscar de novo.
      qc.invalidateQueries({ queryKey: ["jornadas-oficiais"] });
    },
  });

  const opcoes: { valor: string; rotulo: string; cor?: string }[] = [
    { valor: "home", rotulo: nomeCurto(casa), cor: corCasa },
    { valor: "draw", rotulo: "Empate" },
    { valor: "away", rotulo: nomeCurto(fora), cor: corFora },
  ];

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {opcoes.map(o => {
        const ativo = otimista === o.valor;
        const aGravar = guardar.isPending && guardar.variables === o.valor;
        return (
          <button
            key={o.valor}
            onClick={e => {
              // O cartão inteiro é um link; sem isto, votar navegava.
              e.preventDefault();
              e.stopPropagation();
              if (ativo) return;
              setOtimista(o.valor);
              guardar.mutate(o.valor);
            }}
            className={`flex min-w-0 items-center justify-center gap-1 rounded-xl border px-1 py-2 text-[11px] font-bold transition-smooth ${
              ativo ? "text-white" : "border-border bg-card/60 text-muted-foreground hover:border-foreground/25 hover:text-foreground"
            }`}
            style={ativo
              ? { background: o.cor ?? "var(--foreground)", borderColor: o.cor ?? "var(--foreground)" }
              : undefined}
          >
            {aGravar
              ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
              : ativo && <Check className="h-3 w-3 shrink-0" strokeWidth={3} />}
            <span className="truncate">{o.rotulo}</span>
          </button>
        );
      })}
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users2, AlertTriangle, X } from "lucide-react";

/**
 * Contra a Bancada — a consulta da opinião da comunidade.
 *
 * Regra combinada: a previsão faz-se às cegas. Depois de guardada,
 * podes espreitar a bancada — mas isso marca a previsão como
 * informada, em definitivo e para o jogo inteiro, mesmo que a
 * mudes a seguir.
 *
 * A consequência é dita ANTES, e é preciso confirmar. Nada disto
 * bloqueia a alteração da previsão até ao fecho.
 */

export interface LinhaBancada {
  mercado: string;
  escolha: string;
  votos: number;
  total: number;
  percentagem: number;
}

/** Botão + confirmação. Só aparece depois de haver previsão guardada. */
export function BotaoVerBancada({ matchId, aoRevelar }: {
  matchId: string;
  aoRevelar: (linhas: LinhaBancada[]) => void;
}) {
  const [aConfirmar, setAConfirmar] = useState(false);
  const qc = useQueryClient();

  const ver = useMutation({
    mutationFn: async (): Promise<LinhaBancada[]> => {
      const { data, error } = await (supabase as any).rpc("ver_bancada", { p_match_id: matchId });
      if (error) throw new Error(error.message);
      return (data ?? []) as LinhaBancada[];
    },
    onSuccess: (linhas) => {
      setAConfirmar(false);
      if (linhas.length === 0) {
        toast("Ainda não há votos suficientes neste jogo.");
        return;
      }
      aoRevelar(linhas);
      qc.invalidateQueries({ queryKey: ["prediction", matchId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!aConfirmar) {
    return (
      <button onClick={() => setAConfirmar(true)}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2.5 text-sm font-bold text-muted-foreground transition-smooth hover:border-gold/40 hover:text-foreground">
        <Users2 className="h-4 w-4" />
        Ver a opinião da bancada
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-gold/40 bg-gold/5 p-4">
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Antes de veres</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Ao consultares a opinião da bancada, as tuas previsões deste jogo deixam de
            contar para o teu <strong className="text-foreground">Índice Contra a Bancada</strong>,
            mesmo que sejam alteradas depois.
          </p>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Podes na mesma mudar a previsão até ao fecho.
          </p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <button onClick={() => setAConfirmar(false)}
          className="flex-1 rounded-xl border border-border py-2 text-xs font-bold text-muted-foreground">
          Continuar às cegas
        </button>
        <button onClick={() => ver.mutate()} disabled={ver.isPending}
          className="flex-1 rounded-xl bg-gold py-2 text-xs font-bold text-background shadow-gold disabled:opacity-50">
          {ver.isPending ? "A abrir…" : "Ver na mesma"}
        </button>
      </div>
    </div>
  );
}

const ROTULO_MERCADO: Record<string, string> = {
  r90: "Resultado", btts: "Ambas marcam", t25: "Golos",
};

const ROTULO_ESCOLHA: Record<string, string> = {
  home: "Casa", draw: "Empate", away: "Fora",
  yes: "Sim", no: "Não", over: "Mais de 2.5", under: "Menos de 2.5",
};

/** A distribuição, depois de revelada. */
export function PainelBancada({ linhas, aMinha, aoFechar }: {
  linhas: LinhaBancada[];
  /** A escolha do utilizador em cada mercado, para se destacar */
  aMinha: Record<string, string | null>;
  aoFechar?: () => void;
}) {
  if (linhas.length === 0) return null;

  const total = linhas.find(l => l.mercado === "r90")?.total ?? 0;
  const inicial = total < 20;

  const porMercado = linhas.reduce<Record<string, LinhaBancada[]>>((acc, l) => {
    (acc[l.mercado] ??= []).push(l);
    return acc;
  }, {});

  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users2 className="h-4 w-4 text-gold" />
          <p className="text-sm font-bold">
            {inicial ? "Tendência inicial da comunidade" : "Opinião da comunidade"}
          </p>
        </div>
        {aoFechar && (
          <button onClick={aoFechar} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-3.5">
        {Object.entries(porMercado).map(([mercado, opcoes]) => (
          <div key={mercado}>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {ROTULO_MERCADO[mercado] ?? mercado}
            </p>
            <div className="space-y-1.5">
              {opcoes.map(o => {
                const minha = aMinha[mercado] === o.escolha;
                return (
                  <div key={o.escolha}>
                    <div className="mb-0.5 flex items-baseline justify-between gap-2">
                      <span className={`text-xs ${minha ? "font-bold text-gold" : "text-muted-foreground"}`}>
                        {ROTULO_ESCOLHA[o.escolha] ?? o.escolha}
                        {minha && " · a tua escolha"}
                      </span>
                      <span className={`text-xs font-bold tabular-nums ${minha ? "text-gold" : "text-muted-foreground"}`}>
                        {o.percentagem}%
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-border">
                      <div className="h-full rounded-full transition-all"
                        style={{
                          width: `${o.percentagem}%`,
                          background: minha ? "var(--gold)" : "var(--muted-foreground)",
                          opacity: minha ? 1 : 0.35,
                        }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
        {inicial
          ? `Só ${total} pessoas votaram até agora — a tendência ainda pode virar.`
          : `${total} previsões neste jogo.`}
      </p>
    </div>
  );
}

/**
 * Depois do jogo: a leitura do que aconteceu.
 * É esta frase que as pessoas mandam ao grupo.
 */
export function DesfechoBancada({ percentagemComigo, acertei, informada }: {
  /** % da comunidade que escolheu o mesmo que o utilizador */
  percentagemComigo: number;
  acertei: boolean;
  informada: boolean;
}) {
  const contra = percentagemComigo <= 34;

  const frase =
    contra && acertei  ? `Estiveste contra ${100 - percentagemComigo}% da comunidade — e tinhas razão.`
  : contra && !acertei ? `Foste contra ${100 - percentagemComigo}% da comunidade. Desta vez não saiu.`
  : !contra && acertei ? "Foste com a maioria, e a maioria acertou."
                       : "Foste com a maioria, mas a bancada falhou.";

  const cor = acertei ? "text-wc-green" : "text-muted-foreground";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${
      contra && acertei ? "border-wc-green/40 bg-wc-green/5" : "border-border bg-card/60"
    }`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        Contra a Bancada
      </p>
      <p className={`mt-1 text-sm font-semibold ${cor}`}>{frase}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {percentagemComigo}% escolheu o mesmo que tu.
        {informada && " Esta previsão não conta para o índice — consultaste a bancada."}
      </p>
    </div>
  );
}

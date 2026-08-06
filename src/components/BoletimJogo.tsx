import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { avaliarPrevisao, somaLinhas, type Previsao, type Resultado, type Equipas } from "@/lib/mercados";

/**
 * O boletim de um jogo já terminado: o resultado, e os teus mercados a
 * acender um a um.
 *
 * Isto existia — mas escondido dentro de uma gaveta que era preciso ir
 * abrir na página inicial. O momento em que os pontos caem é o momento
 * do produto; não pode estar a dois cliques de distância.
 *
 * As linhas acendem com atraso entre elas de propósito. É o mesmo dado
 * que apareceria de uma vez, mas lido em sequência tem tensão: vês o
 * resultado, e depois vês o que ele te fez.
 */
export function BoletimJogo({ pred, jogo, equipas, animar = true }: {
  pred: Previsao;
  jogo: Resultado;
  equipas: Equipas;
  animar?: boolean;
}) {
  const linhas = avaliarPrevisao(pred, jogo, equipas);
  const calculado = somaLinhas(linhas);
  const guardado = pred.points ?? 0;

  // Quantas linhas já acenderam.
  const [acesas, setAcesas] = useState(animar ? 0 : linhas.length);

  useEffect(() => {
    if (!animar) { setAcesas(linhas.length); return; }
    setAcesas(0);
    const relogios = linhas.map((_, i) =>
      setTimeout(() => setAcesas(n => Math.max(n, i + 1)), 420 + i * 260),
    );
    return () => relogios.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animar, linhas.length]);

  if (linhas.length === 0) return null;

  const tudoAceso = acesas >= linhas.length;
  const certas = linhas.filter(l => l.acertou).length;

  return (
    <section className="overflow-hidden rounded-3xl border border-border bg-card">
      {/* O resultado, em grande */}
      <div className="relative flex items-center justify-between gap-4 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Resultado final
          </p>
          <p className="mt-1 font-display text-4xl leading-none tabular-nums md:text-5xl">
            {jogo.home_score}
            <span className="mx-2 text-muted-foreground/40">:</span>
            {jogo.away_score}
          </p>
        </div>

        {/* Os pontos só aparecem depois de as linhas acenderem todas —
            é a conclusão da contagem, não o cabeçalho dela. */}
        <div className={`shrink-0 text-right transition-all duration-500 ${
          tudoAceso ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}>
          <p className={`font-display text-5xl leading-none tabular-nums md:text-6xl ${
            guardado > 0 ? "text-gold" : "text-muted-foreground/50"
          }`}>
            {guardado > 0 ? `+${guardado}` : "0"}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {guardado === 1 ? "ponto" : "pontos"}
          </p>
        </div>
      </div>

      {/* Os mercados */}
      <ul className="divide-y divide-border/60">
        {linhas.map((l, i) => {
          const acesa = i < acesas;
          return (
            <li
              key={l.chave}
              className={`flex items-center gap-3 px-5 py-3 transition-all duration-500 ${
                acesa ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
              } ${acesa && l.acertou ? "bg-wc-green/[0.06]" : ""}`}
            >
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors duration-300 ${
                !acesa ? "bg-secondary"
                  : l.acertou ? "bg-wc-green/15 text-wc-green" : "bg-muted text-muted-foreground/60"
              }`}>
                {acesa && (l.acertou ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />)}
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {l.mercado}
                </span>
                <span className="block truncate text-sm">
                  <span className={l.acertou ? "font-semibold text-foreground" : "text-muted-foreground line-through"}>
                    {l.escolha}
                  </span>
                  {!l.acertou && (
                    <span className="ml-2 text-muted-foreground/70">→ {l.real}</span>
                  )}
                </span>
              </span>

              <span className={`shrink-0 font-display text-xl leading-none tabular-nums transition-colors duration-300 ${
                !acesa ? "text-transparent"
                  : l.acertou ? "text-wc-green" : "text-muted-foreground/35"
              }`}>
                {l.acertou ? `+${l.pontos}` : `—`}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/25 px-5 py-2.5">
        <span className="text-xs text-muted-foreground">
          {certas} de {linhas.length} {certas === 1 ? "acertado" : "acertados"}
        </span>
        {/* Se a soma não bater com o que está guardado, diz-se. Esconder
            uma divergência de pontos é como esta plataforma se meteu em
            sarilhos da última vez. */}
        {calculado !== guardado && (
          <span className="text-xs font-semibold text-wc-red">
            Contas por fechar ({calculado} calculados, {guardado} atribuídos)
          </span>
        )}
      </div>
    </section>
  );
}

import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { coresDoClube, nomeCurto } from "@/lib/clubBadge";

interface JogoDoTalao {
  id: string;
  home: { name: string };
  away: { name: string };
  already_voted?: boolean;
}

/**
 * O talão da jornada.
 *
 * Uma lista de jogos são tarefas soltas. Os mesmos jogos num talão são
 * uma coisa só, que ou está completa ou não está — e é isso que faz
 * voltar para dar a quinta previsão.
 *
 * O picotado nas laterais é desenhado com máscaras radiais, não com
 * imagens: acompanha o tamanho e funciona nos dois temas.
 */
export function TalaoJornada({ label, competicao, jogos, accent, autenticado }: {
  label: string;
  competicao?: string;
  jogos: JogoDoTalao[];
  accent?: string;
  autenticado: boolean;
}) {
  const feitos = jogos.filter(j => j.already_voted).length;
  const completo = feitos === jogos.length && jogos.length > 0;
  const cor = accent ?? "var(--gold)";

  // Meias-luas nas laterais, como um bilhete destacado.
  const picotado = {
    WebkitMaskImage:
      "radial-gradient(circle 9px at 0 50%, transparent 98%, #000 100%)," +
      "radial-gradient(circle 9px at 100% 50%, transparent 98%, #000 100%)",
    WebkitMaskComposite: "source-in",
    maskImage:
      "radial-gradient(circle 9px at 0 50%, transparent 98%, #000 100%)," +
      "radial-gradient(circle 9px at 100% 50%, transparent 98%, #000 100%)",
    maskComposite: "intersect",
  } as React.CSSProperties;

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-border bg-card"
      style={picotado}
    >
      <div className="h-1 w-full" style={{ background: cor }} />

      <div className="flex items-center justify-between gap-3 px-4 pt-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            {competicao ?? "Jornada"}
          </p>
          <h2 className="font-display text-2xl uppercase leading-none md:text-3xl" style={{ color: cor }}>
            {label}
          </h2>
        </div>

        {autenticado ? (
          <div className="shrink-0 text-right">
            <p className={`font-display text-3xl leading-none tabular-nums ${completo ? "text-wc-green" : "text-foreground"}`}>
              {feitos}<span className="text-muted-foreground/60">/{jogos.length}</span>
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              previsões
            </p>
          </div>
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">{jogos.length} jogos</span>
        )}
      </div>

      {/* Linha picotada a separar o talonário do canhoto */}
      <div className="mx-4 my-3 border-t border-dashed border-border" />

      {/* Um selo por jogo: as duas cores do confronto, e o visto quando
          a previsão está dada. */}
      <div className="flex flex-wrap gap-2 px-4 pb-3">
        {jogos.map(j => {
          const casa = coresDoClube(j.home.name).primaria;
          const fora = coresDoClube(j.away.name).primaria;
          const feito = !!j.already_voted;
          return (
            <Link
              key={j.id}
              to="/jogo/$id"
              params={{ id: j.id }}
              title={`${nomeCurto(j.home.name)} — ${nomeCurto(j.away.name)}`}
              className={`group inline-flex min-w-0 items-center gap-2 rounded-full border py-1 pl-1 pr-2.5 transition-smooth ${
                feito
                  ? "border-wc-green/35 bg-wc-green/10"
                  : "border-border bg-secondary/40 hover:border-foreground/25"
              }`}
            >
              <span
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
                style={{ background: `linear-gradient(135deg, ${casa} 0%, ${casa} 48%, ${fora} 52%, ${fora} 100%)` }}
              >
                {feito && <Check className="h-3 w-3 text-white drop-shadow" strokeWidth={3.5} />}
              </span>
              <span className={`truncate text-[11px] font-semibold ${feito ? "text-wc-green" : "text-muted-foreground"}`}>
                {nomeCurto(j.home.name)}—{nomeCurto(j.away.name)}
              </span>
            </Link>
          );
        })}
      </div>

      {autenticado && (
        <div className="h-1.5 bg-border/60">
          <div
            className="h-full transition-all duration-700"
            style={{
              width: `${(feitos / Math.max(jogos.length, 1)) * 100}%`,
              background: completo ? "var(--wc-green)" : cor,
            }}
          />
        </div>
      )}

      {/* O carimbo. Só aparece com o talão fechado — é a recompensa. */}
      {completo && (
        <span
          className="pointer-events-none absolute right-3 top-9 select-none rounded-md border-[3px] border-wc-green/45 px-2 py-0.5 font-display text-lg uppercase tracking-[0.14em] text-wc-green/55"
          style={{ transform: "rotate(-11deg)" }}
        >
          Completo
        </span>
      )}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { CalendarCheck2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { VotoRapido } from "@/components/VotoRapido";
import { TeamBadge } from "@/lib/teamColors.tsx";
import { coresDoClube, nomeCurto } from "@/lib/clubBadge";
import { formatTime } from "@/lib/format";

/**
 * O que há para fazer hoje.
 *
 * O aviso era "0/5 previsões" para a jornada inteira — uma dívida que
 * fica à frente durante dias e que dá para adiar sempre. As pessoas
 * disseram que se cansavam só de pensar nisso, e tinham razão: uma
 * jornada é uma semana, e ninguém a resolve de uma vez.
 *
 * Aqui só entra o que joga hoje. Se não joga nada hoje, isto desaparece
 * — e não há nada para fazer, o que também é uma resposta.
 */

interface JogoHoje {
  id: string;
  kickoff_at: string;
  casa: { name: string; code: string | null; flag: string | null; monogram: string | null; crest_url: string | null };
  fora: { name: string; code: string | null; flag: string | null; monogram: string | null; crest_url: string | null };
  competicao: string | null;
  minha_escolha: string | null;
}

/** Fim do dia de hoje, à hora de Lisboa. */
function fimDoDia(): string {
  const agora = new Date();
  const fim = new Date(agora);
  fim.setHours(23, 59, 59, 999);
  return fim.toISOString();
}

export function OQueTensHoje({ userId }: { userId: string | undefined }) {
  const { data: jogos = [], isLoading } = useQuery({
    queryKey: ["jogos-de-hoje", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<JogoHoje[]> => {
      const { data } = await (supabase as any)
        .from("matches")
        .select(
          "id,kickoff_at,voting_open," +
          "home:home_team_id(name,code,flag,monogram,crest_url)," +
          "away:away_team_id(name,code,flag,monogram,crest_url)," +
          "competition:competition_id(short_name)," +
          "round:round_id!inner(status,apurada_em)"
        )
        .eq("is_official", true)
        .eq("voting_open", true)
        .eq("round.status", "publicada")
        .is("round.apurada_em", null)
        .gte("kickoff_at", new Date().toISOString())
        .lte("kickoff_at", fimDoDia())
        .order("kickoff_at");

      const linhas = ((data ?? []) as any[]).filter(m => m.home && m.away);
      if (linhas.length === 0) return [];

      const { data: minhas } = await supabase
        .from("predictions")
        .select("match_id,result_90")
        .eq("user_id", userId!)
        .in("match_id", linhas.map(m => m.id));
      const escolhas = new Map(((minhas ?? []) as any[]).map(p => [p.match_id, p.result_90 ?? null]));

      return linhas.map(m => ({
        id: m.id,
        kickoff_at: m.kickoff_at,
        casa: m.home,
        fora: m.away,
        competicao: m.competition?.short_name ?? null,
        minha_escolha: escolhas.get(m.id) ?? null,
      }));
    },
  });

  if (!userId || isLoading || jogos.length === 0) return null;

  const porFazer = jogos.filter(j => !j.minha_escolha);
  const tudoFeito = porFazer.length === 0;

  return (
    <div className={`overflow-hidden rounded-2xl border ${
      tudoFeito ? "border-wc-green/30 bg-wc-green/5" : "border-border bg-card"
    }`}>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
            tudoFeito ? "bg-wc-green/15 text-wc-green" : "bg-secondary text-muted-foreground"
          }`}>
            {tudoFeito ? <Check className="h-4 w-4" strokeWidth={3} /> : <CalendarCheck2 className="h-4 w-4" />}
          </span>
          <div className="min-w-0">
            <p className="font-display text-xl uppercase leading-none">
              {tudoFeito ? "Hoje está feito" : "Para hoje"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {tudoFeito
                ? `${jogos.length} ${jogos.length === 1 ? "jogo" : "jogos"} — está tudo entregue.`
                : `${porFazer.length} ${porFazer.length === 1 ? "jogo" : "jogos"} por votar.`}
            </p>
          </div>
        </div>
      </div>

      {!tudoFeito && (
        <ul className="divide-y divide-border/60 border-t border-border/60">
          {porFazer.map(j => {
            const corCasa = coresDoClube(j.casa.name).primaria;
            const corFora = coresDoClube(j.fora.name).primaria;
            return (
              <li key={j.id} className="px-4 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <TeamBadge code={j.casa.code} flag={j.casa.flag} name={j.casa.name}
                    monogram={j.casa.monogram} crest={j.casa.crest_url} size="sm" />
                  <Link to="/jogo/$id" params={{ id: j.id }}
                    className="min-w-0 flex-1 truncate text-sm font-semibold hover:underline">
                    {nomeCurto(j.casa.name)} <span className="text-muted-foreground">—</span> {nomeCurto(j.fora.name)}
                  </Link>
                  <TeamBadge code={j.fora.code} flag={j.fora.flag} name={j.fora.name}
                    monogram={j.fora.monogram} crest={j.fora.crest_url} size="sm" />
                  <span className="shrink-0 text-xs font-bold tabular-nums text-muted-foreground">
                    {formatTime(j.kickoff_at)}
                  </span>
                </div>
                <VotoRapido
                  matchId={j.id}
                  casa={j.casa.name}
                  fora={j.fora.name}
                  escolhaAtual={j.minha_escolha}
                  corCasa={corCasa}
                  corFora={corFora}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

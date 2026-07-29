import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompetitions } from "@/lib/useCompetitions";
import {
  atribuirPerfil, talismaFantasma,
  type MetricasDna, type Atribuicao, type Relacao,
} from "@/lib/dnaMotor";

/**
 * Recolhe todas as métricas e corre o motor.
 *
 * Uma consulta por vista, em paralelo. Com a dimensão que temos
 * (centenas de utilizadores, milhares de previsões) isto responde
 * em milissegundos — as vistas são somas sobre índices.
 */

export interface MomentoDecisivo {
  round_id: string;
  label: string;
  tipo: "ganho" | "perda" | "equilibrada" | "sem-participacao";
  posicoes: number | null;
  narrativa: string;
}

export interface Visionario {
  round_id: string;
  label: string;
  percentagem: number;
  nivel: string;
}

export interface DnaCompleto {
  atribuicao: Atribuicao | null;
  /** Último momento decisivo apurado */
  momento: MomentoDecisivo | null;
  /** Última distinção de Visionário */
  visionario: Visionario | null;
  talisma: (Relacao & { nome: string; crest: string | null }) | null;
  fantasma: (Relacao & { nome: string; crest: string | null }) | null;
  /** Comparação com o clube do coração, quando definido */
  clube: { nome: string; acertoNoClube: number; acertoFora: number } | null;
  /** Índice Contra a Bancada */
  bancada: { contra: number; acertoContra: number; avaliadas: number } | null;
}

export function useDnaCompleto(userId: string | undefined) {
  const { data: competicoes = [] } = useCompetitions();

  return useQuery({
    queryKey: ["dna-completo", userId, competicoes.length],
    enabled: !!userId && competicoes.length > 0,
    staleTime: 120_000,
    queryFn: async (): Promise<DnaCompleto> => {
      const db = supabase as any;

      const [progresso, mercados, comps, destaque, bancada, equipas, media, clube] =
        await Promise.all([
          db.from("v_dna_progresso").select("*").eq("user_id", userId).maybeSingle(),
          db.from("v_metricas_mercado").select("*").eq("user_id", userId),
          db.from("v_metricas_competicao").select("*").eq("user_id", userId),
          db.from("v_metricas_destaque").select("*").eq("user_id", userId),
          db.from("v_bancada").select("*").eq("user_id", userId).maybeSingle(),
          db.from("v_metricas_equipa").select("*").eq("user_id", userId),
          db.from("v_media_comunidade").select("*"),
          db.from("v_metricas_clube").select("*").eq("user_id", userId),
        ]);

      const prog = progresso.data;
      if (!prog || prog.previsoes_avaliadas === 0) {
        return { atribuicao: null, momento: null, visionario: null,
                 talisma: null, fantasma: null, clube: null, bancada: null };
      }

      // ── Mercados, somados em todas as competições ──────────
      const porMercado: MetricasDna["mercados"] = {
        r90: { tentativas: 0, certos: 0 }, btts: { tentativas: 0, certos: 0 },
        t25: { tentativas: 0, certos: 0 }, exato: { tentativas: 0, certos: 0 },
      };
      for (const l of (mercados.data ?? []) as any[]) {
        const alvo = porMercado[l.mercado as keyof typeof porMercado];
        if (!alvo) continue;
        alvo.tentativas += l.tentativas ?? 0;
        alvo.certos += l.certos ?? 0;
      }

      // ── Competições, por slug ──────────────────────────────
      const slugPorId = new Map(competicoes.map(c => [c.id, c.slug]));
      const porCompeticao: MetricasDna["competicoes"] = {};
      for (const l of (comps.data ?? []) as any[]) {
        const slug = slugPorId.get(l.competition_id);
        if (!slug) continue;
        porCompeticao[slug] = {
          previsoes: l.previsoes ?? 0,
          tentativas: l.mercados_tentados ?? 0,
          certos: l.mercados_certos ?? 0,
        };
      }

      // ── Destaque ───────────────────────────────────────────
      const linhasDest = (destaque.data ?? []) as any[];
      const comDest = linhasDest.find(l => l.destaque === true);
      const semDest = linhasDest.find(l => l.destaque === false);
      const vazio = { previsoes: 0, tentativas: 0, certos: 0 };
      const mapaDest = (l: any) => l ? {
        previsoes: l.previsoes ?? 0,
        tentativas: l.mercados_tentados ?? 0,
        certos: l.mercados_certos ?? 0,
      } : vazio;

      // ── Clube do coração ───────────────────────────────────
      const linhasClube = (clube.data ?? []) as any[];
      const noClube = linhasClube.find(l => l.e_do_meu_clube === true);
      const foraClube = linhasClube.find(l => l.e_do_meu_clube === false);

      // ── Bancada ────────────────────────────────────────────
      const b = bancada.data;
      const metricasBancada = b ? {
        avaliadas: b.avaliadas ?? 0,
        contra: b.contra_bancada ?? 0,
        contraCertas: b.contra_e_certas ?? 0,
        maioria: b.com_a_maioria ?? 0,
        maioriaCertas: b.maioria_e_certas ?? 0,
      } : null;

      // ── Média da comunidade ────────────────────────────────
      const mediaComunidade: Record<string, number> = {};
      for (const l of (media.data ?? []) as any[]) {
        mediaComunidade[l.mercado] = Number(l.taxa ?? 0);
      }

      const metricas: MetricasDna = {
        previsoesAvaliadas: prog.previsoes_avaliadas,
        mercadosTentados: prog.mercados_tentados,
        mercadosCertos: prog.mercados_certos,
        mercados: porMercado,
        competicoes: porCompeticao,
        destaque: mapaDest(comDest),
        semDestaque: mapaDest(semDest),
        bancada: metricasBancada,
        clube: noClube ? {
          jogos: noClube.jogos ?? 0,
          tentativas: noClube.mercados_tentados ?? 0,
          certos: noClube.mercados_certos ?? 0,
          jogosSemVitoria: noClube.jogos_sem_vitoria ?? 0,
          acertosSemVitoria: noClube.acertos_sem_vitoria ?? 0,
        } : null,
        foraDoClube: foraClube ? {
          jogos: foraClube.jogos ?? 0,
          tentativas: foraClube.mercados_tentados ?? 0,
          certos: foraClube.mercados_certos ?? 0,
        } : null,
        mediaComunidade,
      };

      const atribuicao = atribuirPerfil(metricas);

      // ── Talismã e fantasma ─────────────────────────────────
      const listaEquipas = ((equipas.data ?? []) as any[]).map(l => ({
        team_id: l.team_id,
        jogos: l.jogos ?? 0,
        pontos: l.pontos ?? 0,
        mercadosCertos: l.mercados_certos ?? 0,
        mercadosTentados: l.mercados_tentados ?? 0,
      }));
      const mediaGeral = prog.previsoes_avaliadas > 0
        ? prog.pontos / prog.previsoes_avaliadas : 0;
      const { talisma, fantasma } = talismaFantasma(listaEquipas, mediaGeral);

      // Nomes e emblemas das duas equipas
      const ids = [talisma?.team_id, fantasma?.team_id].filter(Boolean) as string[];
      const nomes = new Map<string, { nome: string; crest: string | null }>();
      if (ids.length > 0) {
        const { data: eqs } = await db
          .from("teams").select("id,name,short_name,crest_url").in("id", ids);
        for (const e of (eqs ?? []) as any[]) {
          nomes.set(e.id, { nome: e.short_name ?? e.name, crest: e.crest_url ?? null });
        }
      }
      const juntaNome = (rel: Relacao | null) => rel
        ? { ...rel, nome: nomes.get(rel.team_id)?.nome ?? "—",
            crest: nomes.get(rel.team_id)?.crest ?? null }
        : null;

      // ── Comparação com o clube ─────────────────────────────
      let comparacaoClube: DnaCompleto["clube"] = null;
      if (noClube && foraClube && noClube.jogos >= 5) {
        const { data: perfil } = await db
          .from("profiles").select("favourite_team_id").eq("id", userId).maybeSingle();
        if (perfil?.favourite_team_id) {
          const { data: eq } = await db
            .from("teams").select("name,short_name")
            .eq("id", perfil.favourite_team_id).maybeSingle();
          comparacaoClube = {
            nome: eq?.short_name ?? eq?.name ?? "o teu clube",
            acertoNoClube: noClube.mercados_tentados > 0
              ? Math.round((noClube.mercados_certos / noClube.mercados_tentados) * 100) : 0,
            acertoFora: foraClube.mercados_tentados > 0
              ? Math.round((foraClube.mercados_certos / foraClube.mercados_tentados) * 100) : 0,
          };
        }
      }

      // ── Narrativa da última jornada ────────────────────────
      const [momentoRes, visRes] = await Promise.all([
        db.from("round_moments")
          .select("round_id,tipo,posicoes,narrativa,criado_em,rounds(label)")
          .eq("user_id", userId).order("criado_em", { ascending: false }).limit(1).maybeSingle(),
        db.from("round_visionaries")
          .select("round_id,percentagem,nivel,criado_em,rounds(label)")
          .eq("user_id", userId).eq("principal", true)
          .order("criado_em", { ascending: false }).limit(1).maybeSingle(),
      ]);

      const mom = momentoRes.data;
      const vis = visRes.data;

      return {
        atribuicao,
        momento: mom ? {
          round_id: mom.round_id,
          label: mom.rounds?.label ?? "Jornada",
          tipo: mom.tipo,
          posicoes: mom.posicoes ?? null,
          narrativa: mom.narrativa,
        } : null,
        visionario: vis ? {
          round_id: vis.round_id,
          label: vis.rounds?.label ?? "Jornada",
          percentagem: vis.percentagem,
          nivel: vis.nivel,
        } : null,
        talisma: juntaNome(talisma),
        fantasma: juntaNome(fantasma),
        clube: comparacaoClube,
        bancada: metricasBancada && metricasBancada.avaliadas >= 10 ? {
          contra: metricasBancada.contra,
          acertoContra: metricasBancada.contra > 0
            ? Math.round((metricasBancada.contraCertas / metricasBancada.contra) * 100) : 0,
          avaliadas: metricasBancada.avaliadas,
        } : null,
      };
    },
  });
}

import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserAvatar } from "@/components/AvatarPicker";
import { Share2 } from "lucide-react";
import type { Competition } from "@/lib/useCompetitions";

/**
 * Os líderes de uma competição, no painel da própria competição.
 *
 * Antes havia um quadro só, que mudava de cor conforme a competição
 * escolhida no seletor. Isso obrigava a escolher para ver — e escondia
 * metade do que se passa no site. Agora a Liga Portugal e a Champions
 * estão lado a lado, cada uma vestida de si.
 *
 * Os pontos vêm de `pontos_por_competicao`, que os soma a partir de
 * `predictions.points`. Nada disto está guardado em lado nenhum.
 */

interface Lider {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  pontos: number;
  acertos: number;
  previsoes: number;
  posicao: number;
}

const QUANTOS = 5;

export function LideresCompeticao({ comp, userId, onPartilhar }: {
  comp: Competition;
  userId?: string;
  /** Partilhar a tua classificação — só aparece na tua linha. */
  onPartilhar?: () => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["lideres-competicao", comp.id],
    staleTime: 60_000,
    queryFn: async (): Promise<Lider[]> => {
      const { data: linhas } = await (supabase as any)
        .from("pontos_por_competicao")
        .select("user_id,pontos,acertos,previsoes")
        .eq("competition_id", comp.id)
        .order("pontos", { ascending: false })
        .order("acertos", { ascending: false })
        .limit(50);

      const lista = (linhas ?? []) as any[];
      if (lista.length === 0) return [];

      const { data: perfis } = await supabase
        .from("profiles")
        .select("id,display_name,avatar_url")
        .in("id", lista.map(l => l.user_id));
      const porId = new Map((perfis ?? []).map((p: any) => [p.id, p]));

      return lista.map((l, i) => ({
        user_id: l.user_id,
        display_name: porId.get(l.user_id)?.display_name ?? "Adepto",
        avatar_url: porId.get(l.user_id)?.avatar_url ?? null,
        pontos: l.pontos ?? 0,
        acertos: l.acertos ?? 0,
        previsoes: l.previsoes ?? 0,
        posicao: i + 1,
      }));
    },
  });

  const todos = data ?? [];
  const topo = todos.slice(0, QUANTOS);
  const eu = userId ? todos.find(l => l.user_id === userId) : undefined;
  const euEstaNoTopo = !!eu && eu.posicao <= QUANTOS;

  return (
    <div
      className="relative isolate overflow-hidden rounded-2xl"
      style={{
        background: comp.heroGradient,
        boxShadow: `0 12px 36px -8px ${comp.glow}, inset 0 1px 0 rgba(255,255,255,0.10)`,
      }}
    >
      {/* Halo da cor elétrica da competição */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 -z-10 h-44 w-44 rounded-full"
        style={{ background: comp.electric, opacity: 0.22, filter: "blur(58px)" }}
      />

      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 text-xl ring-1 ring-white/15">
            {comp.emoji}
          </span>
          <div className="min-w-0 leading-tight">
            <h3 className="truncate font-display text-xl uppercase text-white">{comp.short}</h3>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: comp.tone }}>
              Líderes
            </p>
          </div>
        </div>
        <Link
          to="/rankings"
          className="shrink-0 rounded-full border border-white/20 px-2.5 py-1 text-[11px] font-bold text-white/75 transition-smooth hover:border-white/50 hover:text-white"
        >
          Ver todos
        </Link>
      </header>

      {isLoading ? (
        <div className="space-y-2 px-4 py-4">
          {[0, 1, 2].map(i => <div key={i} className="h-8 rounded-lg bg-white/10" />)}
        </div>
      ) : topo.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm" style={{ color: comp.tone }}>
          Ainda sem pontos nesta competição.<br />
          <span className="text-white/50">A primeira jornada resolve isso.</span>
        </p>
      ) : (
        <ol>
          {topo.map(l => (
            <LinhaLider key={l.user_id} lider={l} comp={comp} sou={l.user_id === userId} onPartilhar={onPartilhar} />
          ))}

          {/* Se estás fora do top, entras à mesma — no fundo, com as
              reticências pelo meio. Ver-se sempre é metade do jogo. */}
          {eu && !euEstaNoTopo && (
            <>
              <li className="px-4 py-1 text-center text-[10px] tracking-[0.3em] text-white/25">· · ·</li>
              <LinhaLider lider={eu} comp={comp} sou onPartilhar={onPartilhar} />
            </>
          )}
        </ol>
      )}
    </div>
  );
}

const MEDALHA = ["🥇", "🥈", "🥉"];

function LinhaLider({ lider, comp, sou, onPartilhar }: {
  lider: Lider; comp: Competition; sou: boolean; onPartilhar?: () => void;
}) {
  const medalha = MEDALHA[lider.posicao - 1];

  return (
    <li
      className={`flex items-center gap-3 border-t border-white/[0.07] px-4 py-2.5 transition-smooth hover:bg-white/[0.05] ${
        sou ? "bg-white/[0.09]" : ""
      }`}
      style={sou ? { boxShadow: `inset 3px 0 0 ${comp.electric}` } : undefined}
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-xs font-bold tabular-nums text-white">
        {medalha ?? lider.posicao}
      </span>

      <UserAvatar
        avatarUrl={lider.avatar_url}
        name={lider.display_name}
        size={7}
        className="shrink-0 rounded-full ring-1 ring-white/15"
      />

      <Link
        to="/adepto/$id"
        params={{ id: lider.user_id }}
        className="min-w-0 flex-1 truncate text-sm font-semibold text-white hover:underline"
      >
        {lider.display_name}
        {sou && (
          <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: comp.electric }}>
            tu
          </span>
        )}
      </Link>

      {sou && onPartilhar && (
        <button
          onClick={onPartilhar}
          title="Partilhar a minha classificação"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/12 text-white transition-smooth hover:bg-white/30"
        >
          <Share2 className="h-3.5 w-3.5" />
        </button>
      )}

      <span className="shrink-0 text-right leading-none">
        <span className="font-display text-xl tabular-nums text-white">{lider.pontos}</span>
        <span className="ml-1 text-[10px] font-semibold text-white/45">pts</span>
        <span className="mt-0.5 block text-[10px] tabular-nums text-white/35">
          {lider.acertos}/{lider.previsoes}
        </span>
      </span>
    </li>
  );
}

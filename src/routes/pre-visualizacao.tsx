import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MatchCard, type MatchCardData } from "@/components/MatchCard";
import { BoletimJogo } from "@/components/BoletimJogo";
import { TalaoJornada } from "@/components/TalaoJornada";

/**
 * Estaleiro de obra.
 *
 * Enquanto não houver jornada publicada, não há um único cartão de jogo
 * no site — o que torna impossível ver o desenho antes de a época
 * arrancar. Esta página monta os componentes reais com dados de
 * exemplo, para se poder julgar o aspeto sem esperar pela bola a rolar.
 *
 * Não está na navegação e pede aos motores de busca que a ignorem.
 * Quando a época arrancar, apaga-se.
 */
export const Route = createFileRoute("/pre-visualizacao")({
  head: () => ({
    meta: [
      { title: "Pré-visualização — Uma Geração" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PreVisualizacao,
});

const HORA = 3600_000;

/** Os relógios são relativos a agora, para a contagem decrescente reagir. */
function daquiA(ms: number) {
  return new Date(Date.now() + ms).toISOString();
}

function equipa(name: string, code: string, monogram: string) {
  return { name, code, flag: null, monogram, crest_url: null };
}

const CLASSICO: MatchCardData = {
  id: "exemplo-classico",
  kickoff_at: daquiA(17 * 60_000 + 5 * 60_000),  // fecha daqui a ~17 min
  phase: "grupos",
  status: "scheduled",
  voting_open: true,
  is_official: true,
  round_label: "Jornada 8",
  votes_count: 3918,
  home: equipa("Sport Lisboa e Benfica", "SLB", "SLB"),
  away: equipa("FC Porto", "FCP", "FCP"),
};

const OUTROS: MatchCardData[] = [
  {
    id: "exemplo-1", kickoff_at: daquiA(3.2 * HORA), phase: "grupos", status: "scheduled",
    voting_open: true, is_official: true, round_label: "Jornada 8", votes_count: 1243,
    home: equipa("Sporting Clube de Braga", "SCB", "SCB"),
    away: equipa("Sporting Clube de Portugal", "SCP", "SCP"),
  },
  {
    id: "exemplo-2", kickoff_at: daquiA(26 * HORA), phase: "grupos", status: "scheduled",
    voting_open: true, is_official: true, round_label: "Jornada 8", votes_count: 812,
    already_voted: true,
    home: equipa("Vitória Sport Clube", "VSC", "VSC"),
    away: equipa("Casa Pia AC", "CPA", "CPA"),
  },
  {
    id: "exemplo-3", kickoff_at: daquiA(50 * HORA), phase: "grupos", status: "scheduled",
    voting_open: true, is_official: true, round_label: "Jornada 8", votes_count: 617,
    home: equipa("FC Arouca", "ARO", "ARO"),
    away: equipa("Estoril Praia", "EST", "EST"),
  },
  {
    id: "exemplo-4", kickoff_at: daquiA(52 * HORA), phase: "grupos", status: "scheduled",
    voting_open: true, is_official: true, round_label: "Jornada 8", votes_count: 588,
    home: equipa("Rio Ave FC", "RAV", "RAV"),
    away: equipa("Moreirense FC", "MOR", "MOR"),
  },
];

const PREVISAO_BOA = {
  result_90: "home", btts: "yes", total_25: "over",
  exact_home: 2, exact_away: 1, points: 7,
};

const PREVISAO_PERFEITA = {
  result_90: "draw", btts: "yes", total_25: "over",
  exact_home: 2, exact_away: 2, points: 18,
};

function PreVisualizacao() {
  const [chave, setChave] = useState(0);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6 pb-16 md:px-8">
      <header className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
          Estaleiro de obra
        </p>
        <h1 className="font-display text-4xl uppercase leading-none md:text-5xl">Pré-visualização</h1>
        <p className="mt-3 max-w-prose text-sm text-muted-foreground">
          Os componentes reais com dados inventados. Enquanto não houver jornada publicada,
          é a única forma de ver o desenho. Esta página não está na navegação e desaparece
          quando a época arrancar.
        </p>
      </header>

      <Bloco titulo="O talão da jornada" nota="Os cinco jogos como um objeto só. O carimbo aparece quando o talão fecha — carrega para alternar.">
        <div className="space-y-3">
          <TalaoJornada label="Jornada 8" competicao="Liga Portugal" accent="#E10014" autenticado
            jogos={[CLASSICO, ...OUTROS].map((j, i) => ({ ...j, already_voted: i < 2 }))} />
          <TalaoJornada label="Jornada 7" competicao="Liga Portugal" accent="#E10014" autenticado
            jogos={[CLASSICO, ...OUTROS].map(j => ({ ...j, already_voted: true }))} />
        </div>
      </Bloco>

      <Bloco titulo="O jogo da jornada" nota="Largura total, moldura dourada, e a contagem na última hora a contar segundos. Recarrega para a ver reiniciar.">
        <MatchCard match={{ ...CLASSICO, id: `${CLASSICO.id}-${chave}` }} destaque etiqueta="O clássico da jornada" />
      </Bloco>

      <Bloco titulo="Os outros quatro" nota="Cada um vestido dos seus clubes. Sem dourado — o dourado é do destaque.">
        <div className="grid gap-3 md:grid-cols-2">
          {OUTROS.map(m => <MatchCard key={m.id} match={m} />)}
        </div>
      </Bloco>

      <Bloco titulo="O boletim, depois do apito" nota="Os mercados acendem um a um e os pontos só aparecem no fim. Carrega em repetir para veres a sequência outra vez.">
        <div className="space-y-4">
          <BoletimJogo
            key={`bom-${chave}`}
            pred={PREVISAO_BOA}
            jogo={{ home_score: 2, away_score: 0 }}
            equipas={{ casa: "Benfica", fora: "FC Porto" }}
          />
          <BoletimJogo
            key={`perfeito-${chave}`}
            pred={PREVISAO_PERFEITA}
            jogo={{ home_score: 2, away_score: 2 }}
            equipas={{ casa: "SC Braga", fora: "Sporting" }}
          />
        </div>
        <button
          onClick={() => setChave(k => k + 1)}
          className="mt-4 w-full rounded-xl border border-gold/35 bg-gold/10 py-2.5 text-sm font-bold text-gold transition-smooth hover:bg-gold/20"
        >
          Repetir a sequência
        </button>
      </Bloco>

      <p className="mt-10 border-l-2 border-border pl-4 text-xs text-muted-foreground">
        A marcação da tua fatia na bancada não cabe aqui — precisa da distribuição real de votos
        de um jogo. Vê-se na página de um jogo, mal haja jornada.
      </p>
    </div>
  );
}

function Bloco({ titulo, nota, children }: { titulo: string; nota: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display text-2xl uppercase leading-none">{titulo}</h2>
      <p className="mb-3 mt-1.5 text-xs text-muted-foreground">{nota}</p>
      {children}
    </section>
  );
}

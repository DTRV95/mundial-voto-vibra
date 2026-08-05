import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Target, Star, Users, ChevronRight, HelpCircle, TrendingUp, Swords, CalendarClock } from "lucide-react";
import { DIVISOES, faixaDe } from "@/lib/divisoes";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como Funciona — Uma Geração" },
      { name: "description", content: "Como funcionam as previsões, os pontos, os duelos 1v1, as divisões mensais e os torneios privados do Uma Geração." },
      { property: "og:title", content: "Como Funciona — Uma Geração" },
      { property: "og:description", content: "Guia completo: 5 jogos por jornada, duelos, divisões e torneios privados." },
      { property: "og:url", content: "https://geracao2026.com/como-funciona" },
    ],
    links: [{ rel: "canonical", href: "https://geracao2026.com/como-funciona" }],
  }),
  component: ComoFunciona,
});

function Section({ icon: Icon, title, children, accent }: {
  icon: React.ElementType; title: string; children: React.ReactNode; accent?: string;
}) {
  return (
    <section className={`rounded-2xl border bg-card/70 p-5 ${accent ?? "border-border"}`}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-gold/15 text-gold">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="font-display text-xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function PointRow({ label, pts, note, highlight }: {
  label: string; pts: string; note?: string; highlight?: boolean;
}) {
  return (
    <div className={`flex items-start justify-between gap-3 border-b border-border py-2.5 last:border-0 ${highlight ? "-mx-3 rounded bg-gold/5 px-3" : ""}`}>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${highlight ? "text-gold" : ""}`}>{label}</p>
        {note && <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>}
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${highlight ? "bg-gold text-background" : "bg-gold/20 text-gold"}`}>{pts}</span>
    </div>
  );
}

function ComoFunciona() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 px-5 pb-16 pt-6">
      <header className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-gold">
          <HelpCircle className="h-3.5 w-3.5" /> Guia
        </div>
        <h1 className="font-display text-3xl">Como Funciona</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tudo o que precisas de saber para jogar e ganhar.</p>
      </header>

      {/* A ideia base */}
      <div className="overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-r from-gold/8 via-gold/4 to-transparent">
        <div className="h-1 w-full rounded-t-2xl wc-tricolor" />
        <div className="flex items-start gap-3 p-4">
          <span className="shrink-0 text-2xl">⚽</span>
          <div>
            <p className="text-sm font-bold text-gold">5 jogos por jornada. Os mesmos para toda a gente.</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Em cada jornada da Liga Portugal e da Champions escolhemos 5 jogos oficiais — dois de destaque,
              dois equilibrados e um para dar palco a quem aparece menos. Toda a gente joga exatamente os mesmos.
              Ninguém ganha por ter mais tempo livre para votar.
            </p>
          </div>
        </div>
      </div>

      {/* Passos */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { n: "1", label: "Vê os 5 jogos" },
          { n: "2", label: "Faz a previsão" },
          { n: "3", label: "Sobe no ranking" },
        ].map(({ n, label }) => (
          <div key={n} className="rounded-2xl border border-border bg-card/60 p-3 text-center">
            <span className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-gold font-display text-base text-background shadow-gold">
              {n}
            </span>
            <p className="mt-2 text-xs font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* Mercados */}
      <Section icon={Target} title="Mercados de Previsão">
        <p className="mb-3 text-sm text-muted-foreground">
          Tens até 5 minutos antes do apito inicial para submeter. Cada mercado é independente —
          podes acertar num e errar noutro.
        </p>
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-background/40">
          <PointRow label="Resultado final (1X2)" pts="3–4 pts" note="Vitória casa/fora = 3 pts · Empate = 4 pts (mais difícil, vale mais)" />
          <PointRow label="Ambas as equipas marcam (BTTS)" pts="2 pts" note="Sim ou Não — ambas têm de marcar pelo menos 1 golo" />
          <PointRow label="Total de golos +/- 2.5" pts="2 pts" note="Mais ou menos de 2.5 golos no total do jogo" />
          <PointRow label="Marcador exato" pts="10 pts" note="Acertar no placar exato — a mais difícil e a que mais vale" highlight />
        </div>
      </Section>

      {/* Competições e meses */}
      <Section icon={CalendarClock} title="Competições e Meses">
        <p className="mb-3 text-sm text-muted-foreground">
          Cada competição tem o seu ranking, e há um total que soma as duas. Escolhes o que queres ver
          nos <Link to="/rankings" search={{ tab: "divisoes" } as any} className="text-gold underline">Rankings</Link>.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Liga Portugal e Champions League contam em separado — e somadas no Total.",
            "Cada mês é uma competição em si: no fim do mês há um vencedor mensal.",
            "Os pontos da época nunca se perdem — o mês é uma corrida à parte, dentro da corrida grande.",
            "Segues só as competições que te interessam, e o site adapta-se a essa escolha.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* Duelos */}
      <Section icon={Swords} title="Duelos 1 contra 1" accent="border-gold/30">
        <p className="mb-3 text-sm text-muted-foreground">
          Desafia qualquer adepto para um duelo direto. Ganha quem fizer mais pontos no alvo do duelo.
        </p>
        <div className="mb-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-background/40">
          <PointRow label="Duelo de jogo" pts="×2" note="Quem fizer mais pontos num jogo à escolha" />
          <PointRow label="Duelo de jornada" pts="×3" note="Quem fizer mais pontos nos 5 jogos da jornada" />
          <PointRow label="Duelo de mês" pts="×6" note="Quem fizer mais pontos no mês inteiro" />
        </div>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Vitória 3 · Empate 1 · Derrota 0, multiplicado pelo peso do tipo de duelo.",
            "O ranking de duelos é separado do geral e reinicia todos os meses.",
            "Contra o mesmo adversário só contam 2 duelos por mês — para ninguém somar pontos à custa de um só amigo.",
            "O confronto direto contra cada adepto fica guardado para sempre.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {item}
            </li>
          ))}
        </ul>
        <Link to="/duelos" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-gold hover:underline">
          Ver os meus duelos <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </Section>

      {/* Pontos */}
      <Section icon={Star} title="Como se Ganham Pontos">
        <ul className="space-y-2.5 text-sm">
          {[
            "Os pontos só são atribuídos depois de o jogo terminar.",
            "Só contam os 5 jogos oficiais de cada jornada — os outros jogos não pontuam.",
            "Quanto mais difícil a previsão, mais pontos vale.",
            "Não há penalização por errar — o pior que pode acontecer é ficares a zero.",
            "Podes ver o detalhe de cada previsão no histórico do teu perfil.",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold/20 text-xs font-bold text-gold">{i + 1}</span>
              <span className="text-muted-foreground">{tip}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Divisões */}
      <Section icon={Trophy} title="Rankings e Divisões">
        <p className="mb-3 text-sm text-muted-foreground">
          Consoante a tua posição no ranking, ficas colocado numa divisão:
        </p>
        <div className="mb-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-background/40">
          {DIVISOES.map(d => ({ emoji: d.emoji, label: d.label, desc: faixaDe(d) })).map(({ emoji, label, desc }) => (
            <div key={label} className="flex items-center gap-3 px-3 py-2.5">
              <span className="text-lg">{emoji}</span>
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-3 text-xs text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">🏅 Medalhas</p>
          <p>
            Os pódios de cada mês e de cada época ficam guardados no teu perfil para sempre.
            O <Link to="/rankings" search={{ tab: "hof" } as any} className="text-gold underline">Hall of Fame</Link> guarda
            também o Mundial 2026, que deu origem a esta comunidade.
          </p>
        </div>
      </Section>

      {/* Torneios */}
      <Section icon={Users} title="Torneios Privados">
        <p className="mb-3 text-sm text-muted-foreground">
          Cria um torneio privado para competir com amigos e família, com regras à tua medida.
        </p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Cria um torneio e partilha o código de 6 letras com os teus amigos.",
            "Escolhes que competições contam: Liga Portugal, Champions, ou as duas.",
            "Escolhes que jogos contam: todos os oficiais, só os dos grandes, ou só os de um clube.",
            "Podes ligar ou desligar os duelos 1v1 dentro do torneio.",
            "Os pontos são os mesmos das tuas previsões — não precisas de votar duas vezes.",
            "Cada torneio tem o seu próprio chat.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* Comunidade */}
      <Section icon={TrendingUp} title="Comunidade">
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Segue outros adeptos e acompanha a atividade deles no feed.",
            "Quando um jogo termina, vês quem acertou o resultado ou o marcador exato.",
            "As percentagens da comunidade só ficam visíveis depois de votares — o segredo é do clube.",
            "Lê os prognósticos antes de votares, se quiseres uma ajuda.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <div className="pt-2 text-center">
        <Link to="/jogos"
          className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-background shadow-gold transition-smooth hover:scale-[1.02]">
          Ver os jogos da jornada <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

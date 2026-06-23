import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Target, Star, Zap, Users, ChevronRight, HelpCircle, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como Funciona — Uma Geração | Previsões Mundial 2026" },
      { name: "description", content: "Aprende como funciona o sistema de previsões, pontuações e torneios privados do Uma Geração para o Mundial 2026." },
      { property: "og:title", content: "Como Funciona — Uma Geração" },
      { property: "og:description", content: "Guia completo sobre previsões, pontos e torneios privados do Mundial 2026." },
      { property: "og:url", content: "https://mundial-voto-vibra.davidvilaverde.workers.dev/como-funciona" },
    ],
    links: [{ rel: "canonical", href: "https://mundial-voto-vibra.davidvilaverde.workers.dev/como-funciona" }],
  }),
  component: ComoFunciona,
});

function Section({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card/70 p-5">
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

function PointRow({ label, pts, note }: { label: string; pts: string; note?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
      </div>
      <span className="shrink-0 rounded-full bg-gold/20 px-2.5 py-0.5 text-xs font-bold text-gold">{pts}</span>
    </div>
  );
}

function ComoFunciona() {
  return (
    <div className="px-5 pt-6 pb-16 max-w-2xl mx-auto space-y-5">
      <header className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-bold text-gold uppercase tracking-wider">
          <HelpCircle className="h-3.5 w-3.5" /> Guia
        </div>
        <h1 className="font-display text-3xl">Como Funciona</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tudo o que precisas de saber para jogar e ganhar.</p>
      </header>

      {/* Quick steps */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { n: "1", label: "Vê o jogo" },
          { n: "2", label: "Faz a previsão" },
          { n: "3", label: "Sobe no ranking" },
        ].map(({ n, label }) => (
          <div key={n} className="rounded-2xl border border-border bg-card/60 p-3 text-center">
            <span className="grid mx-auto h-8 w-8 place-items-center rounded-full bg-gold text-background font-display text-base shadow-gold">
              {n}
            </span>
            <p className="mt-2 text-xs font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {/* Previsões */}
      <Section icon={Target} title="Tipos de Previsão">
        <p className="mb-3 text-sm text-muted-foreground">Antes de cada jogo podes fazer várias previsões independentes. Tens até ao apito inicial para submeter — depois fecha.</p>
        <div className="divide-y divide-border rounded-xl border border-border bg-background/40 overflow-hidden">
          <PointRow label="Resultado (1X2)" pts="3–4 pts" note="Vitória casa/fora = 3 pts · Empate = 4 pts (mais difícil, vale mais)" />
          <PointRow label="Ambas as equipas marcam (BTTS)" pts="2 pts" note="Sim ou Não — ambas têm de marcar pelo menos 1 golo" />
          <PointRow label="Total de golos +/- 2.5" pts="2 pts" note="Mais ou menos de 2.5 golos no total do jogo" />
          <PointRow label="Total de golos +/- 3.5" pts="3 pts" note="Mais ou menos de 3.5 golos — mais difícil, vale mais" />
          <PointRow label="Marcador exato" pts="10 pts" note="Acertar no placard exacto — a mais difícil e a que mais vale!" />
        </div>
      </Section>

      {/* Pontos */}
      <Section icon={Star} title="Como se Ganham Pontos">
        <ul className="space-y-2.5 text-sm">
          {[
            "Os pontos só são atribuídos após o jogo terminar.",
            "Cada mercado é independente — podes acertar num e errar noutro.",
            "Quanto mais difícil a previsão, mais pontos vale.",
            "Não há penalização por errar — o pior que pode acontecer é ficares a 0.",
            "Podes ver o detalhe dos pontos de cada previsão no histórico do teu perfil.",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0 grid h-5 w-5 place-items-center rounded-full bg-gold/20 text-xs font-bold text-gold">{i + 1}</span>
              <span className="text-muted-foreground">{tip}</span>
            </li>
          ))}
        </ul>
      </Section>

      {/* Ranking e Divisões */}
      <Section icon={Trophy} title="Rankings e Divisões">
        <p className="mb-3 text-sm text-muted-foreground">Há um ranking geral onde todos competem. Com base na tua posição és colocado numa divisão:</p>
        <div className="divide-y divide-border rounded-xl border border-border bg-background/40 overflow-hidden mb-4">
          {[
            { emoji: "🏆", label: "1ª Liga", desc: "Top 5 jogadores" },
            { emoji: "⚽", label: "2ª Liga", desc: "Posições 6 a 15" },
            { emoji: "🟡", label: "Distrital", desc: "Posições 16 a 30" },
            { emoji: "🟢", label: "Liga do Zé Povinho", desc: "A partir da posição 31" },
          ].map(({ emoji, label, desc }) => (
            <div key={label} className="flex items-center gap-3 px-3 py-2.5">
              <span className="text-lg">{emoji}</span>
              <div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Em caso de empate: maior pontuação → maior % de acerto → quem votou primeiro.</p>
      </Section>

      {/* Torneios */}
      <Section icon={Users} title="Torneios Privados">
        <p className="mb-3 text-sm text-muted-foreground">Cria um torneio privado para competir com amigos e família, com o teu próprio ranking separado.</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Cria um torneio e partilha o código de 6 letras com os teus amigos.",
            "Os pontos são os mesmos do ranking geral — não precisas de votar duas vezes.",
            "Podes estar em vários torneios ao mesmo tempo.",
            "Cada torneio tem o seu próprio chat para falares com os membros.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* Comunidade */}
      <Section icon={TrendingUp} title="Comunidade e Feed">
        <p className="mb-3 text-sm text-muted-foreground">O Uma Geração tem uma componente social que torna tudo mais interessante:</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Segue outros adeptos no ranking e acompanha a actividade deles no feed.",
            "Quando um jogo termina, vês quem acertou o resultado ou o marcador exato.",
            "As percentagens da comunidade só ficam visíveis depois de votares — o segredo é do clube.",
            "Recebes uma notificação quando alguém te começa a seguir.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* Dicas */}
      <Section icon={Zap} title="Dicas para Subir no Ranking">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {[
            { tip: "Arrisca no marcador exato", detail: "São 10 pts de uma vez — mesmo que só acertes 1 em 10, compensa." },
            { tip: "Não ignores o BTTS", detail: "Em jogos entre equipas ofensivas tem alta probabilidade de saírem golos dos dois lados." },
            { tip: "Qualidade > Quantidade", detail: "Menos previsões mas mais acertadas é sempre melhor do que votar em tudo." },
            { tip: "Submete cedo", detail: "Em caso de empate de pontos, quem votou primeiro leva a vantagem." },
          ].map(({ tip, detail }, i) => (
            <div key={i} className="rounded-xl border border-border bg-background/40 p-3">
              <p className="text-sm font-semibold text-gold">{tip}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="pt-2 text-center">
        <Link to="/jogos"
          className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-background shadow-gold transition-smooth hover:scale-[1.02]">
          Começar a votar <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

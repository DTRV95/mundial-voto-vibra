import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Target, Star, Zap, Users, ChevronRight, HelpCircle } from "lucide-react";

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
        <p className="mb-3 text-sm text-muted-foreground">Antes de cada jogo podes fazer várias previsões independentes. Tens até ao apito inicial para submeter.</p>
        <div className="divide-y divide-border rounded-xl border border-border bg-background/40 overflow-hidden">
          <PointRow label="Resultado (1X2)" pts="3–4 pts" note="Vitória casa/fora = 3 pts · Empate = 4 pts (mais difícil, vale mais!)" />
          <PointRow label="Ambas as equipas marcam (BTTS)" pts="2 pts" note="Ambas as equipas têm de marcar pelo menos 1 golo" />
          <PointRow label="Total de golos (2.5 / 3.5)" pts="2–3 pts" note="Mais/menos de 2.5 ou 3.5 golos no total" />
          <PointRow label="Dupla hipótese" pts="1 pt" note="Equipa da casa ou empate · Empate ou fora — mais seguro mas vale menos" />
          <PointRow label="Resultado exato" pts="10 pts" note="Acertares no marcador exacto — a mais difícil e a que mais vale!" />
          <PointRow label="Combo especial (1.5 / 3.5)" pts="4–5 pts" note="Previsões combinadas de golos + resultado" />
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

      {/* Ranking */}
      <Section icon={Trophy} title="Rankings e Desempate">
        <p className="mb-3 text-sm text-muted-foreground">Há um ranking geral e rankings por fase do Mundial (Grupos, Oitavos, etc.). Em caso de empate na pontuação aplica-se:</p>
        <ol className="space-y-2">
          {[
            "Maior pontuação total",
            "Maior percentagem de acerto",
            "Menor número de previsões feitas (qualidade > quantidade)",
            "Quem submeteu a previsão primeiro",
          ].map((rule, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm">
              <span className="shrink-0 grid h-6 w-6 place-items-center rounded-full bg-secondary text-xs font-bold text-muted-foreground">{i + 1}</span>
              <span>{rule}</span>
            </li>
          ))}
        </ol>
      </Section>

      {/* Torneios */}
      <Section icon={Users} title="Torneios Privados (Ligas)">
        <p className="mb-3 text-sm text-muted-foreground">Cria um torneio privado para competir com amigos. Tens o teu próprio ranking separado do ranking geral.</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            Cria um torneio e partilha o código de 6 letras com os amigos.
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            Os pontos são os mesmos do ranking geral — não precisas de votar duas vezes.
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            Podes estar em vários torneios ao mesmo tempo.
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            O criador do torneio pode eliminar o grupo a qualquer momento.
          </li>
        </ul>
      </Section>

      {/* Dicas */}
      <Section icon={Zap} title="Dicas para Subir no Ranking">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {[
            { tip: "Aposta no resultado exato", detail: "São 10 pts de uma vez — vale a pena arriscar." },
            { tip: "Não ignores o BTTS", detail: "Jogos com equipas ofensivas têm alta probabilidade." },
            { tip: "Qualidade > Quantidade", detail: "Menos previsões mas mais acertadas bate mais previsões erradas." },
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

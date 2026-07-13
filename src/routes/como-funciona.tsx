import { createFileRoute, Link } from "@tanstack/react-router";
import { Trophy, Target, Star, Zap, Users, ChevronRight, HelpCircle, TrendingUp, Swords, RotateCcw } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como Funciona — Uma Geração | Previsões Mundial 2026" },
      { name: "description", content: "Aprende como funciona o sistema de previsões, pontuações e torneios privados do Uma Geração para o Mundial 2026." },
      { property: "og:title", content: "Como Funciona — Uma Geração" },
      { property: "og:description", content: "Guia completo sobre previsões, pontos e torneios privados do Mundial 2026." },
      { property: "og:url", content: "https://geracao2026.com/como-funciona" },
    ],
    links: [{ rel: "canonical", href: "https://geracao2026.com/como-funciona" }],
  }),
  component: ComoFunciona,
});

function Section({ icon: Icon, title, children, accent }: { icon: React.ElementType; title: string; children: React.ReactNode; accent?: string }) {
  return (
    <section className={`rounded-2xl border bg-card/70 p-5 ${accent ?? "border-border"}`}>
      <div className="mb-4 flex items-center gap-2.5">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${accent ? "bg-gold/20 text-gold" : "bg-gold/15 text-gold"}`}>
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="font-display text-xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function PointRow({ label, pts, note, highlight }: { label: string; pts: string; note?: string; highlight?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-3 py-2.5 border-b border-border last:border-0 ${highlight ? "bg-gold/5 -mx-3 px-3 rounded" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${highlight ? "text-gold" : ""}`}>{label}</p>
        {note && <p className="text-xs text-muted-foreground mt-0.5">{note}</p>}
      </div>
      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${highlight ? "bg-gold text-background" : "bg-gold/20 text-gold"}`}>{pts}</span>
    </div>
  );
}

function PhaseTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-smooth ${
        active ? "border-gold bg-gold text-background" : "border-border bg-card/60 text-muted-foreground hover:border-gold/40"
      }`}>
      {label}
    </button>
  );
}

function ComoFunciona() {
  const [phaseTab, setPhaseTab] = useState<"grupos" | "matamata">("matamata");

  return (
    <div className="px-5 pt-6 pb-16 max-w-2xl mx-auto space-y-5">
      <header className="mb-6">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-xs font-bold text-gold uppercase tracking-wider">
          <HelpCircle className="h-3.5 w-3.5" /> Guia
        </div>
        <h1 className="font-display text-3xl">Como Funciona</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tudo o que precisas de saber para jogar e ganhar.</p>
      </header>

      {/* Alerta mata-mata */}
      <div className="rounded-2xl border border-gold/25 overflow-hidden bg-gradient-to-r from-gold/8 via-gold/4 to-transparent">
        <div className="h-1 w-full wc-tricolor rounded-t-2xl" />
        <div className="p-4 flex items-start gap-3">
          <span className="text-2xl shrink-0">⚔️</span>
          <div>
            <p className="text-sm font-bold text-gold">Estamos no Mata-Mata!</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              A fase de grupos terminou. Os pontos foram reiniciados e começa uma nova corrida a partir dos 16 Avos de Final.
              Há um novo mercado e as regras são as mesmas — mas cada jogo vale mais.
            </p>
          </div>
        </div>
      </div>

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

      {/* Mercados por fase */}
      <Section icon={Target} title="Mercados de Previsão">
        <p className="mb-3 text-sm text-muted-foreground">
          Tens até ao apito inicial para submeter as tuas previsões. Cada mercado é independente.
        </p>
        <div className="flex gap-2 mb-4">
          <PhaseTab label="Fase de Grupos" active={phaseTab === "grupos"} onClick={() => setPhaseTab("grupos")} />
          <PhaseTab label="⚔️ Mata-Mata" active={phaseTab === "matamata"} onClick={() => setPhaseTab("matamata")} />
        </div>

        {phaseTab === "grupos" && (
          <div className="divide-y divide-border rounded-xl border border-border bg-background/40 overflow-hidden">
            <PointRow label="Resultado final (1X2)" pts="3–4 pts" note="Vitória casa/fora = 3 pts · Empate = 4 pts (mais difícil, vale mais)" />
            <PointRow label="Ambas as equipas marcam (BTTS)" pts="2 pts" note="Sim ou Não — ambas têm de marcar pelo menos 1 golo" />
            <PointRow label="Total de golos +/- 2.5" pts="2 pts" note="Mais ou menos de 2.5 golos no total do jogo" />
            <PointRow label="Total de golos +/- 3.5" pts="3 pts" note="Mais ou menos de 3.5 golos — mais difícil, vale mais" />
            <PointRow label="Marcador exato" pts="10 pts" note="Acertar no placard exacto — a mais difícil e a que mais vale!" />
          </div>
        )}

        {phaseTab === "matamata" && (
          <div className="space-y-3">
            <div className="divide-y divide-border rounded-xl border border-border bg-background/40 overflow-hidden">
              <PointRow label="Resultado final (1X2)" pts="3–4 pts" note="Vitória casa/fora = 3 pts · Empate = 4 pts" />
              <PointRow label="Ambas as equipas marcam (BTTS)" pts="2 pts" note="Sim ou Não — baseado nos 90 minutos + prolongamento" />
              <PointRow label="Total de golos +/- 2.5" pts="2 pts" note="Total de golos nos 90 minutos + prolongamento" />
              <PointRow label="Marcador exato" pts="10 pts" note="Acertar o placard exacto ao fim do tempo regulamentar" />
              <PointRow label="Qualificar 🆕" pts="4 pts" note="Escolhes qual das duas equipas passa à próxima ronda — vale mesmo se houver penáltis!" highlight />
            </div>
            <div className="rounded-xl border border-wc-blue/30 bg-wc-blue/5 p-3 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">ℹ️ Como funciona o «Qualificar»</p>
              <p>É o único mercado que conta o resultado da eliminatória inteira — incluindo prolongamento e grandes penalidades. Não interessa como a equipa passa, o que importa é que passe.</p>
            </div>
          </div>
        )}
      </Section>

      {/* Reset de pontos */}
      <Section icon={RotateCcw} title="Reset de Pontos por Fase">
        <p className="mb-3 text-sm text-muted-foreground">
          Os pontos são reiniciados no início de cada fase. Isto significa que toda a gente parte do zero — independentemente de quem estava a ganhar.
        </p>
        <div className="space-y-2">
          {[
            { phase: "Fase de Grupos", status: "✅ Concluída", desc: "Resultados guardados no Hall of Fame" },
            { phase: "16 Avos de Final", status: "✅ Concluída", desc: "" },
            { phase: "Oitavos de Final", status: "✅ Concluída", desc: "" },
            { phase: "Quartos de Final", status: "✅ Concluída", desc: "" },
            { phase: "Meias-Finais", status: "🔥 A decorrer", desc: "" },
            { phase: "Final", status: "⏳ Em breve", desc: "" },
          ].map(({ phase, status, desc }) => (
            <div key={phase} className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{phase}</p>
                {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
              </div>
              <span className="shrink-0 text-xs font-semibold">{status}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Os resultados de cada fase ficam guardados no <Link to="/rankings" search={{ tab: "hof" } as any} className="underline text-gold">Hall of Fame</Link> para sempre — ninguém é esquecido.
        </p>
      </Section>

      {/* Pontos */}
      <Section icon={Star} title="Como se Ganham Pontos">
        <ul className="space-y-2.5 text-sm">
          {[
            "Os pontos só são atribuídos após o jogo terminar.",
            "Cada mercado é independente — podes acertar num e errar noutro.",
            "Quanto mais difícil a previsão, mais pontos vale.",
            "Não há penalização por errar — o pior que pode acontecer é ficares a 0.",
            "No mata-mata, o mercado «Qualificar» é o único que conta o resultado final da eliminatória (incluindo penáltis).",
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
        <p className="mb-3 text-sm text-muted-foreground">
          Há um ranking geral onde todos competem por fase. Com base na tua posição és colocado numa divisão:
        </p>
        <div className="divide-y divide-border rounded-xl border border-border bg-background/40 overflow-hidden mb-4">
          {[
            { emoji: "🏆", label: "1ª Liga", desc: "Top 10 jogadores" },
            { emoji: "⚽", label: "2ª Liga", desc: "Posições 11 a 25" },
            { emoji: "🟡", label: "Distrital", desc: "Posições 26 a 50" },
            { emoji: "🟢", label: "Liga do Zé Povinho", desc: "A partir da posição 51" },
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
        <div className="rounded-xl border border-gold/25 bg-gold/5 p-3 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground mb-1">🏅 Hall of Fame</p>
          <p>No final de cada fase, o top 3 fica registado para sempre no <Link to="/rankings" search={{ tab: "hof" } as any} className="underline text-gold">Hall of Fame</Link>. Ganha a fase, ganha a imortalidade.</p>
        </div>
      </Section>

      {/* Torneios */}
      <Section icon={Users} title="Torneios Privados">
        <p className="mb-3 text-sm text-muted-foreground">Cria um torneio privado para competir com amigos e família, com o teu próprio ranking separado.</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[
            "Cria um torneio e partilha o código de 6 letras com os teus amigos.",
            "Os pontos são os mesmos do ranking geral — não precisas de votar duas vezes.",
            "Podes estar em vários torneios ao mesmo tempo.",
            "O campeão de cada fase dentro do teu torneio fica registado no banner do torneio.",
            "Cada torneio tem o seu próprio chat para falares com os membros.",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {item}
            </li>
          ))}
        </ul>
      </Section>

      {/* Mata-Mata dicas */}
      <Section icon={Swords} title="Estratégia para o Mata-Mata" accent="border-gold/30">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {[
            { tip: "Aposta no «Qualificar»", detail: "4 pts garantidos se acertares quem passa — e conta mesmo em penáltis. Não deixes passar." },
            { tip: "Jogos de eliminação = menos golos", detail: "No mata-mata as equipas jogam mais fechadas. Pondera bem o +/- 2.5 golos." },
            { tip: "Arrisca no marcador exato", detail: "10 pts de uma vez — mesmo que só acertes 1 em 10, compensa muito." },
            { tip: "Submete cedo", detail: "Em caso de empate de pontos, quem votou primeiro leva a vantagem." },
          ].map(({ tip, detail }, i) => (
            <div key={i} className="rounded-xl border border-border bg-background/40 p-3">
              <p className="text-sm font-semibold text-gold">{tip}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
            </div>
          ))}
        </div>
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

      <div className="pt-2 text-center">
        <Link to="/jogos"
          className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-bold text-background shadow-gold transition-smooth hover:scale-[1.02]">
          Ver jogos do mata-mata <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

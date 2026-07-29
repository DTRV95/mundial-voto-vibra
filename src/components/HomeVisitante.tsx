import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, Users, Target, ShieldCheck } from "lucide-react";
import type { Competition } from "@/lib/useCompetitions";
import { useJornadas, jornadaEmFoco } from "@/lib/useJornada";
import { TeamBadge } from "@/lib/teamColors.tsx";
import { nomeCurto } from "@/lib/clubBadge";
import { formatTime } from "@/lib/format";
import {
  SeccaoFeature, EcraJornada, EcraTorneios, EcraDuelos, EcraDivisoes, EcraPrognosticos,
} from "@/components/FeatureTelemovel";

/**
 * A página de quem ainda não tem conta.
 *
 * A ideia: em vez de prometer, mostrar. Os jogos que aparecem são os
 * jogos reais desta jornada, com os emblemas reais. Quem chega vê o
 * produto a funcionar antes de decidir se se regista.
 */

export function HomeVisitante({ competitions, activeComp, totalAdeptos, previsoesHoje }: {
  competitions: Competition[];
  activeComp: Competition | null;
  totalAdeptos: number;
  previsoesHoje: number;
}) {
  const { data: jornadas = [] } = useJornadas(activeComp?.id);
  const jornada = jornadaEmFoco(jornadas);

  // Emblemas para a fita — os clubes das competições que seguimos
  const { data: clubes = [] } = useQuery({
    queryKey: ["clubes-fita"],
    staleTime: 600_000,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("teams")
        .select("id,name,crest_url,monogram,code")
        .eq("kind", "club")
        .not("crest_url", "is", null)
        .limit(24);
      return (data ?? []) as any[];
    },
  });

  const acento = activeComp?.accent ?? "#E10014";
  const eletrico = activeComp?.electric ?? "#19FF91";
  const profundo = activeComp?.deep ?? "#82000A";

  return (
    // Fundo escuro próprio: sem isto, os halos de cor lavavam a página
    // e o texto branco deixava de se ler.
    <div className="relative isolate min-h-screen overflow-hidden" style={{ background: "#080B12" }}>

      {/* ── Fundo vivo, por baixo de tudo ───────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="aurora absolute -left-[25%] -top-[15%] h-[65vh] w-[75vw] rounded-full"
          style={{ background: `radial-gradient(circle, ${acento} 0%, transparent 68%)`, filter: "blur(110px)", opacity: 0.38 }} />
        <div className="aurora-lenta absolute -right-[20%] top-[18%] h-[55vh] w-[65vw] rounded-full"
          style={{ background: `radial-gradient(circle, ${eletrico} 0%, transparent 68%)`, filter: "blur(130px)", opacity: 0.14 }} />
        <div className="absolute inset-x-0 top-0 h-[70vh]"
          style={{ background: `linear-gradient(180deg, ${profundo}66 0%, transparent 75%)` }} />
        {activeComp?.motif === "stars"
          ? <div className="motif-stars absolute inset-x-0 top-0 h-[80vh] opacity-40" />
          : <div className="motif-speed absolute inset-x-0 top-0 h-[70vh] opacity-20" />}

        {/* Véu escuro por cima dos halos: garante contraste do texto
            seja qual for a cor da competição */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgba(8,11,18,0.35) 0%, rgba(8,11,18,0.55) 45%, rgba(8,11,18,0.80) 100%)" }} />
      </div>

      {/* Todo o conteúdo fica acima do fundo */}
      <div className="relative z-10">

      {/* ── HERO ────────────────────────────────────────────── */}
      <section className="px-5 pb-8 pt-10 md:px-8 md:pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ background: eletrico }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: eletrico }} />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">
              Época 2026/27 · Liga Portugal e Champions
            </span>
          </div>

          <h1 className="font-display leading-[0.92]" style={{ fontSize: "clamp(2.6rem, 9vw, 5.5rem)" }}>
            <span className="block text-white">O teu grupo de amigos</span>
            <span className="texto-vivo block"
              style={{ backgroundImage: `linear-gradient(100deg, ${acento}, ${eletrico}, #FFFFFF, ${acento})` }}>
              tem um campeão
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base text-white/70 md:text-lg">
            Cinco jogos por jornada, os mesmos para toda a gente. Cria o teu torneio,
            desafia quem quiseres para um duelo, e prova quem percebe mesmo de futebol.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/auth"
              className="pressable group inline-flex w-full items-center justify-center gap-2 rounded-2xl px-7 py-3.5 text-base font-bold text-white sm:w-auto"
              style={{
                background: `linear-gradient(135deg, ${acento} 0%, ${profundo} 100%)`,
                boxShadow: `0 10px 34px -8px ${acento}, inset 0 1px 0 rgba(255,255,255,0.28)`,
              }}>
              Criar conta grátis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link to="/como-funciona"
              className="inline-flex w-full items-center justify-center rounded-2xl border border-white/20 px-6 py-3.5 text-base font-bold text-white/85 backdrop-blur-sm transition-smooth hover:border-white/40 hover:bg-white/5 sm:w-auto">
              Como funciona
            </Link>
          </div>

          {/* Números reais — sem promessas */}
          {(totalAdeptos > 0 || previsoesHoje > 0) && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-white/60">
              {totalAdeptos > 0 && (
                <span className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" style={{ color: eletrico }} />
                  <strong className="font-display text-lg text-white tabular-nums">{totalAdeptos}</strong> adeptos
                </span>
              )}
              {previsoesHoje > 0 && (
                <span className="flex items-center gap-2 text-sm">
                  <Target className="h-4 w-4" style={{ color: eletrico }} />
                  <strong className="font-display text-lg text-white tabular-nums">{previsoesHoje}</strong> previsões hoje
                </span>
              )}
              <span className="flex items-center gap-2 text-sm">
                <ShieldCheck className="h-4 w-4" style={{ color: eletrico }} />
                Grátis, sem apostas
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── Fita de emblemas ────────────────────────────────── */}
      {clubes.length > 6 && (
        <div className="relative mb-10 overflow-hidden py-3"
          style={{ maskImage: "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)" }}>
          <div className="fita-emblemas flex w-max gap-8">
            {[...clubes, ...clubes].map((c, i) => (
              <img key={`${c.id}-${i}`} src={c.crest_url} alt={c.name} loading="lazy"
                className="h-9 w-9 object-contain opacity-45 transition-opacity hover:opacity-100" />
            ))}
          </div>
        </div>
      )}

      {/* ── A JORNADA REAL ──────────────────────────────────── */}
      {jornada && jornada.jogos.length > 0 && (
        <section className="px-5 pb-12 md:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: eletrico }}>
                  Está a acontecer agora
                </p>
                <h2 className="font-display text-2xl text-white md:text-3xl">
                  {jornada.label} · {activeComp?.short}
                </h2>
              </div>
              <span className="hidden shrink-0 text-xs text-white/50 sm:block">
                Os mesmos 5 jogos para toda a gente
              </span>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {jornada.jogos.map(j => (
                <div key={j.id}
                  className="cartao-eleva flex min-w-0 items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 backdrop-blur-sm">
                  <TeamBadge code={j.home.code} flag={j.home.flag} name={j.home.name}
                    monogram={(j.home as any).monogram} crest={(j.home as any).crest_url} size="sm" />
                  <div className="min-w-0 flex-1 text-center">
                    <p className="truncate text-[11px] font-bold text-white/85">
                      {nomeCurto(j.home.name)} <span className="text-white/35">v</span> {nomeCurto(j.away.name)}
                    </p>
                    <p className="text-[10px] text-white/45">{formatTime(j.kickoff_at)}</p>
                  </div>
                  <TeamBadge code={j.away.code} flag={j.away.flag} name={j.away.name}
                    monogram={(j.away as any).monogram} crest={(j.away as any).crest_url} size="sm" />
                </div>
              ))}
            </div>

            <div className="mt-4 text-center">
              <Link to="/auth"
                className="inline-flex items-center gap-1.5 text-sm font-bold transition-smooth hover:gap-2.5"
                style={{ color: eletrico }}>
                Dar as minhas previsões <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── AS FEATURES, UMA A UMA, COM O ECRÃ AO LADO ──────── */}
      <div className="border-y border-white/8 bg-black/25">
        <div className="px-5 pt-14 text-center md:px-8">
          <h2 className="font-display text-3xl text-white md:text-5xl">Não é só palpitar</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            É competir com pessoas com nome, cara e conversa no grupo.
          </p>
        </div>

        <SeccaoFeature
          etiqueta="A jornada"
          cor={acento}
          titulo={<>Cinco jogos.<br />Cinco minutos.</>}
          texto="Nada de 300 jogos por época. Cinco por jornada, escolhidos a dedo — e exatamente os mesmos para toda a gente. Ninguém ganha por ter mais tempo livre para votar."
          pontos={[
            "Dois destaques, dois equilibrados e um de rotação",
            "Fecha 5 minutos antes do apito inicial",
            "Quatro mercados por jogo, do 1X2 ao resultado exato",
          ]}
        >
          <EcraJornada jornada={jornada} cor={acento} />
        </SeccaoFeature>

        <SeccaoFeature
          etiqueta="Torneios privados"
          cor="#FFB020"
          inverter
          titulo={<>O teu grupo,<br />as tuas regras.</>}
          texto="Cria um torneio, partilha um código de 6 letras e decide como se joga. Cada grupo pode ter regras completamente diferentes."
          pontos={[
            "Escolhe que competições contam",
            "Só os jogos dos grandes, ou só os do teu clube",
            "Chat próprio e duelos lá dentro",
          ]}
        >
          <EcraTorneios cor="#FFB020" />
        </SeccaoFeature>

        <SeccaoFeature
          etiqueta="Duelos 1 contra 1"
          cor={eletrico}
          titulo={<>Um contra um.<br />Para a vida.</>}
          texto="Desafia qualquer adepto por um jogo, uma jornada ou o mês inteiro. Ganhas pontos num ranking à parte — e o confronto direto fica guardado para sempre."
          pontos={[
            "Jogo ×2 · Jornada ×3 · Mês ×6",
            "Ranking de duelos reinicia todos os meses",
            "5–2 contra o teu cunhado, para sempre no histórico",
          ]}
        >
          <EcraDuelos cor={eletrico} />
        </SeccaoFeature>

        <SeccaoFeature
          etiqueta="Divisões e medalhas"
          cor="#FFB020"
          inverter
          titulo={<>Sobe de divisão.<br />Ou desce.</>}
          texto="Da Liga do Zé Povinho à 1ª Liga. Cada mês é uma corrida nova, e os pódios ficam no teu perfil como medalhas permanentes."
          pontos={[
            "Quatro divisões, por posição no ranking",
            "Vencedor de cada mês, além da época",
            "Medalhas que nunca se perdem",
          ]}
        >
          <EcraDivisoes cor="#FFB020" />
        </SeccaoFeature>

        <SeccaoFeature
          etiqueta="Prognósticos"
          cor={acento}
          titulo={<>Decide com mais<br />do que o coração.</>}
          texto="Análise de cada jogo oficial antes de votares: probabilidades, contexto e uma sugestão. Usas se quiseres — ou segues o instinto."
          pontos={[
            "Probabilidades por mercado",
            "Publicados antes de cada jornada",
            "A um toque dos jogos",
          ]}
        >
          <EcraPrognosticos jornada={jornada} cor={acento} />
        </SeccaoFeature>
      </div>

      {/* ── COMO SE COMEÇA ──────────────────────────────────── */}
      <section className="px-5 pb-14 md:px-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-7 text-center font-display text-2xl text-white md:text-3xl">
            Começar leva um minuto
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { n: "1", t: "Cria conta", d: "Grátis, com email. Sem cartão, sem apostas." },
              { n: "2", t: "Escolhe competições", d: "Liga Portugal, Champions, ou as duas." },
              { n: "3", t: "Chama os amigos", d: "Um código de 6 letras e está o torneio feito." },
            ].map(p => (
              <div key={p.n} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-center backdrop-blur-sm">
                <span className="mx-auto grid h-10 w-10 place-items-center rounded-full font-display text-lg text-white"
                  style={{ background: `linear-gradient(135deg, ${acento}, ${profundo})`, boxShadow: `0 6px 18px -6px ${acento}` }}>
                  {p.n}
                </span>
                <p className="mt-3 font-display text-lg text-white">{p.t}</p>
                <p className="mt-1 text-xs text-white/55">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMPETIÇÕES ─────────────────────────────────────── */}
      {competitions.length > 0 && (
        <section className="px-5 pb-16 md:px-8">
          <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
            {competitions.map(c => (
              <div key={c.id} className="cartao-eleva overflow-hidden rounded-2xl border border-white/10"
                style={{ background: c.heroGradient }}>
                <div className="px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: c.electric }}>
                    Competição
                  </p>
                  <p className="font-display text-2xl text-white">{c.emoji} {c.name}</p>
                  <p className="mt-1 text-xs" style={{ color: c.tone }}>
                    5 jogos oficiais por jornada · ranking próprio
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── FECHO ───────────────────────────────────────────── */}
      <section className="px-5 pb-20 md:px-8">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl border border-white/10 px-6 py-12 text-center"
          style={{
            background: `linear-gradient(150deg, ${acento} 0%, ${profundo} 65%, #0d1017 100%)`,
            boxShadow: `0 20px 60px -20px ${acento}`,
          }}>
          <div className="sheen absolute inset-0" />
          <div className="relative">
            <h2 className="font-display text-3xl leading-tight text-white md:text-4xl">
              A próxima jornada não espera por ti
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/75">
              Entra, escolhe as tuas competições e chama os teus amigos. Leva um minuto.
            </p>
            <Link to="/auth"
              className="pressable group mt-6 inline-flex items-center gap-2 rounded-2xl bg-white px-8 py-3.5 text-base font-bold"
              style={{ color: profundo }}>
              Criar conta grátis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}

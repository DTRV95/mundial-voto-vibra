import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowDown, Bell } from "lucide-react";
import { Revelar } from "@/components/Revelar";
import {
  SeccaoFeature, EcraJornada, EcraTorneios, EcraDuelos, EcraDivisoes, EcraPrognosticos,
} from "@/components/FeatureTelemovel";

/**
 * A página de lançamento da época 2026/27.
 *
 * Vai no lugar da homepage em geracao2026.com enquanto a época nova não
 * arranca. Diz a data, conta o tempo que falta, e depois — à medida que
 * se faz scroll — mostra o que vem aí, com o produto a sério dentro dos
 * telemóveis.
 *
 * Os ecrãs das maquetas são os mesmos componentes da homepage de
 * visitantes. Não são capturas: se o desenho mudar, isto acompanha.
 */

/** 1 de outubro de 2026, à meia-noite em Lisboa (UTC+1, horário de verão). */
const LANCAMENTO = new Date("2026-09-30T23:00:00Z");

const VERMELHO = "#E10014";
const MENTA = "#19FF91";
const AZUL = "#183059";
const CIANO = "#00FAFF";
const DOURADO = "#FFB020";

export const Route = createFileRoute("/em-breve")({
  head: () => ({
    meta: [
      { title: "Uma Geração — a nova época chega a 1 de outubro" },
      { name: "description", content: "Liga Portugal e Champions, 8 jogos por jornada, divisões, duelos e torneios entre amigos. A nova versão do Uma Geração chega a 1 de outubro de 2026." },
      { property: "og:title", content: "Uma Geração — 1 de outubro" },
      { property: "og:description", content: "A nova época está a chegar. Liga Portugal e Champions, cinco jogos por jornada, e uma plataforma que te conhece." },
      { property: "og:url", content: "https://geracao2026.com" },
    ],
  }),
  component: EmBreve,
});

interface Falta { dias: number; horas: number; minutos: number; segundos: number; chegou: boolean }

function calcular(agora: number): Falta {
  const falta = LANCAMENTO.getTime() - agora;
  if (falta <= 0) return { dias: 0, horas: 0, minutos: 0, segundos: 0, chegou: true };
  return {
    dias: Math.floor(falta / 86_400_000),
    horas: Math.floor((falta % 86_400_000) / 3_600_000),
    minutos: Math.floor((falta % 3_600_000) / 60_000),
    segundos: Math.floor((falta % 60_000) / 1000),
    chegou: false,
  };
}

function EmBreve() {
  // No servidor não há relógio de confiança — o contador só começa no
  // cliente, para não haver divergência entre o HTML e o que se vê.
  const [falta, setFalta] = useState<Falta | null>(null);

  useEffect(() => {
    setFalta(calcular(Date.now()));
    const t = setInterval(() => setFalta(calcular(Date.now())), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative isolate min-h-screen overflow-hidden" style={{ background: "#080B12" }}>

      {/* ── Fundo ─────────────────────────────────────────── */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <div className="aurora absolute -left-[25%] -top-[18%] h-[70vh] w-[80vw] rounded-full"
          style={{ background: `radial-gradient(circle, ${VERMELHO} 0%, transparent 68%)`, filter: "blur(115px)", opacity: 0.34 }} />
        <div className="aurora-lenta absolute -right-[22%] top-[12%] h-[60vh] w-[70vw] rounded-full"
          style={{ background: `radial-gradient(circle, ${CIANO} 0%, transparent 68%)`, filter: "blur(135px)", opacity: 0.13 }} />
        {/* Véu escuro por cima dos halos: sem ele o texto branco perde-se */}
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(8,11,18,0.55) 0%, rgba(8,11,18,0.82) 55%, #080B12 100%)" }} />
      </div>

      <div className="relative z-10">

        {/* ── Hero ───────────────────────────────────────── */}
        <section className="flex min-h-[100svh] flex-col items-center justify-center px-5 py-16 text-center md:px-8">
          <Revelar>
            <span className="inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.24em]"
              style={{ borderColor: `${MENTA}55`, background: `${MENTA}14`, color: MENTA }}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" style={{ background: MENTA }} />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: MENTA }} />
              </span>
              Época 2026/27
            </span>
          </Revelar>

          <Revelar atraso={90}>
            <h1 className="mt-6 font-display text-[clamp(2.9rem,13vw,7rem)] uppercase leading-[0.88] text-white">
              A nova geração<br />
              <span className="texto-vivo">chega a 1 de outubro</span>
            </h1>
          </Revelar>

          <Revelar atraso={180}>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/65 md:text-lg">
              O Mundial acabou e ficou guardado. O que vem a seguir é maior:
              Liga Portugal e Champions, todas as jornadas, todo o ano.
            </p>
          </Revelar>

          <Revelar atraso={260}>
            <Contador falta={falta} />
          </Revelar>

          <Revelar atraso={340}>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
              <Link
                to="/auth"
                className="pressable inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-white transition-smooth hover:scale-[1.03]"
                style={{ background: VERMELHO, boxShadow: `0 12px 34px -10px ${VERMELHO}` }}
              >
                <Bell className="h-4 w-4" />
                Criar conta e ser avisado
              </Link>
              <span className="text-xs text-white/40">Grátis. Sem apostas, sem dinheiro.</span>
            </div>
          </Revelar>

          <Revelar atraso={440} className="mt-14">
            <span className="flex flex-col items-center gap-2 text-[10px] font-bold uppercase tracking-[0.24em] text-white/30">
              O que vem aí
              <ArrowDown className="h-4 w-4 animate-bounce" />
            </span>
          </Revelar>
        </section>

        {/* ── As funcionalidades ─────────────────────────── */}
        <Revelar>
          <SeccaoFeature
            etiqueta="Todas as semanas"
            titulo={<>Oito jogos.<br />Os mesmos para toda a gente.</>}
            texto="Em cada jornada há cinco jogos oficiais escolhidos a dedo. Dás a tua previsão antes do apito e ganhas pontos pelo que acertares — resultado, golos, ambas marcam e o placar certo."
            pontos={[
              "Liga Portugal e Champions, a época inteira",
              "Fecha cinco minutos antes do apito inicial",
              "Dez pontos para quem acertar o resultado exato",
            ]}
            cor={VERMELHO}
          >
            <EcraJornada jornada={null} cor={VERMELHO} />
          </SeccaoFeature>
        </Revelar>

        <Revelar>
          <SeccaoFeature
            etiqueta="Entre amigos"
            titulo={<>Um torneio só do teu grupo.</>}
            texto="Cria um torneio, manda o código pelo WhatsApp e joga contra quem já conheces. As regras são tuas: que competições contam, a partir de quando, e quem pode entrar."
            pontos={[
              "Código de convite e classificação própria",
              "Conversa dentro do torneio",
              "Regras configuráveis por quem o cria",
            ]}
            cor={DOURADO}
            inverter
          >
            <EcraTorneios cor={DOURADO} />
          </SeccaoFeature>
        </Revelar>

        <Revelar>
          <SeccaoFeature
            etiqueta="Cara a cara"
            titulo={<>Duelos de um contra um.</>}
            texto="Desafia alguém para uma jornada inteira. Ganha quem fizer mais pontos nos cinco jogos. As rivalidades ficam guardadas — e o histórico de quem ganhou mais vezes também."
            pontos={[
              "Uma jornada, dois adeptos, um vencedor",
              "Histórico de cada rivalidade",
              "Um rival do mês escolhido para ti",
            ]}
            cor={MENTA}
          >
            <EcraDuelos cor={MENTA} />
          </SeccaoFeature>
        </Revelar>

        <Revelar>
          <SeccaoFeature
            etiqueta="Subir na tabela"
            titulo={<>Da Liga do Zé Povinho<br />à 1ª Liga.</>}
            texto="Toda a gente começa no mesmo sítio. A tua posição na classificação geral põe-te numa divisão, e cada jornada pode mudá-la. O top 10 é a 1ª Liga — e há sempre alguém encostado à porta."
            pontos={[
              "Quatro divisões, da 1ª Liga à Liga do Zé Povinho",
              "Seta de tendência: subiste ou desceste desde ontem",
              "Classificação por competição e por mês",
            ]}
            cor={CIANO}
            inverter
          >
            <EcraDivisoes cor={CIANO} />
          </SeccaoFeature>
        </Revelar>

        <Revelar>
          <SeccaoFeature
            etiqueta="Antes de votares"
            titulo={<>Prognósticos para cada jogo.</>}
            texto="Análise do confronto, forma das equipas e o que costuma acontecer neste tipo de jogo. Lês, decides, e votas — ou ignoras tudo e vais pelo instinto."
            pontos={[
              "Uma análise por jogo oficial",
              "Probabilidades e tendências",
              "A opinião da comunidade, se a quiseres ver",
            ]}
            cor={AZUL === "#183059" ? CIANO : AZUL}
          >
            <EcraPrognosticos jornada={null} cor={CIANO} />
          </SeccaoFeature>
        </Revelar>

        {/* ── O DNA — a novidade maior, por isso leva bloco próprio ── */}
        <Revelar>
          <section className="px-5 py-16 md:px-8 md:py-24">
            <div className="mx-auto max-w-3xl rounded-3xl border p-8 text-center md:p-12"
              style={{ borderColor: `${CIANO}33`, background: "linear-gradient(160deg, rgba(0,250,255,0.07), transparent 70%)" }}>
              <span className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ background: `${CIANO}18`, color: CIANO, border: `1px solid ${CIANO}44` }}>
                Novo
              </span>
              <h2 className="mt-4 font-display text-4xl uppercase leading-none text-white md:text-6xl">
                O teu DNA
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/65">
                Quanto mais jogas, mais a plataforma te conhece. Descobre qual é a
                equipa que te dá sorte e qual é a que te tira o sono, se és de apostar
                no favorito ou de ir contra a bancada, e o que muda no teu jogo de mês
                para mês.
              </p>
              <p className="mx-auto mt-4 max-w-xl text-sm text-white/40">
                Não é um questionário. É construído a partir das tuas previsões,
                e há sempre uma descoberta nova à tua espera.
              </p>
            </div>
          </section>
        </Revelar>

        {/* ── Fecho ──────────────────────────────────────── */}
        <Revelar>
          <section className="px-5 pb-24 pt-4 text-center md:px-8">
            <h2 className="font-display text-3xl uppercase leading-none text-white md:text-5xl">
              1 de outubro
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/55">
              Cria a conta agora e entras com tudo pronto no primeiro dia.
              Quem já tinha conta do Mundial mantém-na — e o que fizeste lá
              fica guardado para sempre.
            </p>
            <Link
              to="/auth"
              className="pressable mt-7 inline-flex items-center gap-2 rounded-2xl px-7 py-4 text-sm font-bold text-white transition-smooth hover:scale-[1.03]"
              style={{ background: VERMELHO, boxShadow: `0 14px 38px -10px ${VERMELHO}` }}
            >
              Criar conta grátis
            </Link>

            <p className="mt-10 text-[11px] text-white/25">
              Uma Geração · geracao2026.com · sem apostas, sem dinheiro, só futebol
            </p>
          </section>
        </Revelar>

      </div>
    </div>
  );
}

/** O contador. Antes de o cliente arrancar mostra riscos, não zeros. */
function Contador({ falta }: { falta: Falta | null }) {
  if (falta?.chegou) {
    return (
      <p className="mt-9 font-display text-3xl uppercase" style={{ color: MENTA }}>
        Já está no ar
      </p>
    );
  }

  const casas: [string, number | null][] = [
    ["dias", falta?.dias ?? null],
    ["horas", falta?.horas ?? null],
    ["min", falta?.minutos ?? null],
    ["seg", falta?.segundos ?? null],
  ];

  return (
    <div className="mt-9 flex items-start justify-center gap-2.5 sm:gap-4">
      {casas.map(([rotulo, valor], i) => (
        <div key={rotulo} className="flex items-start gap-2.5 sm:gap-4">
          <div className="min-w-[3.6rem] rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 backdrop-blur-sm sm:min-w-[4.6rem] sm:px-4">
            <p className="font-display text-3xl leading-none tabular-nums text-white sm:text-5xl">
              {valor === null ? "––" : String(valor).padStart(2, "0")}
            </p>
            <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/35">
              {rotulo}
            </p>
          </div>
          {i < casas.length - 1 && (
            <span className="mt-1 font-display text-2xl text-white/15 sm:mt-2 sm:text-4xl">:</span>
          )}
        </div>
      ))}
    </div>
  );
}

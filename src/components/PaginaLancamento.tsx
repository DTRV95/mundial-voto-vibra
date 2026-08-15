import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ArrowDown, Bell, Check, Crown, Swords, Target, Trophy, Users } from "lucide-react";

/**
 * A homepage de geracao2026.com enquanto a época nova não arranca.
 *
 * O Mundial acabou. Quem chega ao site precisa de saber uma coisa e uma
 * só: quando é que isto volta. A página diz a data, conta o tempo que
 * falta, e depois — à medida que se faz scroll — mostra o que vem aí.
 *
 * É deliberadamente autónoma: não importa nada da aplicação a não ser o
 * router e os ícones, e traz o seu próprio CSS. Assim pode viver neste
 * ramo antigo sem arrastar meio site atrás dela, e sai daqui num só
 * commit no dia do lançamento.
 *
 * A época nova, essa, vive toda no ramo `epoca-2027`.
 */

/** 1 de outubro de 2026, meia-noite em Lisboa (a essa data ainda é UTC+1). */
const LANCAMENTO = new Date("2026-09-30T23:00:00Z");

const VERMELHO = "#E10014";
const MENTA = "#19FF91";
const CIANO = "#00FAFF";
const DOURADO = "#FFB020";
const FUNDO = "#080B12";

export function PaginaLancamento() {
  return (
    <div className="lp-raiz">
      <EstilosLocais />

      {/* Fundo: dois halos de cor e um véu escuro por cima — sem o véu,
          o texto branco perde-se por cima do vermelho. */}
      <div className="lp-fundo" aria-hidden>
        <span className="lp-halo lp-halo-a" />
        <span className="lp-halo lp-halo-b" />
        <span className="lp-veu" />
      </div>

      <div className="lp-conteudo">
        <Hero />

        <Feature
          etiqueta="Todas as semanas"
          titulo={<>Cinco jogos.<br />Os mesmos para toda a gente.</>}
          texto="Em cada jornada há cinco jogos oficiais escolhidos a dedo. Dás a tua previsão antes do apito e ganhas pontos pelo que acertares — o resultado, os golos, ambas marcam e o placar certo."
          pontos={[
            "Liga Portugal e Champions, a época inteira",
            "A votação fecha cinco minutos antes do apito",
            "Dez pontos para quem acertar o resultado exato",
          ]}
          cor={VERMELHO}
        >
          <EcraJornada />
        </Feature>

        <Feature
          etiqueta="Entre amigos"
          titulo={<>Um torneio só do teu grupo.</>}
          texto="Cria um torneio, manda o código pelo WhatsApp e joga contra quem já conheces. As regras são tuas: que competições contam, a partir de quando, e quem pode entrar."
          pontos={[
            "Código de convite e classificação própria",
            "Conversa dentro do torneio",
            "Regras definidas por quem o cria",
          ]}
          cor={DOURADO}
          inverter
        >
          <EcraTorneio />
        </Feature>

        <Feature
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
          <EcraDuelo />
        </Feature>

        <Feature
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
          <EcraDivisoes />
        </Feature>

        <Dna />
        <Fecho />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Hero e contador
   ══════════════════════════════════════════════════════════ */

function Hero() {
  return (
    <section className="lp-hero">
      <Revelar>
        <span className="lp-selo">
          <span className="lp-ponto" />
          Época 2026/27
        </span>
      </Revelar>

      <Revelar atraso={90}>
        <h1 className="lp-titulo">
          A nova geração
          <br />
          <span className="lp-titulo-vivo">chega a 1 de outubro</span>
        </h1>
      </Revelar>

      <Revelar atraso={180}>
        <p className="lp-sub">
          O Mundial acabou e ficou guardado. O que vem a seguir é maior:
          Liga Portugal e Champions, todas as jornadas, todo o ano.
        </p>
      </Revelar>

      <Revelar atraso={260}>
        <Contador />
      </Revelar>

      <Revelar atraso={340}>
        <div className="lp-accoes">
          <Link to="/auth" className="lp-botao">
            <Bell size={16} />
            Criar conta e ser avisado
          </Link>
          <span className="lp-nota">Grátis. Sem apostas, sem dinheiro.</span>
        </div>
      </Revelar>

      <Revelar atraso={440}>
        <span className="lp-scroll">
          O que vem aí
          <ArrowDown size={16} className="lp-seta" />
        </span>
      </Revelar>
    </section>
  );
}

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

function Contador() {
  // O relógio só arranca no cliente: no servidor daria uma contagem
  // diferente da que o visitante vê um instante depois.
  const [falta, setFalta] = useState<Falta | null>(null);

  useEffect(() => {
    setFalta(calcular(Date.now()));
    const t = setInterval(() => setFalta(calcular(Date.now())), 1000);
    return () => clearInterval(t);
  }, []);

  if (falta?.chegou) return <p className="lp-jaesta">Já está no ar</p>;

  const casas: [string, number | null][] = [
    ["dias", falta?.dias ?? null],
    ["horas", falta?.horas ?? null],
    ["min", falta?.minutos ?? null],
    ["seg", falta?.segundos ?? null],
  ];

  return (
    <div className="lp-contador">
      {casas.map(([rotulo, valor], i) => (
        <div key={rotulo} className="lp-contador-par">
          <div className="lp-casa">
            <p className="lp-casa-num">{valor === null ? "––" : String(valor).padStart(2, "0")}</p>
            <p className="lp-casa-rot">{rotulo}</p>
          </div>
          {i < casas.length - 1 && <span className="lp-dois-pontos">:</span>}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Secções com telemóvel
   ══════════════════════════════════════════════════════════ */

function Feature({ etiqueta, titulo, texto, pontos, cor, inverter, children }: {
  etiqueta: string;
  titulo: ReactNode;
  texto: string;
  pontos: string[];
  cor: string;
  inverter?: boolean;
  children: ReactNode;
}) {
  return (
    <Revelar>
      <section className="lp-feature">
        <div className={`lp-feature-interior ${inverter ? "lp-inverter" : ""}`}>
          <div className="lp-feature-texto">
            <span className="lp-etiqueta"
              style={{ background: `${cor}1F`, color: cor, borderColor: `${cor}44` }}>
              {etiqueta}
            </span>
            <h2 className="lp-feature-titulo">{titulo}</h2>
            <p className="lp-feature-corpo">{texto}</p>
            <ul className="lp-lista">
              {pontos.map(p => (
                <li key={p}>
                  <span className="lp-visto" style={{ background: `${cor}25`, color: cor }}>
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lp-feature-telemovel">
            <Telemovel cor={cor}>{children}</Telemovel>
          </div>
        </div>
      </section>
    </Revelar>
  );
}

/** Moldura de telemóvel desenhada em CSS — não é uma imagem. */
function Telemovel({ children, cor }: { children: ReactNode; cor: string }) {
  return (
    <div className="lp-tlm-caixa">
      <span className="lp-tlm-halo" style={{ background: cor }} aria-hidden />
      <div className="lp-tlm">
        <span className="lp-tlm-ilha" aria-hidden />
        <div className="lp-tlm-estado">
          <span>9:41</span>
          <span>▮▮▮ 86</span>
        </div>
        <div className="lp-tlm-ecra">{children}</div>
      </div>
      <span className="lp-tlm-reflexo" aria-hidden />
    </div>
  );
}

function EcraTopo({ titulo, cor }: { titulo: string; cor: string }) {
  return (
    <div className="lp-ecra-topo">
      <span>{titulo}</span>
      <span className="lp-ecra-traco" style={{ background: cor }} />
    </div>
  );
}

/* ── Os ecrãs ─────────────────────────────────────────────── */

/** As cores dos clubes são um facto público, e é o que dá vida às maquetas. */
const JOGOS = [
  { casa: "Benfica", fora: "FC Porto", cc: "#C8102E", cf: "#00428C", hora: "18:00", feito: true },
  { casa: "SC Braga", fora: "Sporting", cc: "#B4141E", cf: "#0A7D3E", hora: "20:30", feito: true },
  { casa: "Vitória SC", fora: "Casa Pia", cc: "#111111", cf: "#C8102E", hora: "15:30", feito: false },
  { casa: "Arouca", fora: "Estoril", cc: "#F5C518", cf: "#F5D000", hora: "18:00", feito: false },
];

function EcraJornada() {
  return (
    <>
      <EcraTopo titulo="A tua jornada" cor={VERMELHO} />
      <div className="lp-talao" style={{ background: `linear-gradient(140deg, ${VERMELHO}, ${VERMELHO}55)` }}>
        <div className="lp-talao-linha">
          <span className="lp-talao-rot">Liga Portugal</span>
          <span className="lp-talao-cont">2/5</span>
        </div>
        <p className="lp-talao-num">Jornada 8</p>
        <div className="lp-talao-barras">
          {[1, 1, 0, 0, 0].map((v, i) => (
            <span key={i} style={{ background: v ? "#fff" : "rgba(255,255,255,0.28)" }} />
          ))}
        </div>
      </div>

      {JOGOS.map(j => (
        <div key={j.casa} className="lp-jogo">
          <span className="lp-jogo-cores">
            <span style={{ background: j.cc }} />
            <span style={{ background: j.cf }} />
          </span>
          <span className="lp-jogo-nomes">
            {j.casa} <em>—</em> {j.fora}
          </span>
          <span className={`lp-jogo-estado ${j.feito ? "lp-feito" : ""}`}>
            {j.feito ? <Check size={11} strokeWidth={3} /> : j.hora}
          </span>
        </div>
      ))}
    </>
  );
}

function EcraTorneio() {
  const membros = [
    { nome: "Tiago M.", pts: 148 },
    { nome: "Rita S.", pts: 141 },
    { nome: "Tu", pts: 137, eu: true },
    { nome: "André P.", pts: 129 },
    { nome: "Marta L.", pts: 118 },
  ];
  return (
    <>
      <EcraTopo titulo="Os Sempre Errados" cor={DOURADO} />
      <div className="lp-torneio-topo">
        <span className="lp-torneio-icone" style={{ background: `${DOURADO}22`, color: DOURADO }}>
          <Users size={14} />
        </span>
        <div>
          <p className="lp-torneio-nome">12 membros</p>
          <p className="lp-torneio-cod">código: SEMPRE26</p>
        </div>
      </div>
      {membros.map((m, i) => (
        <div key={m.nome} className={`lp-linha ${m.eu ? "lp-linha-eu" : ""}`}>
          <span className="lp-pos" style={i === 0 ? { background: DOURADO, color: "#111" } : undefined}>
            {i === 0 ? <Crown size={11} /> : i + 1}
          </span>
          <span className="lp-nome">{m.nome}</span>
          <span className="lp-pts">{m.pts}</span>
        </div>
      ))}
    </>
  );
}

function EcraDuelo() {
  return (
    <>
      <EcraTopo titulo="Duelo" cor={MENTA} />
      <div className="lp-duelo">
        <div className="lp-duelo-lado">
          <span className="lp-duelo-av" style={{ background: `${MENTA}30`, color: MENTA }}>T</span>
          <p className="lp-duelo-nome">Tu</p>
          <p className="lp-duelo-pts" style={{ color: MENTA }}>24</p>
        </div>
        <div className="lp-duelo-meio">
          <Swords size={18} />
          <span>Jornada 8</span>
        </div>
        <div className="lp-duelo-lado">
          <span className="lp-duelo-av">R</span>
          <p className="lp-duelo-nome">Rita S.</p>
          <p className="lp-duelo-pts">19</p>
        </div>
      </div>
      <div className="lp-duelo-hist">
        <p className="lp-duelo-hist-rot">Histórico</p>
        <p className="lp-duelo-hist-num"><b style={{ color: MENTA }}>4</b> — <b>2</b></p>
      </div>
      <div className="lp-rival">
        <Target size={13} style={{ color: MENTA }} />
        <span>Rival do mês: <b>Rita S.</b></span>
      </div>
    </>
  );
}

function EcraDivisoes() {
  const divisoes = [
    { nome: "1ª Liga", faixa: "1º ao 10º", cor: CIANO, eu: false },
    { nome: "2ª Liga", faixa: "11º ao 25º", cor: DOURADO, eu: true },
    { nome: "Distrital", faixa: "26º ao 50º", cor: "#94A3B8", eu: false },
    { nome: "Liga do Zé Povinho", faixa: "51º em diante", cor: "#4ADE80", eu: false },
  ];
  return (
    <>
      <EcraTopo titulo="Divisões" cor={CIANO} />
      {divisoes.map(d => (
        <div key={d.nome} className={`lp-div ${d.eu ? "lp-div-eu" : ""}`}
          style={d.eu ? { borderColor: `${d.cor}66`, background: `${d.cor}14` } : undefined}>
          <span className="lp-div-barra" style={{ background: d.cor }} />
          <div className="lp-div-texto">
            <p className="lp-div-nome" style={{ color: d.cor }}>{d.nome}</p>
            <p className="lp-div-faixa">{d.faixa}</p>
          </div>
          {d.eu && <span className="lp-div-tu" style={{ color: d.cor }}>#14º · tu</span>}
        </div>
      ))}
      <div className="lp-tendencia">
        <Trophy size={12} style={{ color: DOURADO }} />
        <span>Subiste <b style={{ color: MENTA }}>3 lugares</b> desde ontem</span>
      </div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════
   DNA e fecho
   ══════════════════════════════════════════════════════════ */

function Dna() {
  return (
    <Revelar>
      <section className="lp-dna-seccao">
        <div className="lp-dna">
          <span className="lp-etiqueta"
            style={{ background: `${CIANO}18`, color: CIANO, borderColor: `${CIANO}44` }}>
            Novo
          </span>
          <h2 className="lp-dna-titulo">O teu DNA</h2>
          <p className="lp-dna-corpo">
            Quanto mais jogas, mais a plataforma te conhece. Descobre qual é a equipa
            que te dá sorte e qual é a que te tira o sono, se és de ir com o favorito
            ou contra a bancada, e o que muda no teu jogo de mês para mês.
          </p>
          <p className="lp-dna-nota">
            Não é um questionário. É construído a partir das tuas previsões — e há
            sempre uma descoberta nova à tua espera.
          </p>
        </div>
      </section>
    </Revelar>
  );
}

function Fecho() {
  return (
    <Revelar>
      <section className="lp-fecho">
        <h2 className="lp-fecho-titulo">1 de outubro</h2>
        <p className="lp-fecho-corpo">
          Cria a conta agora e entras com tudo pronto no primeiro dia. Quem já tinha
          conta do Mundial mantém-na — e o que fez lá fica guardado para sempre.
        </p>
        <Link to="/auth" className="lp-botao lp-botao-grande">Criar conta grátis</Link>
        <p className="lp-rodape">
          Uma Geração · geracao2026.com · sem apostas, sem dinheiro, só futebol
        </p>
      </section>
    </Revelar>
  );
}

/* ══════════════════════════════════════════════════════════
   Revelar ao scroll
   ══════════════════════════════════════════════════════════ */

function Revelar({ children, atraso = 0 }: { children: ReactNode; atraso?: number }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    const no = ref.current;
    if (!no) return;

    const menosMovimento = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (menosMovimento || typeof IntersectionObserver === "undefined") {
      setVisivel(true);
      return;
    }

    const obs = new IntersectionObserver(
      entradas => {
        for (const e of entradas) {
          // Numa direção só: uma vez revelado, fica revelado. Blocos a
          // desaparecerem no scroll para cima são irritantes.
          if (e.isIntersecting) { setVisivel(true); obs.disconnect(); }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    obs.observe(no);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`lp-revelar ${visivel ? "lp-visivel" : ""}`}
      style={{ transitionDelay: visivel ? `${atraso}ms` : "0ms" }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CSS — local à página, para não depender do resto do site
   ══════════════════════════════════════════════════════════ */

function EstilosLocais() {
  return (
    <style>{`
.lp-raiz {
  position: relative; isolation: isolate; overflow: hidden;
  min-height: 100vh; background: ${FUNDO}; color: #fff;
  font-family: "Inter", system-ui, -apple-system, sans-serif;
}
.lp-fundo { position: absolute; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.lp-halo { position: absolute; border-radius: 999px; display: block; }
.lp-halo-a {
  left: -25%; top: -18%; height: 70vh; width: 80vw;
  background: radial-gradient(circle, ${VERMELHO} 0%, transparent 68%);
  filter: blur(115px); opacity: .34; animation: lp-deriva 20s ease-in-out infinite;
}
.lp-halo-b {
  right: -22%; top: 12%; height: 60vh; width: 70vw;
  background: radial-gradient(circle, ${CIANO} 0%, transparent 68%);
  filter: blur(135px); opacity: .13; animation: lp-deriva 28s ease-in-out infinite reverse;
}
.lp-veu {
  position: absolute; inset: 0; display: block;
  background: linear-gradient(180deg, rgba(8,11,18,.55) 0%, rgba(8,11,18,.82) 55%, ${FUNDO} 100%);
}
@keyframes lp-deriva {
  0%, 100% { transform: translate3d(0,0,0) scale(1); }
  50%      { transform: translate3d(3%, 4%, 0) scale(1.08); }
}
.lp-conteudo { position: relative; z-index: 1; }

.lp-revelar { opacity: 0; transform: translateY(24px); transition: opacity .7s ease, transform .7s cubic-bezier(.16,1,.3,1); }
.lp-visivel { opacity: 1; transform: none; }

.lp-hero {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 100svh; padding: 64px 20px; text-align: center;
}
.lp-selo {
  display: inline-flex; align-items: center; gap: 8px;
  border: 1px solid ${MENTA}55; background: ${MENTA}14; color: ${MENTA};
  border-radius: 999px; padding: 6px 14px;
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .24em;
}
.lp-ponto { width: 6px; height: 6px; border-radius: 999px; background: ${MENTA}; animation: lp-pulsar 1.6s ease-in-out infinite; }
@keyframes lp-pulsar { 0%,100% { opacity: 1; } 50% { opacity: .3; } }

.lp-titulo {
  margin: 24px 0 0;
  font-family: "Bebas Neue", "Oswald", Impact, sans-serif; font-weight: 400;
  font-size: clamp(2.9rem, 13vw, 7rem); line-height: .88;
  text-transform: uppercase; text-wrap: balance;
}
.lp-titulo-vivo {
  background: linear-gradient(92deg, ${VERMELHO}, ${DOURADO} 45%, ${MENTA});
  background-size: 220% 100%;
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
  animation: lp-gradiente 9s ease-in-out infinite;
}
@keyframes lp-gradiente { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }

.lp-sub { margin: 20px auto 0; max-width: 34rem; font-size: 1rem; line-height: 1.65; color: rgba(255,255,255,.65); }
@media (min-width: 768px) { .lp-sub { font-size: 1.075rem; } }

.lp-contador { display: flex; align-items: flex-start; justify-content: center; gap: 10px; margin-top: 36px; }
.lp-contador-par { display: flex; align-items: flex-start; gap: 10px; }
.lp-casa {
  min-width: 3.6rem; padding: 10px 12px; border-radius: 18px;
  border: 1px solid rgba(255,255,255,.10); background: rgba(255,255,255,.04);
}
.lp-casa-num {
  margin: 0; font-family: "Bebas Neue", "Oswald", Impact, sans-serif; font-weight: 400;
  font-size: 1.9rem; line-height: 1; font-variant-numeric: tabular-nums;
}
.lp-casa-rot { margin: 6px 0 0; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .18em; color: rgba(255,255,255,.35); }
.lp-dois-pontos { margin-top: 4px; font-family: "Bebas Neue", Impact, sans-serif; font-size: 1.5rem; color: rgba(255,255,255,.15); }
@media (min-width: 640px) {
  .lp-contador, .lp-contador-par { gap: 16px; }
  .lp-casa { min-width: 4.6rem; padding: 12px 16px; }
  .lp-casa-num { font-size: 3rem; }
  .lp-dois-pontos { margin-top: 8px; font-size: 2.25rem; }
}
.lp-jaesta { margin-top: 36px; font-family: "Bebas Neue", Impact, sans-serif; font-size: 2rem; text-transform: uppercase; color: ${MENTA}; }

.lp-accoes { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 36px; }
@media (min-width: 640px) { .lp-accoes { flex-direction: row; } }
.lp-botao {
  display: inline-flex; align-items: center; gap: 8px;
  border-radius: 16px; padding: 14px 24px;
  font-size: .875rem; font-weight: 700; color: #fff; text-decoration: none;
  background: ${VERMELHO}; box-shadow: 0 12px 34px -10px ${VERMELHO};
  transition: transform .25s cubic-bezier(.16,1,.3,1);
}
.lp-botao:hover { transform: scale(1.03); }
.lp-botao:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
.lp-botao-grande { margin-top: 28px; padding: 16px 28px; }
.lp-nota { font-size: .75rem; color: rgba(255,255,255,.4); }

.lp-scroll {
  display: flex; flex-direction: column; align-items: center; gap: 8px; margin-top: 56px;
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .24em; color: rgba(255,255,255,.3);
}
.lp-seta { animation: lp-saltar 1.8s ease-in-out infinite; }
@keyframes lp-saltar { 0%,100% { transform: translateY(0); } 50% { transform: translateY(5px); } }

.lp-feature { padding: 48px 20px; }
@media (min-width: 768px) { .lp-feature { padding: 64px 32px; } }
.lp-feature-interior {
  display: flex; flex-direction: column; align-items: center; gap: 40px;
  max-width: 64rem; margin: 0 auto;
}
@media (min-width: 768px) {
  .lp-feature-interior { flex-direction: row; gap: 56px; }
  .lp-feature-interior.lp-inverter { flex-direction: row-reverse; }
}
.lp-feature-texto { width: 100%; }
@media (min-width: 768px) { .lp-feature-texto { flex: 1; } }
.lp-feature-telemovel { width: 100%; }
@media (min-width: 768px) { .lp-feature-telemovel { width: auto; flex-shrink: 0; } }

.lp-etiqueta {
  display: inline-block; border: 1px solid; border-radius: 999px; padding: 5px 12px;
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .18em;
}
.lp-feature-titulo {
  margin: 14px 0 0; font-family: "Bebas Neue", "Oswald", Impact, sans-serif; font-weight: 400;
  font-size: 1.95rem; line-height: 1.05; text-transform: uppercase; text-wrap: balance;
}
@media (min-width: 768px) { .lp-feature-titulo { font-size: 2.5rem; } }
.lp-feature-corpo { margin: 12px 0 0; font-size: .95rem; line-height: 1.7; color: rgba(255,255,255,.65); }
.lp-lista { margin: 20px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; }
.lp-lista li { display: flex; align-items: flex-start; gap: 10px; font-size: .875rem; color: rgba(255,255,255,.75); }
.lp-visto { display: grid; place-items: center; flex-shrink: 0; width: 20px; height: 20px; border-radius: 999px; margin-top: 1px; }

.lp-tlm-caixa { position: relative; width: 100%; max-width: 300px; margin: 0 auto; }
.lp-tlm-halo { position: absolute; inset: -32px; z-index: -1; border-radius: 999px; filter: blur(70px); opacity: .28; display: block; }
.lp-tlm {
  position: relative; overflow: hidden; border-radius: 2.4rem;
  border: 7px solid #15181f; background: #0b0e14;
  box-shadow: 0 30px 70px -20px rgba(0,0,0,.85), 0 0 0 1px rgba(255,255,255,.07);
}
.lp-tlm-ilha { position: absolute; left: 50%; top: 8px; z-index: 2; height: 20px; width: 78px; transform: translateX(-50%); border-radius: 999px; background: #15181f; }
.lp-tlm-estado { display: flex; justify-content: space-between; padding: 10px 20px 4px; font-size: 9px; font-weight: 700; color: rgba(255,255,255,.45); }
.lp-tlm-ecra { min-height: 420px; padding: 4px 12px 20px; }
.lp-tlm-reflexo {
  position: absolute; inset: 0; border-radius: 2.4rem; pointer-events: none; display: block;
  background: linear-gradient(140deg, rgba(255,255,255,.10) 0%, transparent 42%);
}

.lp-ecra-topo { display: flex; align-items: center; justify-content: space-between; padding: 0 4px; margin-bottom: 10px; }
.lp-ecra-topo > span:first-child { font-family: "Bebas Neue", Impact, sans-serif; font-size: 15px; letter-spacing: .02em; }
.lp-ecra-traco { height: 3px; width: 32px; border-radius: 999px; }

.lp-talao { border-radius: 16px; padding: 12px; margin-bottom: 10px; }
.lp-talao-linha { display: flex; justify-content: space-between; align-items: center; }
.lp-talao-rot { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .18em; color: rgba(255,255,255,.6); }
.lp-talao-cont { font-family: "Bebas Neue", Impact, sans-serif; font-size: 18px; font-variant-numeric: tabular-nums; }
.lp-talao-num { margin: 2px 0 8px; font-family: "Bebas Neue", Impact, sans-serif; font-size: 24px; line-height: 1; text-transform: uppercase; }
.lp-talao-barras { display: flex; gap: 4px; }
.lp-talao-barras span { flex: 1; height: 4px; border-radius: 999px; }

.lp-jogo { display: flex; align-items: center; gap: 8px; padding: 9px 8px; border-radius: 12px; background: rgba(255,255,255,.04); margin-bottom: 6px; }
.lp-jogo-cores { display: flex; flex-shrink: 0; }
.lp-jogo-cores span { width: 14px; height: 14px; border-radius: 999px; border: 1.5px solid #0b0e14; }
.lp-jogo-cores span:last-child { margin-left: -5px; }
.lp-jogo-nomes { flex: 1; min-width: 0; font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lp-jogo-nomes em { font-style: normal; color: rgba(255,255,255,.3); }
.lp-jogo-estado { flex-shrink: 0; font-size: 10px; font-weight: 700; color: rgba(255,255,255,.45); font-variant-numeric: tabular-nums; }
.lp-jogo-estado.lp-feito { display: grid; place-items: center; width: 18px; height: 18px; border-radius: 999px; background: ${MENTA}22; color: ${MENTA}; }

.lp-torneio-topo { display: flex; align-items: center; gap: 9px; padding: 10px; border-radius: 14px; background: rgba(255,255,255,.05); margin-bottom: 10px; }
.lp-torneio-icone { display: grid; place-items: center; width: 30px; height: 30px; border-radius: 10px; }
.lp-torneio-nome { margin: 0; font-size: 12px; font-weight: 700; }
.lp-torneio-cod { margin: 2px 0 0; font-size: 10px; color: rgba(255,255,255,.4); }
.lp-linha { display: flex; align-items: center; gap: 9px; padding: 8px; border-radius: 10px; margin-bottom: 4px; }
.lp-linha-eu { background: rgba(255,255,255,.09); }
.lp-pos { display: grid; place-items: center; width: 20px; height: 20px; flex-shrink: 0; border-radius: 999px; background: rgba(255,255,255,.1); font-size: 10px; font-weight: 700; }
.lp-nome { flex: 1; min-width: 0; font-size: 11.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lp-pts { font-family: "Bebas Neue", Impact, sans-serif; font-size: 16px; font-variant-numeric: tabular-nums; }

.lp-duelo { display: flex; align-items: center; gap: 6px; padding: 14px 8px; border-radius: 16px; background: rgba(255,255,255,.05); margin-bottom: 10px; }
.lp-duelo-lado { flex: 1; text-align: center; min-width: 0; }
.lp-duelo-av { display: grid; place-items: center; width: 34px; height: 34px; margin: 0 auto; border-radius: 999px; background: rgba(255,255,255,.12); font-weight: 700; font-size: 13px; }
.lp-duelo-nome { margin: 6px 0 0; font-size: 11px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lp-duelo-pts { margin: 3px 0 0; font-family: "Bebas Neue", Impact, sans-serif; font-size: 26px; line-height: 1; font-variant-numeric: tabular-nums; }
.lp-duelo-meio { flex-shrink: 0; display: flex; flex-direction: column; align-items: center; gap: 3px; color: rgba(255,255,255,.35); font-size: 9px; text-transform: uppercase; letter-spacing: .12em; }
.lp-duelo-hist { display: flex; align-items: center; justify-content: space-between; padding: 9px 12px; border-radius: 12px; background: rgba(255,255,255,.04); margin-bottom: 6px; }
.lp-duelo-hist-rot { margin: 0; font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: .18em; color: rgba(255,255,255,.4); }
.lp-duelo-hist-num { margin: 0; font-family: "Bebas Neue", Impact, sans-serif; font-size: 18px; }
.lp-rival { display: flex; align-items: center; gap: 7px; padding: 9px 12px; border-radius: 12px; background: rgba(255,255,255,.04); font-size: 11px; color: rgba(255,255,255,.7); }

.lp-div { position: relative; display: flex; align-items: center; gap: 10px; padding: 11px 10px 11px 14px; border: 1px solid rgba(255,255,255,.07); border-radius: 12px; margin-bottom: 6px; overflow: hidden; }
.lp-div-barra { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
.lp-div-texto { flex: 1; min-width: 0; }
.lp-div-nome { margin: 0; font-family: "Bebas Neue", Impact, sans-serif; font-size: 15px; text-transform: uppercase; }
.lp-div-faixa { margin: 1px 0 0; font-size: 10px; color: rgba(255,255,255,.35); }
.lp-div-tu { flex-shrink: 0; font-size: 10px; font-weight: 700; }
.lp-tendencia { display: flex; align-items: center; gap: 7px; padding: 9px 12px; border-radius: 12px; background: rgba(255,255,255,.04); font-size: 11px; color: rgba(255,255,255,.7); margin-top: 4px; }

.lp-dna-seccao { padding: 64px 20px; }
@media (min-width: 768px) { .lp-dna-seccao { padding: 96px 32px; } }
.lp-dna {
  max-width: 48rem; margin: 0 auto; padding: 32px; text-align: center;
  border: 1px solid ${CIANO}33; border-radius: 26px;
  background: linear-gradient(160deg, rgba(0,250,255,.07), transparent 70%);
}
@media (min-width: 768px) { .lp-dna { padding: 48px; } }
.lp-dna-titulo { margin: 16px 0 0; font-family: "Bebas Neue", "Oswald", Impact, sans-serif; font-weight: 400; font-size: 2.5rem; line-height: 1; text-transform: uppercase; }
@media (min-width: 768px) { .lp-dna-titulo { font-size: 3.75rem; } }
.lp-dna-corpo { margin: 16px auto 0; max-width: 34rem; font-size: .95rem; line-height: 1.7; color: rgba(255,255,255,.65); }
.lp-dna-nota { margin: 16px auto 0; max-width: 34rem; font-size: .82rem; color: rgba(255,255,255,.4); }

.lp-fecho { padding: 16px 20px 96px; text-align: center; }
.lp-fecho-titulo { margin: 0; font-family: "Bebas Neue", "Oswald", Impact, sans-serif; font-weight: 400; font-size: 2rem; line-height: 1; text-transform: uppercase; }
@media (min-width: 768px) { .lp-fecho-titulo { font-size: 3rem; } }
.lp-fecho-corpo { margin: 12px auto 0; max-width: 28rem; font-size: .875rem; line-height: 1.65; color: rgba(255,255,255,.55); }
.lp-rodape { margin: 40px 0 0; font-size: 11px; color: rgba(255,255,255,.25); }

@media (prefers-reduced-motion: reduce) {
  .lp-raiz *, .lp-raiz *::before, .lp-raiz *::after { animation: none !important; transition: none !important; }
  .lp-revelar { opacity: 1; transform: none; }
}
`}</style>
  );
}

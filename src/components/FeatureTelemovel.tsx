import { Link } from "@tanstack/react-router";
import { Check, Swords, Crown, Trophy, Target } from "lucide-react";
import { Telemovel, EcraTopo } from "@/components/Telemovel";
import { TeamBadge } from "@/lib/teamColors.tsx";
import { nomeCurto } from "@/lib/clubBadge";
import { formatTime } from "@/lib/format";
import type { Jornada } from "@/lib/useJornada";

/**
 * Secções que explicam uma funcionalidade com o telemóvel ao lado.
 * Alternam de lado a cada secção, para a página ter ritmo.
 */
export function SeccaoFeature({ etiqueta, titulo, texto, pontos, cor, inverter, children }: {
  etiqueta: string;
  titulo: React.ReactNode;
  texto: string;
  pontos: string[];
  cor: string;
  /** Telemóvel à esquerda em vez de à direita */
  inverter?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="px-5 py-12 md:px-8 md:py-16">
      <div className={`mx-auto flex max-w-5xl flex-col items-center gap-10 md:gap-14 ${
        inverter ? "md:flex-row-reverse" : "md:flex-row"
      }`}>
        {/* Texto */}
        <div className="w-full md:flex-1">
          <span className="inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ background: `${cor}22`, color: cor, border: `1px solid ${cor}44` }}>
            {etiqueta}
          </span>
          <h2 className="mt-3.5 font-display text-3xl leading-[1.05] text-white md:text-4xl">
            {titulo}
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-white/65">{texto}</p>

          <ul className="mt-5 space-y-2.5">
            {pontos.map(p => (
              <li key={p} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
                  style={{ background: `${cor}25`, color: cor }}>
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span className="text-sm text-white/75">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Telemóvel */}
        <div className="w-full md:w-auto md:shrink-0">
          <Telemovel cor={cor}>{children}</Telemovel>
        </div>
      </div>
    </section>
  );
}

// ── Ecrã: a jornada e as previsões ──────────────────────────
export function EcraJornada({ jornada, cor }: { jornada: Jornada | null; cor: string }) {
  const jogos = jornada?.jogos.slice(0, 4) ?? [];

  return (
    <>
      <EcraTopo titulo="A tua jornada" cor={cor} />

      {/* Progresso */}
      <div className="mb-2.5 rounded-2xl p-3" style={{ background: `linear-gradient(140deg, ${cor}, ${cor}44)` }}>
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">
          {jornada?.label ?? "Jornada 1"}
        </p>
        <p className="font-display text-base text-white">3 de 5 previsões</p>
        <div className="mt-2 flex gap-1">
          {[1, 1, 1, 0, 0].map((v, i) => (
            <span key={i} className="h-1 flex-1 rounded-full"
              style={{ background: v ? "#fff" : "rgba(255,255,255,0.25)" }} />
          ))}
        </div>
      </div>

      {/* Jogos reais */}
      <div className="space-y-1.5">
        {jogos.map(j => (
          <div key={j.id} className="flex min-w-0 items-center gap-2 rounded-xl border border-white/8 bg-white/[0.05] px-2.5 py-2">
            <TeamBadge code={j.home.code} flag={j.home.flag} name={j.home.name}
              monogram={(j.home as any).monogram} crest={(j.home as any).crest_url} size="sm" />
            <div className="min-w-0 flex-1 text-center">
              <p className="truncate text-[9px] font-bold text-white/85">
                {nomeCurto(j.home.name)} <span className="text-white/35">v</span> {nomeCurto(j.away.name)}
              </p>
              <p className="text-[8px] text-white/40">{formatTime(j.kickoff_at)}</p>
            </div>
            <TeamBadge code={j.away.code} flag={j.away.flag} name={j.away.name}
              monogram={(j.away as any).monogram} crest={(j.away as any).crest_url} size="sm" />
          </div>
        ))}
        {jogos.length === 0 && (
          <p className="py-8 text-center text-[10px] text-white/35">Os 5 jogos da jornada</p>
        )}
      </div>

      {/* Mercados */}
      <div className="mt-2.5 rounded-xl border border-white/8 bg-white/[0.04] p-2.5">
        <p className="mb-1.5 text-[8px] font-bold uppercase tracking-widest text-white/40">O que se prevê</p>
        <div className="flex flex-wrap gap-1">
          {["1X2 · 3–4 pts", "Ambas marcam · 2", "±2.5 golos · 2", "Exato · 10"].map(m => (
            <span key={m} className="rounded-md px-1.5 py-0.5 text-[8px] font-bold"
              style={{ background: `${cor}22`, color: cor }}>{m}</span>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Ecrã: torneios privados ─────────────────────────────────
export function EcraTorneios({ cor }: { cor: string }) {
  return (
    <>
      <EcraTopo titulo="O teu torneio" cor={cor} />

      <div className="mb-2.5 rounded-2xl border p-3" style={{ borderColor: `${cor}44`, background: `${cor}18` }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🍺</span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm text-white">Os do Café</p>
            <p className="text-[9px] text-white/50">8 membros · código HX4K2P</p>
          </div>
        </div>
      </div>

      <p className="mb-1.5 px-1 text-[8px] font-bold uppercase tracking-widest text-white/40">Regras da liga</p>
      <div className="mb-2.5 space-y-1">
        {[
          ["Competições", "Liga Portugal + Champions"],
          ["Jogos que contam", "Só os dos grandes"],
          ["Duelos 1v1", "Ativados"],
        ].map(([k, v]) => (
          <div key={k} className="flex items-center justify-between rounded-lg bg-white/[0.05] px-2.5 py-1.5">
            <span className="text-[9px] text-white/50">{k}</span>
            <span className="text-[9px] font-bold text-white/85">{v}</span>
          </div>
        ))}
      </div>

      <p className="mb-1.5 px-1 text-[8px] font-bold uppercase tracking-widest text-white/40">Classificação</p>
      <div className="space-y-1">
        {[
          ["1", "Ricardo", "184", true],
          ["2", "Tu", "179", false],
          ["3", "Marco", "171", false],
        ].map(([pos, nome, pts, lider]) => (
          <div key={pos as string}
            className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 ${nome === "Tu" ? "bg-white/[0.10]" : "bg-white/[0.04]"}`}>
            <span className="grid h-5 w-5 place-items-center rounded-full text-[9px] font-bold"
              style={lider ? { background: cor, color: "#fff" } : { background: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.6)" }}>
              {lider ? <Crown className="h-2.5 w-2.5" /> : pos}
            </span>
            <span className="flex-1 text-[10px] font-semibold text-white/85">{nome}</span>
            <span className="font-display text-xs" style={{ color: cor }}>{pts}</span>
          </div>
        ))}
      </div>
    </>
  );
}

// ── Ecrã: duelos ────────────────────────────────────────────
export function EcraDuelos({ cor }: { cor: string }) {
  return (
    <>
      <EcraTopo titulo="Duelos" cor={cor} />

      {/* Duelo ganho */}
      <div className="mb-2 rounded-2xl border border-wc-green/40 bg-wc-green/10 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[10px] font-bold text-white">MJ</span>
            <div>
              <p className="text-[10px] font-bold text-white">Marco J.</p>
              <p className="text-[8px] text-white/45">Jornada · ×3</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-lg leading-none text-wc-green">14 – 9</p>
            <p className="text-[8px] uppercase tracking-wider text-white/45">Vitória</p>
          </div>
        </div>
      </div>

      {/* Desafio pendente */}
      <div className="mb-2.5 rounded-2xl border border-white/10 bg-white/[0.05] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[10px] font-bold text-white">AS</span>
            <div>
              <p className="text-[10px] font-bold text-white">Ana S.</p>
              <p className="text-[8px] text-white/45">Mês inteiro · ×6</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-wc-green/25 text-wc-green">
              <Check className="h-3 w-3" strokeWidth={3} />
            </span>
            <span className="grid h-6 w-6 place-items-center rounded-full bg-wc-red/25 text-wc-red text-xs">✕</span>
          </div>
        </div>
      </div>

      {/* Rivalidade */}
      <p className="mb-1.5 px-1 text-[8px] font-bold uppercase tracking-widest text-white/40">Rivalidade</p>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-white/10 text-[10px] font-bold text-white">MJ</span>
            <span className="text-[10px] font-bold text-white">Marco J.</span>
          </div>
          <div className="text-right">
            <p className="font-display text-base leading-none">
              <span className="text-wc-green">5</span>
              <span className="text-white/35"> – 2 – </span>
              <span className="text-wc-red">1</span>
            </p>
            <p className="text-[8px] uppercase tracking-wider text-white/40">V · E · D</p>
          </div>
        </div>
      </div>

      <div className="mt-2.5 flex items-center justify-center gap-1.5 rounded-xl py-2"
        style={{ background: `linear-gradient(135deg, ${cor}, ${cor}66)` }}>
        <Swords className="h-3 w-3 text-white" />
        <span className="text-[10px] font-bold text-white">Desafiar alguém</span>
      </div>
    </>
  );
}

// ── Ecrã: divisões ──────────────────────────────────────────
export function EcraDivisoes({ cor }: { cor: string }) {
  const divisoes = [
    { emoji: "🏆", nome: "1ª Liga", faixa: "1º ao 10º", ativa: false },
    { emoji: "⚽", nome: "2ª Liga", faixa: "11º ao 25º", ativa: true },
    { emoji: "🟡", nome: "Distrital", faixa: "26º ao 50º", ativa: false },
    { emoji: "🟢", nome: "Liga do Zé Povinho", faixa: "51º em diante", ativa: false },
  ];

  return (
    <>
      <EcraTopo titulo="Rankings" cor={cor} />

      <div className="mb-2.5 rounded-2xl border border-gold/40 bg-gold/10 p-3">
        <p className="text-[8px] font-bold uppercase tracking-widest text-white/45">A tua divisão</p>
        <div className="mt-1 flex items-center gap-2.5">
          <span className="text-2xl">⚽</span>
          <div>
            <p className="font-display text-base leading-none text-gold">2ª Liga</p>
            <p className="mt-0.5 text-[9px] text-white/50">#14º · 179 pts · 22/38 acertos</p>
          </div>
          <span className="ml-auto rounded-full bg-wc-green/20 px-1.5 py-0.5 text-[8px] font-bold text-wc-green">↑ 3</span>
        </div>
      </div>

      <div className="space-y-1.5">
        {divisoes.map(d => (
          <div key={d.nome}
            className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 ${
              d.ativa ? "border border-gold/30 bg-gold/[0.08]" : "bg-white/[0.04]"
            }`}>
            <span className="text-base">{d.emoji}</span>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-[10px] font-bold ${d.ativa ? "text-gold" : "text-white/80"}`}>{d.nome}</p>
              <p className="text-[8px] text-white/40">{d.faixa}</p>
            </div>
            {d.ativa && <span className="text-[8px] font-bold text-gold">TU</span>}
          </div>
        ))}
      </div>

      <div className="mt-2.5 rounded-xl border border-white/8 bg-white/[0.04] p-2.5">
        <p className="mb-1.5 text-[8px] font-bold uppercase tracking-widest text-white/40">Medalhas</p>
        <div className="flex gap-1.5">
          {["🥇", "🥈", "⭐"].map((m, i) => (
            <span key={i} className="grid h-7 w-7 place-items-center rounded-lg border border-gold/25 bg-gold/10 text-sm">
              {m}
            </span>
          ))}
        </div>
      </div>
    </>
  );
}

// ── Ecrã: prognósticos ──────────────────────────────────────
export function EcraPrognosticos({ jornada, cor }: { jornada: Jornada | null; cor: string }) {
  const jogo = jornada?.jogos[0] ?? null;

  return (
    <>
      <EcraTopo titulo="Prognósticos" cor={cor} />

      <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[8px] font-bold uppercase tracking-widest text-white/40">
            {jornada?.label ?? "Jornada"}
          </span>
          <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[8px] font-bold"
            style={{ background: `${cor}22`, color: cor }}>
            <Target className="h-2 w-2" /> Análise
          </span>
        </div>

        {jogo ? (
          <div className="flex items-center justify-between gap-2 py-1">
            <div className="flex flex-1 flex-col items-center gap-1">
              <TeamBadge code={jogo.home.code} flag={jogo.home.flag} name={jogo.home.name}
                monogram={(jogo.home as any).monogram} crest={(jogo.home as any).crest_url} size="sm" />
              <span className="w-full truncate text-center text-[8px] font-bold text-white/80">{nomeCurto(jogo.home.name)}</span>
            </div>
            <span className="font-display text-sm text-white/60">{formatTime(jogo.kickoff_at)}</span>
            <div className="flex flex-1 flex-col items-center gap-1">
              <TeamBadge code={jogo.away.code} flag={jogo.away.flag} name={jogo.away.name}
                monogram={(jogo.away as any).monogram} crest={(jogo.away as any).crest_url} size="sm" />
              <span className="w-full truncate text-center text-[8px] font-bold text-white/80">{nomeCurto(jogo.away.name)}</span>
            </div>
          </div>
        ) : (
          <p className="py-4 text-center text-[10px] text-white/35">Jogo da jornada</p>
        )}
      </div>

      {/* Probabilidades */}
      <div className="mt-2 space-y-2 rounded-2xl border border-white/10 bg-white/[0.04] p-3">
        {[
          { rotulo: "Vitória em casa", valor: 68, cor: "#E10014" },
          { rotulo: "Ambas marcam", valor: 54, cor: "#19FF91" },
          { rotulo: "Mais de 2.5 golos", valor: 63, cor: "#00A3FF" },
        ].map(p => (
          <div key={p.rotulo}>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[9px] text-white/60">{p.rotulo}</span>
              <span className="font-display text-[11px]" style={{ color: p.cor }}>{p.valor}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{ width: `${p.valor}%`, background: p.cor }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 rounded-xl border p-2.5" style={{ borderColor: `${cor}33`, background: `${cor}12` }}>
        <p className="text-[8px] font-bold uppercase tracking-widest" style={{ color: cor }}>Sugestão</p>
        <p className="mt-0.5 text-[10px] font-semibold text-white/85">
          Casa vence e ambas marcam
        </p>
      </div>
    </>
  );
}

/** Botão de fecho reutilizado nas secções. */
export function BotaoInscrever({ cor, profundo, texto = "Criar conta grátis" }: {
  cor: string; profundo: string; texto?: string;
}) {
  return (
    <Link to="/auth"
      className="pressable group mt-6 inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-white"
      style={{
        background: `linear-gradient(135deg, ${cor} 0%, ${profundo} 100%)`,
        boxShadow: `0 10px 30px -10px ${cor}`,
      }}>
      <Trophy className="h-4 w-4" />
      {texto}
    </Link>
  );
}

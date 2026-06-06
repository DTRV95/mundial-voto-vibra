import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { StadiumBackground } from "../components/StadiumBackground";
import { TeamCard } from "../components/TeamCard";
import { VoteBar } from "../components/VoteBar";
import { GoldDivider } from "../components/GoldDivider";
import { FLAGS } from "../components/FlagPlaceholder";

export interface VozDoMundialReelProps {
  teamA: string;
  teamB: string;
  competition: string;
  question: string;
  voteCountA: number;
  voteCountB: number;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const fadeIn = (frame: number, start: number, duration = 18) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const slideUp = (frame: number, start: number, distance = 50, duration = 22) =>
  interpolate(frame, [start, start + duration], [distance, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const fadeOut = (frame: number, start: number, duration = 12) =>
  interpolate(frame, [start, start + duration], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// ── scene helpers ─────────────────────────────────────────────────────────────

/** Cena 1: 0–3 s (frames 0–89) */
const SceneIntro: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const opacity = fadeIn(frame, 8);
  const y = slideUp(frame, 8);
  const exit = frame > 72 ? fadeOut(frame, 72) : 1;

  const tagScale = spring({ frame: frame - 5, fps, config: { damping: 14, stiffness: 140 } });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 36,
        padding: "0 80px",
        opacity: exit,
      }}
    >
      {/* Badge da marca */}
      <div
        style={{
          transform: `scale(${tagScale})`,
          opacity: tagScale,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <div style={s.brandBadge}>VOZ DO MUNDIAL</div>
        <GoldDivider width="100%" opacity={0.6} />
      </div>

      {/* Headline */}
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          textAlign: "center",
        }}
      >
        <p style={s.introPre}>A tua opinião</p>
        <p style={s.introMain}>também entra</p>
        <p style={s.introMain}>em campo.</p>
      </div>

      <div style={{ opacity, transform: `translateY(${y + 10}px)` }}>
        <GoldDivider width="200px" />
      </div>
    </AbsoluteFill>
  );
};

/** Cena 2: 3–7 s (frames 90–209) */
const SceneMatch: React.FC<{
  frame: number;
  fps: number;
  teamA: string;
  teamB: string;
  competition: string;
  voteCountA: number;
  voteCountB: number;
}> = ({ frame, fps, teamA, teamB, competition, voteCountA, voteCountB }) => {
  const localFrame = frame - 90;
  const opacity = fadeIn(localFrame, 0);
  const exit = frame > 192 ? fadeOut(frame, 192) : 1;

  const scaleA = spring({
    frame: localFrame - 5,
    fps,
    config: { damping: 16, stiffness: 120, mass: 0.9 },
  });
  const scaleB = spring({
    frame: localFrame - 14,
    fps,
    config: { damping: 16, stiffness: 120, mass: 0.9 },
  });

  const vsOpacity = interpolate(localFrame, [18, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const flagA = FLAGS[teamA as keyof typeof FLAGS] ?? FLAGS.Portugal;
  const flagB = FLAGS[teamB as keyof typeof FLAGS] ?? FLAGS.Espanha;

  return (
    <AbsoluteFill
      style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
        padding: "0 60px",
        opacity: exit,
      }}
    >
      {/* Cabeçalho do jogo */}
      <div style={{ opacity, textAlign: "center", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={s.competitionBadge}>{competition}</div>
        <GoldDivider width="180px" opacity={0.5} />
      </div>

      {/* Cards das equipas */}
      <div style={{ display: "flex", flexDirection: "row", gap: 24, width: "100%", opacity }}>
        <div style={{ flex: 1, transform: `scale(${scaleA})`, opacity: scaleA }}>
          <TeamCard
            name={teamA}
            flagStripes={flagA.stripes as unknown as string[]}
            flagSymbol={flagA.symbol}
            flagSymbolColor={flagA.symbolColor}
            votes={voteCountA}
            accentColor="#006600"
            align="left"
          />
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: vsOpacity,
          }}
        >
          <div style={s.vsBlock}>
            <span style={s.vsText}>VS</span>
          </div>
        </div>

        <div style={{ flex: 1, transform: `scale(${scaleB})`, opacity: scaleB }}>
          <TeamCard
            name={teamB}
            flagStripes={flagB.stripes as unknown as string[]}
            flagSymbol={flagB.symbol}
            flagSymbolColor={flagB.symbolColor}
            votes={voteCountB}
            accentColor="#c60b1e"
            align="right"
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** Cena 3: 7–11 s (frames 210–329) */
const SceneVotes: React.FC<{
  frame: number;
  fps: number;
  teamA: string;
  teamB: string;
  question: string;
  voteCountA: number;
  voteCountB: number;
}> = ({ frame, fps, teamA, teamB, question, voteCountA, voteCountB }) => {
  const localFrame = frame - 210;
  const opacity = fadeIn(localFrame, 0);
  const exit = frame > 312 ? fadeOut(frame, 312) : 1;

  const total = voteCountA + voteCountB;
  const pctA = total > 0 ? voteCountA / total : 0.5;
  const pctB = 1 - pctA;

  const flagA = FLAGS[teamA as keyof typeof FLAGS] ?? FLAGS.Portugal;
  const flagB = FLAGS[teamB as keyof typeof FLAGS] ?? FLAGS.Espanha;

  return (
    <AbsoluteFill
      style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 52,
        padding: "0 72px",
        opacity: exit,
      }}
    >
      {/* Pergunta */}
      <div
        style={{
          opacity,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <p style={s.questionLabel}>A comunidade respondeu</p>
        <p style={s.questionMain}>{question}</p>
        <GoldDivider width="240px" />
      </div>

      {/* Barras */}
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 36,
          opacity,
        }}
      >
        <VoteBar
          label={teamA}
          percentage={pctA}
          color="#3a9e5f"
          flagStripes={flagA.stripes as unknown as string[]}
          flagSymbol={flagA.symbol}
          flagSymbolColor={flagA.symbolColor}
          frame={localFrame}
          startFrame={10}
          fps={fps}
        />
        <VoteBar
          label={teamB}
          percentage={pctB}
          color="#e84040"
          flagStripes={flagB.stripes as unknown as string[]}
          flagSymbol={flagB.symbol}
          flagSymbolColor={flagB.symbolColor}
          frame={localFrame}
          startFrame={18}
          fps={fps}
        />
      </div>

      {/* Total */}
      <div style={{ opacity }}>
        <p style={s.totalVotes}>
          {total.toLocaleString("pt-PT")} votos registados
        </p>
      </div>
    </AbsoluteFill>
  );
};

/** Cena 4: 11–15 s (frames 330–449) */
const SceneCTA: React.FC<{ frame: number; fps: number }> = ({ frame, fps }) => {
  const localFrame = frame - 330;
  const opacity = fadeIn(localFrame, 0, 22);

  const logoScale = spring({
    frame: localFrame - 4,
    fps,
    config: { damping: 12, stiffness: 120, mass: 0.8 },
  });

  const ctaY = slideUp(localFrame, 20, 60, 24);
  const ctaOpacity = fadeIn(localFrame, 20, 20);

  return (
    <AbsoluteFill
      style={{
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 44,
        padding: "0 80px",
        opacity,
      }}
    >
      {/* Logótipo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoScale,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 18,
        }}
      >
        <div style={s.ctaLogo}>VOZ DO MUNDIAL</div>
        <GoldDivider width="100%" />
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `translateY(${ctaY}px)`,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <p style={s.ctaTagline}>Vota, compara e vibra</p>
        <p style={s.ctaTagline}>com a comunidade.</p>
      </div>

      {/* URL */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `translateY(${ctaY + 8}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 14,
        }}
      >
        <GoldDivider width="160px" opacity={0.5} />
        <p style={s.ctaUrl}>vozdomundial.pt</p>
      </div>
    </AbsoluteFill>
  );
};

// ── composição principal ──────────────────────────────────────────────────────

export const VozDoMundialReel: React.FC<VozDoMundialReelProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { teamA, teamB, competition, question, voteCountA, voteCountB } = props;

  return (
    <AbsoluteFill>
      <StadiumBackground />

      {/* Cena 1 — 0 a 3 s */}
      {frame < 90 && <SceneIntro frame={frame} fps={fps} />}

      {/* Cena 2 — 3 a 7 s */}
      {frame >= 78 && frame < 210 && (
        <SceneMatch
          frame={frame}
          fps={fps}
          teamA={teamA}
          teamB={teamB}
          competition={competition}
          voteCountA={voteCountA}
          voteCountB={voteCountB}
        />
      )}

      {/* Cena 3 — 7 a 11 s */}
      {frame >= 198 && frame < 330 && (
        <SceneVotes
          frame={frame}
          fps={fps}
          teamA={teamA}
          teamB={teamB}
          question={question}
          voteCountA={voteCountA}
          voteCountB={voteCountB}
        />
      )}

      {/* Cena 4 — 11 a 15 s */}
      {frame >= 318 && (
        <SceneCTA frame={frame} fps={fps} />
      )}
    </AbsoluteFill>
  );
};

// ── estilos ───────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  brandBadge: {
    background: "linear-gradient(135deg, #b8972a 0%, #f0c040 50%, #b8972a 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: 6,
    textTransform: "uppercase",
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
  },
  introPre: {
    color: "#c8d8e8",
    fontSize: 52,
    fontWeight: 300,
    margin: 0,
    letterSpacing: 2,
    textAlign: "center",
  },
  introMain: {
    color: "#ffffff",
    fontSize: 76,
    fontWeight: 900,
    margin: 0,
    lineHeight: 1.08,
    textAlign: "center",
    textShadow: "0 4px 24px rgba(0,0,0,0.6)",
    letterSpacing: -0.5,
  },
  competitionBadge: {
    color: "#f0c040",
    fontSize: 26,
    fontWeight: 600,
    letterSpacing: 4,
    textTransform: "uppercase",
    textAlign: "center",
  },
  vsBlock: {
    width: 72,
    height: 72,
    borderRadius: "50%",
    background: "linear-gradient(135deg, #b8972a, #f0c040)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 0 30px rgba(240,192,64,0.4)",
  },
  vsText: {
    color: "#0a0a1a",
    fontSize: 26,
    fontWeight: 900,
    letterSpacing: 1,
  },
  questionLabel: {
    color: "#8899aa",
    fontSize: 28,
    fontWeight: 400,
    margin: 0,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  questionMain: {
    color: "#ffffff",
    fontSize: 56,
    fontWeight: 800,
    margin: 0,
    lineHeight: 1.15,
    textShadow: "0 4px 20px rgba(0,0,0,0.5)",
  },
  totalVotes: {
    color: "#5a6a7a",
    fontSize: 28,
    margin: 0,
    letterSpacing: 1,
    textAlign: "center",
  },
  ctaLogo: {
    background: "linear-gradient(135deg, #b8972a 0%, #f0c040 50%, #b8972a 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    fontSize: 52,
    fontWeight: 900,
    letterSpacing: 6,
    textTransform: "uppercase",
  },
  ctaTagline: {
    color: "#e0eaf4",
    fontSize: 56,
    fontWeight: 700,
    margin: 0,
    lineHeight: 1.15,
    textAlign: "center",
    textShadow: "0 4px 20px rgba(0,0,0,0.5)",
  },
  ctaUrl: {
    color: "#f0c040",
    fontSize: 44,
    fontWeight: 800,
    margin: 0,
    letterSpacing: 1,
    textShadow: "0 0 30px rgba(240,192,64,0.4)",
  },
};

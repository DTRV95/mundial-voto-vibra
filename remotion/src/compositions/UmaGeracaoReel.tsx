import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { PulsingDot } from "../components/PulsingDot";
import { FlagParticles } from "../components/FlagParticles";
import { UmaGeracaoLogo } from "../components/UmaGeracaoLogo";
import { BEBAS, INTER } from "../fonts";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// ── utilitário ────────────────────────────────────────────────────────────────

function fadeIn(frame: number, start: number, duration = 20): number {
  return interpolate(frame, [start, start + duration], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function fadeOut(frame: number, start: number, duration = 14): number {
  return interpolate(frame, [start, start + duration], [1, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function slideFromRight(frame: number, start: number, duration = 24, distance = 120): number {
  return interpolate(frame, [start, start + duration], [distance, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

// ── Cena 3 — 7 a 11 s · frames 210–329 ────────────────────────────────────────
// Fundo preto. "Esta geração" / "não volta." linha a linha.

const SceneText: React.FC<{ frame: number }> = ({ frame }) => {
  const local = frame - 210;

  const bg = fadeIn(local, 0, 16);
  const exit = frame > 312 ? fadeOut(frame, 312) : 1;

  // Linha 1: "Esta geração" — entra frame 0–20 (local)
  const l1Opacity = fadeIn(local, 8, 22);
  const l1Y = interpolate(local, [8, 30], [50, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Linha 2: "não volta." — entra frame 36–58 (local)
  const l2Opacity = fadeIn(local, 36, 22);
  const l2Y = interpolate(local, [36, 58], [50, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Linha 3: traço decorativo aparece com a linha 2
  const lineOpacity = fadeIn(local, 52, 16);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `rgba(0,0,0,${bg})`,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 8,
        padding: "0 80px",
        opacity: exit,
      }}
    >
      <div style={{ opacity: l1Opacity, transform: `translateY(${l1Y}px)` }}>
        <span
          style={{
            fontFamily: BEBAS,
            fontSize: 120,
            color: "#FFFFFF",
            letterSpacing: 4,
            lineHeight: 1,
            display: "block",
            textAlign: "center",
          }}
        >
          Esta geração
        </span>
      </div>

      <div
        style={{
          width: 60,
          height: 3,
          backgroundColor: "#E61D25",
          opacity: lineOpacity,
          margin: "4px 0",
        }}
      />

      <div style={{ opacity: l2Opacity, transform: `translateY(${l2Y}px)` }}>
        <span
          style={{
            fontFamily: BEBAS,
            fontSize: 120,
            color: "#FFFFFF",
            letterSpacing: 4,
            lineHeight: 1,
            display: "block",
            textAlign: "center",
          }}
        >
          não volta.
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ── Cena 4 — 11 a 15 s · frames 330–449 ──────────────────────────────────────
// Fundo azul #2A398D. Texto a entrar da direita.

const SceneBlue: React.FC<{ frame: number }> = ({ frame }) => {
  const local = frame - 330;

  const bg = fadeIn(local, 0, 20);
  const exit = frame > 432 ? fadeOut(frame, 432) : 1;

  // "A tua voz" — entra da direita frame 10–32
  const t1Opacity = fadeIn(local, 10, 22);
  const t1X = slideFromRight(local, 10, 26, 160);

  // "está quase aqui." — entra da direita frame 44–66
  const t2Opacity = fadeIn(local, 44, 22);
  const t2X = slideFromRight(local, 44, 26, 160);

  // Linha decorativa vermelha entre os dois textos
  const divOpacity = fadeIn(local, 36, 14);
  const divW = interpolate(local, [36, 60], [0, 200], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `rgba(42,57,141,${bg})`,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 16,
        padding: "0 80px",
        opacity: exit,
      }}
    >
      {/* Ruído de textura — gradiente radial subtil */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          opacity: t1Opacity,
          transform: `translateX(${t1X}px)`,
          alignSelf: "flex-start",
        }}
      >
        <span
          style={{
            fontFamily: BEBAS,
            fontSize: 110,
            color: "#FFFFFF",
            letterSpacing: 3,
            lineHeight: 1,
          }}
        >
          A tua voz
        </span>
      </div>

      <div
        style={{
          width: divW,
          height: 3,
          backgroundColor: "#E61D25",
          opacity: divOpacity,
          alignSelf: "flex-start",
          boxShadow: "0 0 12px #E61D2566",
        }}
      />

      <div
        style={{
          opacity: t2Opacity,
          transform: `translateX(${t2X}px)`,
          alignSelf: "flex-start",
        }}
      >
        <span
          style={{
            fontFamily: INTER,
            fontSize: 62,
            fontWeight: 300,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: 1,
            lineHeight: 1.2,
          }}
        >
          está quase aqui.
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ── Cena 6 — 18 a 20 s · frames 540–599 ──────────────────────────────────────
// Fade out logo + cadeado + @umageracao2026

const SceneOutro: React.FC<{ frame: number }> = ({ frame }) => {
  const local = frame - 540;

  const lockOpacity = fadeIn(local, 6, 18);
  const lockY = interpolate(local, [6, 24], [30, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const handleOpacity = fadeIn(local, 20, 18);
  const handleY = interpolate(local, [20, 38], [20, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out total nos últimos 12 frames
  const finalFade = interpolate(local, [46, 58], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 20,
        opacity: finalFade,
      }}
    >
      <div
        style={{
          opacity: lockOpacity,
          transform: `translateY(${lockY}px)`,
          fontSize: 72,
          lineHeight: 1,
        }}
      >
        🔒
      </div>

      <div
        style={{
          opacity: handleOpacity,
          transform: `translateY(${handleY}px)`,
        }}
      >
        <span
          style={{
            fontFamily: INTER,
            fontSize: 44,
            fontWeight: 400,
            color: "rgba(255,255,255,0.7)",
            letterSpacing: 1,
          }}
        >
          @umageracao2026
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ── Composição principal ──────────────────────────────────────────────────────

export const UmaGeracaoReel: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>

      {/* Cena 1 — 0–3 s: ponto vermelho a pulsar */}
      {frame < 96 && <PulsingDot />}

      {/* Cena 2 — 3–7 s: explosão em partículas da bandeira */}
      {frame >= 86 && frame < 210 && <FlagParticles />}

      {/* Cena 3 — 7–11 s: "Esta geração / não volta." */}
      {frame >= 200 && frame < 330 && <SceneText frame={frame} />}

      {/* Cena 4 — 11–15 s: fundo azul + texto da direita */}
      {frame >= 320 && frame < 450 && <SceneBlue frame={frame} />}

      {/* Cena 5 — 15–18 s: logo Uma Geração */}
      {frame >= 440 && frame < 540 && <UmaGeracaoLogo />}

      {/* Cena 6 — 18–20 s: cadeado + handle */}
      {frame >= 530 && <SceneOutro frame={frame} />}
    </AbsoluteFill>
  );
};

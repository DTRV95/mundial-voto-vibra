import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BEBAS, INTER } from "../fonts";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// ─────────────────────────────────────────────────────────────────────────────
// Cena 1 — 0 a 4 s (120 frames)
// Fundo preto. Palavras entram uma a uma com spring agressivo.
// "VOLTA." fica vermelha e pulsa uma vez.
// ─────────────────────────────────────────────────────────────────────────────

const Scene1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = [
    { text: "ESTA",    color: "#FFFFFF", entry: 4  },
    { text: "GERAÇÃO", color: "#FFFFFF", entry: 20 },
    { text: "NÃO",     color: "#FFFFFF", entry: 36 },
    { text: "VOLTA.",  color: "#E61D25", entry: 52 },
  ];

  // Pulso único em "VOLTA." — keyframe suave
  const voltaPulse = interpolate(
    frame,
    [64, 69, 76, 86],
    [1, 1.12, 1.04, 1.0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 4,
        padding: "150px 60px 170px",
      }}
    >
      {words.map((w) => {
        const sc = spring({
          frame: frame - w.entry,
          fps,
          config: { damping: 10, stiffness: 280, mass: 0.65 },
        });
        const y   = interpolate(sc, [0, 1], [100, 0]);
        const opacity = interpolate(frame, [w.entry, w.entry + 6], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const isVolta = w.text === "VOLTA.";
        const scale = isVolta && frame >= 64 ? voltaPulse : 1;

        return (
          <div
            key={w.text}
            style={{
              opacity,
              transform: `translateY(${y}px) scale(${scale})`,
            }}
          >
            <span
              style={{
                fontFamily: BEBAS,
                fontSize: 160,
                color: w.color,
                letterSpacing: 6,
                lineHeight: 0.9,
                display: "block",
                textAlign: "center",
                textShadow: isVolta
                  ? "0 0 60px rgba(230,29,37,0.55)"
                  : "none",
              }}
            >
              {w.text}
            </span>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Cena 2 — 4 a 8 s (120 frames)
// Flash → fundo #E61D25. Texto palavra a palavra da esquerda.
// "peso." entra em #FFD700 com spring scale 1.0 → 1.15.
// ─────────────────────────────────────────────────────────────────────────────

const Scene2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Flash inicial (3 frames brancos)
  const flashOp = interpolate(frame, [0, 3, 7], [1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fundo vermelho faz fade in depois do flash
  const bgOp = interpolate(frame, [4, 16], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "Em breve," — desliza de cima, pequeno
  const emY = interpolate(frame, [10, 28], [-28, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const emOp = interpolate(frame, [10, 24], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "a tua opinião" — spring da esquerda
  const opinSpring = spring({
    frame: frame - 26,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.8 },
  });
  const opinX = interpolate(opinSpring, [0, 1], [-120, 0]);
  const opinOp = interpolate(frame, [26, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "vai ter " — spring da esquerda
  const vaiSpring = spring({
    frame: frame - 46,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.8 },
  });
  const vaiX = interpolate(vaiSpring, [0, 1], [-120, 0]);
  const vaiOp = interpolate(frame, [46, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "peso." — spring scale 1.0 → 1.15
  const pesoScale = spring({
    frame: frame - 58,
    fps,
    config: { damping: 10, stiffness: 240, mass: 0.7 },
    from: 1.0,
    to: 1.15,
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: `rgba(230,29,37,${bgOp})` }} />
      <AbsoluteFill style={{ backgroundColor: `rgba(255,255,255,${flashOp})` }} />

      <AbsoluteFill
        style={{
          alignItems: "flex-start",
          justifyContent: "center",
          flexDirection: "column",
          gap: 10,
          padding: "150px 60px 170px",
        }}
      >
        {/* "Em breve," */}
        <div style={{ opacity: emOp, transform: `translateY(${emY}px)` }}>
          <span
            style={{
              fontFamily: INTER,
              fontSize: 34,
              fontWeight: 300,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: 3,
              textTransform: "uppercase",
            }}
          >
            Em breve,
          </span>
        </div>

        {/* "a tua opinião" */}
        <div style={{ opacity: opinOp, transform: `translateX(${opinX}px)` }}>
          <span
            style={{
              fontFamily: BEBAS,
              fontSize: 100,
              color: "#FFFFFF",
              letterSpacing: 4,
              lineHeight: 0.95,
            }}
          >
            a tua opinião
          </span>
        </div>

        {/* "vai ter peso." */}
        <div
          style={{
            opacity: vaiOp,
            transform: `translateX(${vaiX}px)`,
            display: "flex",
            alignItems: "baseline",
            gap: 14,
            flexWrap: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily: BEBAS,
              fontSize: 100,
              color: "#FFFFFF",
              letterSpacing: 4,
              lineHeight: 0.95,
              whiteSpace: "nowrap",
            }}
          >
            vai ter
          </span>
          <span
            style={{
              fontFamily: BEBAS,
              fontSize: 100,
              color: "#FFD700",
              letterSpacing: 4,
              lineHeight: 0.95,
              display: "inline-block",
              transform: `scale(${pesoScale})`,
              transformOrigin: "left center",
              textShadow: "0 0 40px rgba(255,215,0,0.6)",
              whiteSpace: "nowrap",
            }}
          >
            peso.
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Cena 3 — 8 a 13 s (150 frames)
// Fundo #2A398D. 3 linhas entram de baixo com spring, 1 s de intervalo.
// ─────────────────────────────────────────────────────────────────────────────

const Scene3: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lines = [
    { text: "⚽  Vota em cada jogo",        entry: 10 },
    { text: "📊  Compara com a comunidade", entry: 40 },
    { text: "🏆  Compete com a família",    entry: 70 },
  ];

  const bgOp = interpolate(frame, [0, 18], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: `rgba(42,57,141,${bgOp})` }} />

      {/* Gradiente de profundidade */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,255,255,0.04) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <AbsoluteFill
        style={{
          alignItems: "flex-start",
          justifyContent: "center",
          flexDirection: "column",
          gap: 36,
          padding: "150px 60px 170px",
        }}
      >
        {lines.map((line) => {
          const sc = spring({
            frame: frame - line.entry,
            fps,
            config: { damping: 14, stiffness: 150, mass: 0.9 },
          });
          const y = interpolate(sc, [0, 1], [90, 0]);
          const opacity = interpolate(
            frame,
            [line.entry, line.entry + 14],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <div
              key={line.text}
              style={{ opacity, transform: `translateY(${y}px)` }}
            >
              <span
                style={{
                  fontFamily: INTER,
                  fontSize: 56,
                  fontWeight: 700,
                  color: "#FFFFFF",
                  letterSpacing: 0.5,
                  lineHeight: 1.25,
                }}
              >
                {line.text}
              </span>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Cena 4 — 13 a 17 s (120 frames)
// Flash branco 3 frames → Logo Uma Geração com spring scale → @umageracao2026
// ─────────────────────────────────────────────────────────────────────────────

const Scene4: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Flash 3 frames
  const flashOp = interpolate(frame, [0, 3, 7], [1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Logo: spring scale 0 → 1
  const logoScale = spring({
    frame: frame - 8,
    fps,
    config: { damping: 13, stiffness: 170, mass: 0.9 },
  });
  const logoOp = interpolate(frame, [6, 22], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Halo pulsante
  const haloBeat = ((frame % 36) / 36) * Math.PI * 2;
  const haloScale = 1 + Math.sin(haloBeat) * 0.04 * Math.min(1, (frame - 8) / 20);

  // Handle
  const handleOp = interpolate(frame, [38, 58], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const handleY = interpolate(frame, [38, 58], [24, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: "#000000" }} />
      <AbsoluteFill style={{ backgroundColor: `rgba(255,255,255,${flashOp})` }} />

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 30,
          padding: "150px 60px 170px",
        }}
      >
        {/* Halo */}
        <div
          style={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: 64,
            backgroundColor: "#E61D25",
            opacity: logoOp * 0.14,
            transform: `scale(${logoScale * haloScale})`,
          }}
        />

        {/* Logo — substitui logo.svg pelo teu logo.png se quiseres */}
        <div
          style={{
            opacity: logoOp,
            transform: `scale(${logoScale})`,
            width: 200,
            height: 200,
            borderRadius: 40,
            overflow: "hidden",
            boxShadow:
              "0 20px 80px rgba(230,29,37,0.45), 0 0 0 1.5px rgba(255,255,255,0.10)",
          }}
        >
          <Img
            src={staticFile("logo.svg")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* @umageracao2026 */}
        <div
          style={{
            opacity: handleOp,
            transform: `translateY(${handleY}px)`,
          }}
        >
          <span
            style={{
              fontFamily: INTER,
              fontSize: 40,
              fontWeight: 400,
              color: "rgba(255,255,255,0.55)",
              letterSpacing: 1,
            }}
          >
            @umageracao2026
          </span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Cena 5 — 17 a 20 s (90 frames)
// Fundo preto. "🔒 Em breve." pulsa lentamente. Fade out nos últimos 15 frames.
// ─────────────────────────────────────────────────────────────────────────────

const Scene5: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrada com spring
  const entrySpring = spring({
    frame: frame - 4,
    fps,
    config: { damping: 16, stiffness: 140, mass: 0.9 },
  });
  const entryOp = interpolate(frame, [2, 18], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulso contínuo lento (0.4 Hz)
  const beat = (frame / 30) * Math.PI * 2 * 0.4;
  const pulse = 1 + Math.sin(beat) * 0.025;

  // Fade out nos últimos 15 frames (frame 75-90)
  const fadeOut = interpolate(frame, [75, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = interpolate(entrySpring, [0, 1], [0.85, 1]) * pulse;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000000",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          opacity: entryOp * fadeOut,
          transform: `scale(${scale})`,
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: BEBAS,
            fontSize: 80,
            color: "#FFFFFF",
            letterSpacing: 6,
            textShadow: "0 0 30px rgba(255,255,255,0.15)",
          }}
        >
          🔒  Em breve.
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Composição principal — 20 s × 30 fps = 600 frames
// ─────────────────────────────────────────────────────────────────────────────

export const UmaGeracaoKinetic: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Cena 1 — 0–4 s */}
      <Sequence from={0} durationInFrames={120}>
        <Scene1 />
      </Sequence>

      {/* Cena 2 — 4–8 s */}
      <Sequence from={120} durationInFrames={120}>
        <Scene2 />
      </Sequence>

      {/* Cena 3 — 8–13 s */}
      <Sequence from={240} durationInFrames={150}>
        <Scene3 />
      </Sequence>

      {/* Cena 4 — 13–17 s */}
      <Sequence from={390} durationInFrames={120}>
        <Scene4 />
      </Sequence>

      {/* Cena 5 — 17–20 s */}
      <Sequence from={510} durationInFrames={90}>
        <Scene5 />
      </Sequence>
    </AbsoluteFill>
  );
};

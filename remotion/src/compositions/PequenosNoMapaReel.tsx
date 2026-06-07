import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// ── Bokeh particle ────────────────────────────────────────────────────────────

interface ParticleProps {
  seed: number;
}

const BokehParticle: React.FC<ParticleProps> = ({ seed }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const rand = (offset: number) => Math.abs(Math.sin(seed * 73856 + offset) * 43758.5) % 1;

  const x = rand(1) * 1080;
  const y = rand(2) * 1920;
  const size = 8 + rand(3) * 28;
  const hue = [120, 45, 0][Math.floor(rand(4) * 3)]; // verde / dourado / vermelho
  const drift = rand(5) * 40 - 20;
  const speed = 0.3 + rand(6) * 0.5;
  const phase = rand(7) * fps * 6;

  const t = (frame + phase) * speed;
  const tx = Math.sin(t / 40) * drift;
  const ty = -t * 0.12;

  const opacity = interpolate(
    Math.sin(t / 30),
    [-1, 1],
    [0.04, 0.18],
  );

  return (
    <div
      style={{
        position: "absolute",
        left: x + tx,
        top: y + ty,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `hsl(${hue}, 80%, 60%)`,
        filter: `blur(${size * 0.45}px)`,
        opacity,
      }}
    />
  );
};

// ── Main composition ──────────────────────────────────────────────────────────

export const PequenosNoMapaReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const toF = (s: number) => s * fps;

  // ── Fundo a preto ─────────────────────────────────────────────────────────
  const bgFadeIn = interpolate(frame, [0, toF(0.6)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Background desfocado fade ─────────────────────────────────────────────
  const blurFadeIn = interpolate(frame, [toF(0.2), toF(1.2)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // Parallax: scale + translateX no background
  const bgScale = interpolate(
    frame,
    [toF(1.5), toF(7.5)],
    [1.15, 1.22],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) },
  );
  const bgTx = interpolate(
    frame,
    [toF(1.5), toF(7.5)],
    [-10, 10],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) },
  );

  // ── Imagem principal entrada ──────────────────────────────────────────────
  const imgEntryProgress = spring({
    frame: frame - toF(0.4),
    fps,
    config: { damping: 18, stiffness: 60, mass: 1 },
    durationInFrames: toF(1.5),
  });
  const imgOpacity = interpolate(imgEntryProgress, [0, 1], [0, 1]);
  const imgEntryScale = interpolate(imgEntryProgress, [0, 1], [0.94, 1]);
  const imgEntryY = interpolate(imgEntryProgress, [0, 1], [40, 0]);

  // ── Ken Burns subtil ──────────────────────────────────────────────────────
  const kenBurnsScale = interpolate(
    frame,
    [toF(1.5), toF(7.5)],
    [1, 1.035],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) },
  );
  const kenBurnsY = interpolate(
    frame,
    [toF(1.5), toF(7.5)],
    [0, -15],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) },
  );

  // ── Pulse em "Enormes no Coração" (7.5–9s) ───────────────────────────────
  const pulseProgress = spring({
    frame: frame - toF(7.5),
    fps,
    config: { damping: 12, stiffness: 80, mass: 0.8 },
    durationInFrames: toF(0.8),
  });
  const pulseReturnProgress = spring({
    frame: frame - toF(8.0),
    fps,
    config: { damping: 14, stiffness: 70, mass: 0.8 },
    durationInFrames: toF(0.8),
  });
  const pulseScale =
    frame >= toF(7.5)
      ? interpolate(pulseProgress, [0, 1], [1.035, 1.05]) -
        interpolate(pulseReturnProgress, [0, 1], [0, 0.015])
      : kenBurnsScale;

  const imgScale = frame < toF(7.5) ? imgEntryScale * kenBurnsScale : imgEntryScale * pulseScale;
  const imgTranslateY = frame < toF(7.5) ? imgEntryY + kenBurnsY : imgEntryY + kenBurnsY;

  // ── Glow dourado (7.5–9s) ─────────────────────────────────────────────────
  const glowOpacity = interpolate(
    frame,
    [toF(7.5), toF(8.2), toF(8.8), toF(9.0)],
    [0, 0.22, 0.18, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // ── Luz radial dourada em movimento (1.5–9s) ──────────────────────────────
  const lightProgress = interpolate(
    frame,
    [toF(1.5), toF(7.5)],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) },
  );
  const lightX = interpolate(lightProgress, [0, 1], [75, 50]);
  const lightY = interpolate(lightProgress, [0, 1], [15, 35]);
  const lightOpacity = interpolate(
    frame,
    [toF(1.0), toF(2.0), toF(7.0), toF(7.5)],
    [0, 0.15, 0.15, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // ── Fade out final (9–10s) ────────────────────────────────────────────────
  const fadeOut = interpolate(
    frame,
    [toF(9.0), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) },
  );
  const bgFadeOut = interpolate(
    frame,
    [toF(9.3), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) },
  );

  const particles = useMemo(() => Array.from({ length: 12 }, (_, i) => i), []);

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {/* ── Fundo a preto com fade in ─────────────────────────────────────── */}
      <AbsoluteFill style={{ opacity: bgFadeIn * bgFadeOut }}>

        {/* Background desfocado */}
        <AbsoluteFill style={{ opacity: blurFadeIn }}>
          <Img
            src={staticFile("assets/pequenos-no-mapa.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${bgScale}) translateX(${bgTx}px)`,
              filter: "blur(28px) saturate(1.4) brightness(0.55)",
            }}
          />
        </AbsoluteFill>

        {/* Partículas bokeh */}
        <AbsoluteFill style={{ overflow: "hidden" }}>
          {particles.map((i) => (
            <BokehParticle key={i} seed={i + 1} />
          ))}
        </AbsoluteFill>

        {/* Luz radial dourada */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse at ${lightX}% ${lightY}%, rgba(255,210,100,0.9) 0%, transparent 60%)`,
            opacity: lightOpacity,
            mixBlendMode: "screen",
          }}
        />

        {/* Imagem principal */}
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: imgOpacity * fadeOut,
          }}
        >
          <div
            style={{
              transform: `scale(${imgScale}) translateY(${imgTranslateY}px)`,
              position: "relative",
            }}
          >
            {/* Glow dourado pulse */}
            {frame >= toF(7.5) && (
              <div
                style={{
                  position: "absolute",
                  inset: -40,
                  borderRadius: 24,
                  background:
                    "radial-gradient(ellipse at 50% 65%, rgba(255,200,60,0.9) 0%, transparent 65%)",
                  opacity: glowOpacity,
                  filter: "blur(20px)",
                  zIndex: 0,
                }}
              />
            )}
            <Img
              src={staticFile("assets/pequenos-no-mapa.png")}
              style={{
                width: 960,
                objectFit: "contain",
                borderRadius: 12,
                boxShadow:
                  "0 8px 60px rgba(0,0,0,0.7), 0 2px 20px rgba(0,0,0,0.5)",
                display: "block",
                position: "relative",
                zIndex: 1,
              }}
            />
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Fade final para preto */}
      <AbsoluteFill
        style={{
          background: "#000",
          opacity: 1 - bgFadeOut,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};

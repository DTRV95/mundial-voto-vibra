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

// ── Bolha de cerveja ──────────────────────────────────────────────────────────

interface BubbleProps {
  seed: number;
}

const Bubble: React.FC<BubbleProps> = ({ seed }) => {
  const frame = useCurrentFrame();

  const rand = (o: number) => Math.abs(Math.sin(seed * 127.1 + o * 311.7) * 43758.5) % 1;

  const x = 60 + rand(1) * 960; // dentro da zona da imagem
  const size = 4 + rand(2) * 18;
  const speed = 1.8 + rand(3) * 3.2; // px por frame
  const phase = rand(4) * 1920; // offset inicial
  const drift = (rand(5) - 0.5) * 30; // deriva horizontal
  const hue = rand(6) > 0.5 ? "255,220,80" : "255,255,255"; // dourado ou branco

  // posição Y: começa no fundo e sobe em loop
  const rawY = 1920 + size - ((frame * speed + phase) % (1920 + size * 2));
  const tx = Math.sin((frame * 0.04) + seed) * drift;

  // opacity: fade in nos primeiros 200px, fade out nos últimos 150px
  // borbulhas sobem → rawY decresce; usar clamp manual
  const opacity =
    rawY > 1720 ? interpolate(rawY, [1720, 1920], [0.55, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) :
    rawY < 50   ? interpolate(rawY, [0, 50], [0, 0.55], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) :
    0.55;

  return (
    <div
      style={{
        position: "absolute",
        left: x + tx - size / 2,
        top: rawY - size / 2,
        width: size,
        height: size,
        borderRadius: "50%",
        background: `rgba(${hue}, 0.85)`,
        filter: `blur(${size * 0.25}px)`,
        opacity,
        border: `1px solid rgba(${hue}, 0.4)`,
      }}
    />
  );
};

// ── Composição principal ──────────────────────────────────────────────────────

export const PequenosNoMapaReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const toF = (s: number) => s * fps;

  // ── Fade in inicial ───────────────────────────────────────────────────────
  const introFade = interpolate(frame, [0, toF(0.5)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // ── Entrada da imagem com spring ──────────────────────────────────────────
  const entrySpring = spring({
    frame: frame - toF(0.3),
    fps,
    config: { damping: 20, stiffness: 55, mass: 1 },
    durationInFrames: toF(1.8),
  });
  const imgOpacity = interpolate(entrySpring, [0, 1], [0, 1]);
  const imgScale = interpolate(entrySpring, [0, 1], [0.95, 1]);
  const imgY = interpolate(entrySpring, [0, 1], [30, 0]);

  // ── Ken Burns muito subtil (1.5–9s) ──────────────────────────────────────
  const kbScale = interpolate(
    frame,
    [toF(1.5), toF(9.0)],
    [1.0, 1.025],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) },
  );

  // ── Pulse em "Enormes no Coração" (7.5–8.5s) ─────────────────────────────
  const pulseIn = spring({
    frame: frame - toF(7.5),
    fps,
    config: { damping: 10, stiffness: 90, mass: 0.7 },
    durationInFrames: toF(0.6),
  });
  const pulseOut = spring({
    frame: frame - toF(8.1),
    fps,
    config: { damping: 14, stiffness: 70, mass: 0.8 },
    durationInFrames: toF(0.6),
  });
  const pulseScale =
    frame < toF(7.5)
      ? kbScale
      : kbScale + interpolate(pulseIn, [0, 1], [0, 0.02]) - interpolate(pulseOut, [0, 1], [0, 0.02]);

  // ── Glow dourado no pulse ─────────────────────────────────────────────────
  const glowOpacity = interpolate(
    frame,
    [toF(7.5), toF(8.0), toF(8.8), toF(9.2)],
    [0, 0.18, 0.14, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  // ── Fade out final (9–10s) ────────────────────────────────────────────────
  const fadeOut = interpolate(
    frame,
    [toF(9.0), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) },
  );

  // ── Opacidade das borbulhas — aparecem gradualmente ───────────────────────
  const bubblesOpacity = interpolate(
    frame,
    [toF(0.8), toF(2.0), toF(8.5), toF(9.5)],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  const bubbles = useMemo(() => Array.from({ length: 35 }, (_, i) => i), []);

  const finalScale = imgScale * pulseScale;

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <AbsoluteFill style={{ opacity: introFade * fadeOut }}>

        {/* ── Background desfocado ────────────────────────────────────────── */}
        <AbsoluteFill>
          <Img
            src={staticFile("assets/pequenos-no-mapa.png")}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              filter: "blur(32px) brightness(0.45) saturate(1.3)",
              transform: "scale(1.18)",
            }}
          />
        </AbsoluteFill>

        {/* ── Gradiente de fundo âmbar subtil (cor cerveja) ───────────────── */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(200,140,20,0.25) 0%, transparent 60%)",
          }}
        />

        {/* ── Borbulhas a subir ────────────────────────────────────────────── */}
        <AbsoluteFill style={{ opacity: bubblesOpacity, overflow: "hidden" }}>
          {bubbles.map((i) => (
            <Bubble key={i} seed={i + 1} />
          ))}
        </AbsoluteFill>

        {/* ── Glow dourado no pulse ────────────────────────────────────────── */}
        <AbsoluteFill
          style={{
            background:
              "radial-gradient(ellipse at 50% 62%, rgba(255,200,50,0.9) 0%, transparent 55%)",
            opacity: glowOpacity,
            mixBlendMode: "screen",
          }}
        />

        {/* ── Imagem principal ─────────────────────────────────────────────── */}
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: imgOpacity * fadeOut,
          }}
        >
          <div style={{ transform: `scale(${finalScale}) translateY(${imgY}px)`, position: "relative" }}>
            <Img
              src={staticFile("assets/pequenos-no-mapa.png")}
              style={{
                width: 980,
                objectFit: "contain",
                borderRadius: 10,
                boxShadow: "0 12px 80px rgba(0,0,0,0.75), 0 2px 24px rgba(0,0,0,0.5)",
                display: "block",
              }}
            />
          </div>
        </AbsoluteFill>

      </AbsoluteFill>

      {/* Fade final para preto */}
      <AbsoluteFill
        style={{ background: "#000", opacity: 1 - fadeOut, pointerEvents: "none" }}
      />
    </AbsoluteFill>
  );
};

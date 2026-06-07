import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

interface BubbleProps {
  seed: number;
}

const Bubble: React.FC<BubbleProps> = ({ seed }) => {
  const frame = useCurrentFrame();
  const rand = (o: number) => Math.abs(Math.sin(seed * 127.1 + o * 311.7) * 43758.5) % 1;

  const x = 80 + rand(1) * 920;
  const size = 5 + rand(2) * 16;
  const speed = 1.5 + rand(3) * 2.5;
  const phase = rand(4) * 1920;
  const drift = (rand(5) - 0.5) * 24;

  const rawY = 1950 - ((frame * speed + phase) % 2100);
  const tx = Math.sin(frame * 0.03 + seed) * drift;

  const opacity =
    rawY > 1750
      ? (1950 - rawY) / 200 * 0.5
      : rawY < 80
      ? (rawY / 80) * 0.5
      : 0.5;

  return (
    <div
      style={{
        position: "absolute",
        left: x + tx - size / 2,
        top: rawY,
        width: size,
        height: size,
        borderRadius: "50%",
        background: rand(6) > 0.5
          ? "rgba(255,220,80,0.9)"
          : "rgba(255,255,255,0.8)",
        filter: `blur(${size * 0.2}px)`,
        opacity,
      }}
    />
  );
};

export const PequenosNoMapaReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const toF = (s: number) => Math.round(s * fps);

  // Fade in geral
  const fadeIn = interpolate(frame, [0, toF(0.8)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Entrada da imagem
  const entry = spring({
    frame: frame - toF(0.2),
    fps,
    config: { damping: 22, stiffness: 50, mass: 1 },
    durationInFrames: toF(2),
  });
  const imgScale = interpolate(entry, [0, 1], [0.93, 1]);
  const imgY = interpolate(entry, [0, 1], [35, 0]);

  // Ken Burns lento
  const kb = interpolate(frame, [toF(1), toF(9)], [1, 1.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fade out
  const fadeOut = interpolate(frame, [toF(9), durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const bubbles = useMemo(() => Array.from({ length: 30 }, (_, i) => i), []);

  return (
    <AbsoluteFill style={{ background: "#000" }}>

      {/* Background desfocado — sempre visível */}
      <AbsoluteFill style={{ opacity: fadeIn * fadeOut }}>
        <Img
          src={staticFile("assets/pequenos-no-mapa.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(24px) brightness(0.6) saturate(1.2)",
            transform: "scale(1.15)",
          }}
        />
      </AbsoluteFill>

      {/* Borbulhas */}
      <AbsoluteFill style={{ opacity: fadeIn * fadeOut, overflow: "hidden" }}>
        {bubbles.map((i) => <Bubble key={i} seed={i + 1} />)}
      </AbsoluteFill>

      {/* Imagem principal */}
      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: fadeIn * fadeOut,
        }}
      >
        <Img
          src={staticFile("assets/pequenos-no-mapa.png")}
          style={{
            width: 980,
            objectFit: "contain",
            borderRadius: 10,
            boxShadow: "0 8px 60px rgba(0,0,0,0.6)",
            transform: `scale(${imgScale * kb}) translateY(${imgY}px)`,
            display: "block",
          }}
        />
      </AbsoluteFill>

    </AbsoluteFill>
  );
};

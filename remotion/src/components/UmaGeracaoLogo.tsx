import React from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BEBAS } from "../fonts";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const UmaGeracaoLogo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cena começa no frame 450
  const local = frame - 450;

  const bgOpacity = interpolate(local, [0, 12], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Logo: entra com spring e escala a partir do centro
  const scale = spring({
    frame: local - 6,
    fps,
    config: { damping: 13, stiffness: 110, mass: 0.9 },
  });

  const logoOpacity = interpolate(local, [4, 18], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Halo de luz vermelha atrás do logo — pulsa levemente
  const haloBeat = ((local % 28) / 28) * Math.PI * 2;
  const haloScale = interpolate(Math.sin(haloBeat), [-1, 1], [1.0, 1.12]);

  // Texto "Uma Geração" por baixo do logo
  const textOpacity = interpolate(local, [22, 38], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const textY = interpolate(local, [22, 38], [20, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `rgba(0,0,0,${bgOpacity})`,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 48,
      }}
    >
      {/* Halo */}
      <div
        style={{
          position: "absolute",
          width: 260,
          height: 260,
          borderRadius: 36,
          backgroundColor: "#E61D25",
          opacity: logoOpacity * 0.18,
          transform: `scale(${scale * haloScale})`,
        }}
      />

      {/* Quadrado vermelho com "7" */}
      <div
        style={{
          width: 200,
          height: 200,
          borderRadius: 28,
          backgroundColor: "#E61D25",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: logoOpacity,
          transform: `scale(${scale})`,
          boxShadow: "0 12px 60px rgba(230,29,37,0.5), 0 0 120px rgba(230,29,37,0.2)",
        }}
      >
        <span
          style={{
            fontFamily: BEBAS,
            fontSize: 140,
            color: "#FFFFFF",
            lineHeight: 1,
            letterSpacing: -2,
          }}
        >
          7
        </span>
      </div>

      {/* Nome da marca */}
      <div
        style={{
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span
          style={{
            fontFamily: BEBAS,
            fontSize: 64,
            color: "#FFFFFF",
            letterSpacing: 8,
            textTransform: "uppercase",
          }}
        >
          Uma Geração
        </span>
        <div
          style={{
            width: 240,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.3) 30%, rgba(255,255,255,0.3) 70%, transparent)",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};

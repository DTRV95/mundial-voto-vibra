import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const PulsingDot: React.FC = () => {
  const frame = useCurrentFrame();

  // Entrada
  const entrance = interpolate(frame, [0, 18], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Pulsar — baseado em onda sinusoidal mapeada para interpolate
  const beatPhase = ((frame % 24) / 24) * Math.PI * 2;
  const beatRaw = Math.sin(beatPhase);
  const pulse = interpolate(beatRaw, [-1, 1], [0.85, 1.18]);

  // Explosão final: escala vai a 80 entre frames 82-94
  const flashScale = interpolate(frame, [82, 94], [1, 80], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const flashOpacity = interpolate(frame, [86, 95], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const isExploding = frame >= 82;
  const scale = isExploding ? flashScale : pulse * entrance;
  const opacity = isExploding ? flashOpacity : entrance;

  return (
    <AbsoluteFill
      style={{ alignItems: "center", justifyContent: "center", backgroundColor: "#000000" }}
    >
      {/* Halo exterior */}
      <div
        style={{
          position: "absolute",
          width: 80,
          height: 80,
          borderRadius: "50%",
          backgroundColor: "#E61D25",
          opacity: opacity * 0.2 * (isExploding ? 0 : 1),
          transform: `scale(${scale * 1.8})`,
        }}
      />
      {/* Halo intermédio */}
      <div
        style={{
          position: "absolute",
          width: 80,
          height: 80,
          borderRadius: "50%",
          backgroundColor: "#E61D25",
          opacity: opacity * 0.4 * (isExploding ? 0 : 1),
          transform: `scale(${scale * 1.35})`,
        }}
      />
      {/* Núcleo */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          backgroundColor: "#E61D25",
          opacity,
          transform: `scale(${scale})`,
          boxShadow: "0 0 40px #E61D2588, 0 0 80px #E61D2544",
        }}
      />
    </AbsoluteFill>
  );
};

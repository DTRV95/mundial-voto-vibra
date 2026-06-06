import React, { useMemo } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// Deterministic pseudo-random (não usa Math.random para reproducibilidade)
function sr(seed: number): number {
  const x = Math.sin(seed + 1) * 73856;
  return x - Math.floor(x);
}

const PARTICLE_COUNT = 280;
const FLAG_W = 720;
const FLAG_H = 480;
// Proporção da bandeira: 40% verde | 60% vermelho
const GREEN_SPLIT = 0.4;

interface Particle {
  tx: number;
  ty: number;
  color: string;
  size: number;
  delay: number; // frames de atraso na animação
  opacity: number; // opacidade máxima
}

function buildParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const r1 = sr(i * 5 + 1);
    const r2 = sr(i * 5 + 2);
    const r3 = sr(i * 5 + 3);
    const r4 = sr(i * 5 + 4);

    // Posição aleatória dentro do rectângulo da bandeira
    const tx = (r1 - 0.5) * FLAG_W;
    const ty = (r2 - 0.5) * FLAG_H;

    // Cor: baseada na posição X relativa à bandeira
    const normalizedX = (tx + FLAG_W / 2) / FLAG_W;
    const isGreen = normalizedX < GREEN_SPLIT;

    return {
      tx,
      ty,
      color: isGreen ? "#3CAC3B" : "#E61D25",
      size: 4 + r3 * 7,
      delay: r4 * 22, // stagger até 22 frames
      opacity: 0.65 + sr(i * 5 + 0) * 0.35,
    };
  });
}

export const FlagParticles: React.FC = () => {
  const frame = useCurrentFrame();
  const particles = useMemo(buildParticles, []);

  // A cena começa no frame 90. Localizamos para facilidade.
  const local = frame - 90;

  // Fundo preto que faz fade in rápido
  const bgOpacity = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: `rgba(0,0,0,${bgOpacity})`,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {particles.map((p, i) => {
        const animStart = p.delay;
        const animEnd = animStart + 38;

        const x = interpolate(local, [animStart, animEnd], [0, p.tx], {
          easing: EASE,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const y = interpolate(local, [animStart, animEnd], [0, p.ty], {
          easing: EASE,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const appeared = interpolate(local, [animStart, animStart + 10], [0, p.opacity], {
          easing: EASE,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        // Dissolução antes do fim da cena (frame 185-210 absoluto → local 95-120)
        const dissolve = interpolate(local, [90, 118], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const opacity = appeared * dissolve;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: p.color,
              opacity,
              transform: `translate(${x - p.size / 2}px, ${y - p.size / 2}px)`,
              boxShadow: `0 0 ${p.size * 1.5}px ${p.color}66`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

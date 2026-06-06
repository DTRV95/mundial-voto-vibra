import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const StadiumBackground: React.FC = () => {
  const frame = useCurrentFrame();

  const lightPulse = interpolate(
    Math.sin((frame / 30) * Math.PI * 0.4),
    [-1, 1],
    [0.03, 0.07]
  );

  return (
    <AbsoluteFill>
      {/* Base escura — profundidade */}
      <AbsoluteFill
        style={{ background: "linear-gradient(180deg, #020408 0%, #040d12 40%, #061410 100%)" }}
      />

      {/* Relva no fundo — perspectiva */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, transparent 55%, rgba(0,40,15,0.55) 75%, rgba(0,60,20,0.80) 100%)",
        }}
      />

      {/* Linhas de relva — listras subtis */}
      {[...Array(6)].map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: `${(i + 1) * 9}%`,
            background:
              i % 2 === 0
                ? "rgba(0,80,20,0.10)"
                : "rgba(0,50,10,0.06)",
            borderRadius: "60% 60% 0 0 / 20% 20% 0 0",
          }}
        />
      ))}

      {/* Arco de luz central — holofote */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 45% at 50% 30%, rgba(255,220,80,${lightPulse}) 0%, transparent 70%)`,
        }}
      />

      {/* Brilho lateral esquerdo */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 40% 60% at -5% 40%, rgba(0,100,255,0.07) 0%, transparent 70%)",
        }}
      />
      {/* Brilho lateral direito */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 40% 60% at 105% 40%, rgba(0,180,80,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Linha de meio campo — perspectiva */}
      <div
        style={{
          position: "absolute",
          bottom: "18%",
          left: "10%",
          right: "10%",
          height: 2,
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.12) 20%, rgba(255,255,255,0.20) 50%, rgba(255,255,255,0.12) 80%, transparent)",
          borderRadius: 2,
        }}
      />

      {/* Círculo central — elipse em perspectiva */}
      <div
        style={{
          position: "absolute",
          bottom: "12%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 320,
          height: 80,
          border: "1.5px solid rgba(255,255,255,0.10)",
          borderRadius: "50%",
        }}
      />

      {/* Vinheta */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 85% 85% at 50% 50%, transparent 40%, rgba(0,0,0,0.65) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

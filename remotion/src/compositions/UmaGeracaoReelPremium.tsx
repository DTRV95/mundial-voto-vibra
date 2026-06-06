import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { SphereScene } from "../three/SphereScene";
import { FragmentsScene } from "../three/FragmentsScene";
import { TronGridScene } from "../three/TronGridScene";
import { LogoScene } from "../three/LogoScene";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// Fade-in wrapper para cada cena
function useFadeIn(frame: number, startFrame: number, duration = 14): number {
  return interpolate(frame, [startFrame, startFrame + duration], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

/**
 * UmaGeracaoReelPremium — 15 s × 30 fps = 450 frames
 *
 *  Cena 1  0–4 s   frames   0–119  Esfera 3D + partículas
 *  Cena 2  4–7 s   frames 120–209  Fragmentos + texto cinético
 *  Cena 3  7–11 s  frames 210–329  Tron grid + ícones
 *  Cena 4 11–15 s  frames 330–449  Logo + CTA
 *
 * Sobreposições de 12 frames nas transições para crossfade suave.
 */
export const UmaGeracaoReelPremium: React.FC = () => {
  const frame = useCurrentFrame();

  // Opacidades de cena
  const s1Opacity = frame < 108 ? 1 : interpolate(frame, [108, 122], [1, 0], {
    easing: EASE, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const s2Opacity = useFadeIn(frame, 108);
  const s2ExitOpacity = frame < 198 ? 1 : interpolate(frame, [198, 212], [1, 0], {
    easing: EASE, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const s3Opacity = useFadeIn(frame, 198);
  const s3ExitOpacity = frame < 318 ? 1 : interpolate(frame, [318, 332], [1, 0], {
    easing: EASE, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  const s4Opacity = useFadeIn(frame, 318);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>

      {/* Cena 1 — Esfera 3D */}
      {frame < 124 && (
        <AbsoluteFill style={{ opacity: s1Opacity }}>
          <SphereScene />
        </AbsoluteFill>
      )}

      {/* Cena 2 — Fragmentos + Texto */}
      {frame >= 106 && frame < 212 && (
        <AbsoluteFill style={{ opacity: s2Opacity * s2ExitOpacity }}>
          <FragmentsScene />
        </AbsoluteFill>
      )}

      {/* Cena 3 — Tron Grid + Ícones */}
      {frame >= 196 && frame < 334 && (
        <AbsoluteFill style={{ opacity: s3Opacity * s3ExitOpacity }}>
          <TronGridScene />
        </AbsoluteFill>
      )}

      {/* Cena 4 — Logo + CTA */}
      {frame >= 316 && (
        <AbsoluteFill style={{ opacity: s4Opacity }}>
          <LogoScene />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

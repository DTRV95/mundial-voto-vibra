import React from "react";
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
import { BEBAS, INTER } from "../fonts";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const LogoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Cena começa no frame 330
  const local = frame - 330;

  const bgOpacity = interpolate(local, [0, 18], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Logo: cai do topo com spring (física realista) ────────────────────────

  // Fase 1: queda (logo entra de cima)
  const fallY = interpolate(local, [0, 12], [-400, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Fase 2: ressalto — spring a partir do frame 12
  const bounce = spring({
    frame: local - 12,
    fps,
    config: { damping: 9, stiffness: 220, mass: 1.1 },
    from: 0,
    to: 1,
  });

  // Combina: queda linear até frame 12, depois spring
  const logoY = local < 12 ? fallY : interpolate(bounce, [0, 1], [0, 0]);
  const logoScale = local < 12 ? 1 : interpolate(bounce, [0, 1], [1.15, 1]);

  const logoOpacity = interpolate(local, [2, 18], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── Halo pulsante atrás do logo ───────────────────────────────────────────

  const haloBeat = ((local % 32) / 32) * Math.PI * 2;
  const haloScale = 1 + Math.sin(haloBeat) * 0.06 * Math.min(1, (local - 12) / 20);

  // ── Handle @umageracao2026 ────────────────────────────────────────────────

  const handleOpacity = interpolate(local, [32, 52], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const handleY = interpolate(local, [32, 52], [30, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // ── CTA "Em breve 🔒" ─────────────────────────────────────────────────────

  const ctaOpacity = interpolate(local, [52, 72], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const ctaScale = spring({
    frame: local - 52,
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.8 },
  });

  // ── Fade out final ────────────────────────────────────────────────────────

  const finalFade = interpolate(local, [108, 119], [1, 0], {
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
        gap: 32,
        padding: "150px 60px 170px",
        opacity: finalFade,
      }}
    >
      {/* Halo vermelho */}
      <div
        style={{
          position: "absolute",
          width: 340,
          height: 340,
          borderRadius: 80,
          backgroundColor: "#E61D25",
          opacity: logoOpacity * 0.15,
          transform: `scale(${logoScale * haloScale}) translateY(${logoY}px)`,
        }}
      />

      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `translateY(${logoY}px) scale(${logoScale})`,
          width: 240,
          height: 240,
          borderRadius: 44,
          overflow: "hidden",
          boxShadow:
            "0 24px 80px rgba(230,29,37,0.45), 0 0 0 1.5px rgba(255,255,255,0.10)",
        }}
      >
        <Img
          src={staticFile("logo.svg")}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>

      {/* Handle */}
      <div
        style={{
          opacity: handleOpacity,
          transform: `translateY(${handleY}px)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 180,
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.25) 40%, rgba(255,255,255,0.25) 60%, transparent)",
          }}
        />
        <span
          style={{
            fontFamily: INTER,
            fontSize: 36,
            fontWeight: 400,
            color: "rgba(255,255,255,0.65)",
            letterSpacing: 1,
          }}
        >
          @umageracao2026
        </span>
      </div>

      {/* CTA */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaScale})`,
          display: "flex",
          alignItems: "center",
          gap: 14,
          backgroundColor: "rgba(255,255,255,0.07)",
          border: "1px solid rgba(255,255,255,0.15)",
          borderRadius: 50,
          padding: "18px 44px",
          marginTop: 8,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <span
          style={{
            fontFamily: BEBAS,
            fontSize: 48,
            color: "#FFFFFF",
            letterSpacing: 4,
          }}
        >
          Em breve
        </span>
        <span style={{ fontSize: 40 }}>🔒</span>
      </div>
    </AbsoluteFill>
  );
};

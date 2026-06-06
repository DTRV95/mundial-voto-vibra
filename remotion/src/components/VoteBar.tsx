import React from "react";
import { interpolate, spring } from "remotion";
import { FlagPlaceholder } from "./FlagPlaceholder";

interface VoteBarProps {
  label: string;
  percentage: number;
  color: string;
  flagStripes: string[];
  flagSymbol: string;
  flagSymbolColor?: string;
  frame: number;
  startFrame: number;
  fps: number;
}

export const VoteBar: React.FC<VoteBarProps> = ({
  label,
  percentage,
  color,
  flagStripes,
  flagSymbol,
  flagSymbolColor,
  frame,
  startFrame,
  fps,
}) => {
  const progress = spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 22, stiffness: 60, mass: 1.2 },
    from: 0,
    to: percentage,
  });

  const clampedProgress = Math.max(0, Math.min(1, progress));
  const pctLabel = Math.round(clampedProgress * 100);

  const numOpacity = interpolate(frame - startFrame, [0, 12], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Cabeçalho da barra */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <FlagPlaceholder
            stripes={flagStripes}
            symbol={flagSymbol}
            symbolColor={flagSymbolColor}
            size={52}
          />
          <span
            style={{
              color: "#e8e8e8",
              fontSize: 34,
              fontWeight: 700,
              letterSpacing: 0.5,
            }}
          >
            {label}
          </span>
        </div>
        <span
          style={{
            color: color,
            fontSize: 40,
            fontWeight: 900,
            letterSpacing: -0.5,
            opacity: numOpacity,
            minWidth: 90,
            textAlign: "right",
          }}
        >
          {pctLabel}%
        </span>
      </div>

      {/* Trilho da barra */}
      <div
        style={{
          height: 18,
          backgroundColor: "rgba(255,255,255,0.07)",
          borderRadius: 9,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${clampedProgress * 100}%`,
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            borderRadius: 9,
            boxShadow: `0 0 16px ${color}60`,
            position: "relative",
          }}
        >
          {/* Reflexo interno */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "45%",
              background: "linear-gradient(180deg, rgba(255,255,255,0.18), transparent)",
              borderRadius: "9px 9px 0 0",
            }}
          />
        </div>
      </div>
    </div>
  );
};

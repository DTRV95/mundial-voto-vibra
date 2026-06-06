import React from "react";
import { FlagPlaceholder } from "./FlagPlaceholder";

interface TeamCardProps {
  name: string;
  flagStripes: string[];
  flagSymbol: string;
  flagSymbolColor?: string;
  votes: number;
  accentColor: string;
  align?: "left" | "right";
}

export const TeamCard: React.FC<TeamCardProps> = ({
  name,
  flagStripes,
  flagSymbol,
  flagSymbolColor,
  votes,
  accentColor,
  align = "left",
}) => {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        padding: "36px 28px",
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        border: `1px solid rgba(255,255,255,0.10)`,
        borderTop: `2px solid ${accentColor}`,
        borderRadius: 20,
        backdropFilter: "blur(8px)",
        boxShadow: `0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)`,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Brilho de fundo no card */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: align === "left" ? 0 : "auto",
          right: align === "right" ? 0 : "auto",
          width: "70%",
          height: "50%",
          background: `radial-gradient(ellipse at ${align === "left" ? "0% 0%" : "100% 0%"}, ${accentColor}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      <FlagPlaceholder
        stripes={flagStripes}
        symbol={flagSymbol}
        symbolColor={flagSymbolColor}
        size={150}
      />

      <div
        style={{
          color: "#f0f0f0",
          fontSize: 38,
          fontWeight: 800,
          textAlign: "center",
          letterSpacing: 0.5,
          textShadow: "0 2px 12px rgba(0,0,0,0.6)",
        }}
      >
        {name}
      </div>

      <div
        style={{
          color: accentColor,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: 1,
        }}
      >
        {votes.toLocaleString("pt-PT")} votos
      </div>
    </div>
  );
};

import React from "react";

interface FlagPlaceholderProps {
  stripes: string[];   // cores das faixas verticais
  symbol?: string;     // símbolo central em texto (letra, cruz, etc.)
  symbolColor?: string;
  size?: number;
}

export const FlagPlaceholder: React.FC<FlagPlaceholderProps> = ({
  stripes,
  symbol,
  symbolColor = "#ffffff",
  size = 140,
}) => {
  return (
    <div
      style={{
        width: size,
        height: size * 0.67,
        borderRadius: 10,
        overflow: "hidden",
        display: "flex",
        position: "relative",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1.5px rgba(255,255,255,0.12)",
      }}
    >
      {stripes.map((color, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            backgroundColor: color,
          }}
        />
      ))}
      {symbol && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: size * 0.28,
            fontWeight: 900,
            color: symbolColor,
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            fontFamily: "Georgia, serif",
            letterSpacing: 1,
          }}
        >
          {symbol}
        </div>
      )}
    </div>
  );
};

// Definições prontas para usar
export const FLAGS = {
  Portugal: {
    stripes: ["#006600", "#006600", "#CC0000", "#CC0000", "#CC0000"],
    symbol: "PT",
    symbolColor: "#FFD700",
  },
  Espanha: {
    stripes: ["#c60b1e", "#f1bf00", "#f1bf00", "#f1bf00", "#c60b1e"],
    symbol: "ES",
    symbolColor: "#c60b1e",
  },
  Brasil: {
    stripes: ["#009c3b", "#009c3b", "#ffdf00", "#009c3b", "#009c3b"],
    symbol: "BR",
    symbolColor: "#002776",
  },
  França: {
    stripes: ["#002395", "#ffffff", "#ED2939"],
    symbol: "FR",
    symbolColor: "#002395",
  },
  Alemanha: {
    stripes: ["#000000", "#DD0000", "#FFCE00"],
    symbol: "DE",
    symbolColor: "#FFCE00",
  },
  Argentina: {
    stripes: ["#74ACDF", "#ffffff", "#74ACDF"],
    symbol: "AR",
    symbolColor: "#74ACDF",
  },
} as const;

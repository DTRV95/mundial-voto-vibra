import React from "react";
import { Composition } from "remotion";
import { VozDoMundialReel, type VozDoMundialReelProps } from "./compositions/VozDoMundialReel";
import { UmaGeracaoReel } from "./compositions/UmaGeracaoReel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── Voz do Mundial ────────────────────── */}
      <Composition
        id="VozDoMundialReel"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={VozDoMundialReel as any}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          teamA: "Portugal",
          teamB: "Espanha",
          competition: "Mundial 2026 · Fase de Grupos",
          question: "Quem vence em tempo regulamentar?",
          voteCountA: 5841,
          voteCountB: 3967,
        }}
      />

      {/* ── Uma Geração ───────────────────────── */}
      <Composition
        id="UmaGeracaoReel"
        component={UmaGeracaoReel}
        durationInFrames={600} // 20 s × 30 fps
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

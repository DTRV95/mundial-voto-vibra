import React from "react";
import { Composition } from "remotion";
import { VozDoMundialReel, type VozDoMundialReelProps } from "./compositions/VozDoMundialReel";
import { UmaGeracaoReel } from "./compositions/UmaGeracaoReel";
import { UmaGeracaoReelPremium } from "./compositions/UmaGeracaoReelPremium";
import { UmaGeracaoKinetic } from "./compositions/UmaGeracaoKinetic";
import { PequenosNoMapaReel } from "./compositions/PequenosNoMapaReel";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* ── Voz do Mundial ────────────────────── */}
      <Composition
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        component={VozDoMundialReel as any}
        id="VozDoMundialReel"
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={
          {
            teamA: "Portugal",
            teamB: "Espanha",
            competition: "Mundial 2026 · Fase de Grupos",
            question: "Quem vence em tempo regulamentar?",
            voteCountA: 5841,
            voteCountB: 3967,
          } as VozDoMundialReelProps
        }
      />

      {/* ── Uma Geração v1 (pré-lançamento) ───── */}
      <Composition
        id="UmaGeracaoReel"
        component={UmaGeracaoReel}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ── Uma Geração Premium (3D) ───────────── */}
      <Composition
        id="UmaGeracaoReelPremium"
        component={UmaGeracaoReelPremium}
        durationInFrames={450}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* ── Uma Geração Kinetic (tipografia pura) ── */}
      <Composition
        id="UmaGeracaoKinetic"
        component={UmaGeracaoKinetic}
        durationInFrames={600}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* ── Pequenos no Mapa ───────────────────── */}
      <Composition
        id="PequenosNoMapaReel"
        component={PequenosNoMapaReel}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};

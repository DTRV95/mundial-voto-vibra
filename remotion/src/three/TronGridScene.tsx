import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { BEBAS, INTER } from "../fonts";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

// ── Grid geometry ─────────────────────────────────────────────────────────────

function buildGrid(divisions: number, size: number) {
  const points: number[] = [];
  const step = (size * 2) / divisions;

  for (let i = 0; i <= divisions; i++) {
    const v = -size + i * step;
    // linha paralela a X
    points.push(-size, 0, v, size, 0, v);
    // linha paralela a Z
    points.push(v, 0, -size, v, 0, size);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  return geo;
}

// ── Camera ────────────────────────────────────────────────────────────────────

const CamCtrl: React.FC<{ frame: number }> = ({ frame }) => {
  const { camera } = useThree();
  const local = frame - 210;

  // Camera inicia alta e desce levemente — efeito de reveal
  const camY = interpolate(local, [0, 60], [6.5, 5.5], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const camZ = interpolate(local, [0, 60], [7.5, 6.8], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  camera.position.set(0, camY, camZ);
  camera.lookAt(0, 0, -1);
  camera.updateProjectionMatrix();
  return null;
};

// ── Grid animado ──────────────────────────────────────────────────────────────

const TronGrid: React.FC<{ frame: number }> = ({ frame }) => {
  const local = frame - 210;

  const gridGeo = useMemo(() => buildGrid(24, 12), []);

  // Grid faz fade in
  const opacity = interpolate(local, [0, 30], [0, 0.55], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Saída: fade out
  const exit = interpolate(frame, [318, 330], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Grid desliza levemente para a frente — profundidade
  const gridZ = interpolate(local, [0, 120], [0, -2], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <lineSegments geometry={gridGeo} position={[0, -0.5, gridZ]}>
      <lineBasicMaterial
        color="#2A398D"
        transparent
        opacity={opacity * exit}
      />
    </lineSegments>
  );
};

// ── Linhas de horizonte (glow) ────────────────────────────────────────────────

const HorizonLines: React.FC<{ frame: number }> = ({ frame }) => {
  const local = frame - 210;

  const lineGeos = useMemo(() => {
    return [-0.5, 0, 0.5].map((yOff) => {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute(
        "position",
        new THREE.Float32BufferAttribute([-12, yOff - 0.5, -1, 12, yOff - 0.5, -1], 3)
      );
      return geo;
    });
  }, []);

  const opacity = interpolate(local, [10, 35], [0, 0.8], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(frame, [318, 330], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <>
      {lineGeos.map((geo, i) => (
        <lineSegments key={i} geometry={geo}>
          <lineBasicMaterial
            color="#4466ff"
            transparent
            opacity={opacity * exit * (i === 1 ? 1 : 0.4)}
          />
        </lineSegments>
      ))}
    </>
  );
};

// ── Conteúdo Three.js da Cena 3 ───────────────────────────────────────────────

const Scene3Content: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <CamCtrl frame={frame} />
    <ambientLight intensity={0.1} />
    <pointLight position={[0, 2, 2]} color="#2A398D" intensity={4} />
    <TronGrid frame={frame} />
    <HorizonLines frame={frame} />
  </>
);

// ── Ícones React (overlay) ────────────────────────────────────────────────────

interface IconCardProps {
  emoji: string;
  label: string;
  sublabel: string;
  frame: number;
  entryFrame: number;
  fps: number;
  accentColor: string;
}

const IconCard: React.FC<IconCardProps> = ({
  emoji,
  label,
  sublabel,
  frame,
  entryFrame,
  fps,
  accentColor,
}) => {
  const local = frame - entryFrame;

  const scale = spring({
    frame: local,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.7 },
  });

  const opacity = interpolate(local, [0, 14], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const exit = interpolate(frame, [318, 330], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity: opacity * exit,
        transform: `scale(${scale})`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        padding: "36px 28px",
        background: "rgba(255,255,255,0.04)",
        border: `1px solid rgba(255,255,255,0.10)`,
        borderTop: `2.5px solid ${accentColor}`,
        borderRadius: 20,
        backdropFilter: "blur(6px)",
        flex: 1,
        boxShadow: `0 0 40px ${accentColor}22, inset 0 1px 0 rgba(255,255,255,0.06)`,
        minWidth: 0,
      }}
    >
      <span style={{ fontSize: 72, lineHeight: 1 }}>{emoji}</span>
      <span
        style={{
          fontFamily: BEBAS,
          fontSize: 56,
          color: "#FFFFFF",
          letterSpacing: 4,
          textAlign: "center",
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: INTER,
          fontSize: 28,
          color: "rgba(255,255,255,0.55)",
          textAlign: "center",
          letterSpacing: 1,
        }}
      >
        {sublabel}
      </span>
    </div>
  );
};

// ── Export ────────────────────────────────────────────────────────────────────

export const TronGridScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const local = frame - 210;

  // Cabeçalho
  const titleOpacity = interpolate(local, [8, 28], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleY = interpolate(local, [8, 28], [-40, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleExit = interpolate(frame, [318, 330], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000814" }}>
      {/* Grid Three.js */}
      <ThreeCanvas width={1080} height={1920}>
        <Scene3Content frame={frame} />
      </ThreeCanvas>

      {/* Overlay React */}
      <AbsoluteFill
        style={{
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: 60,
          padding: "150px 60px 170px",
          pointerEvents: "none",
        }}
      >
        {/* Título */}
        <div
          style={{
            opacity: titleOpacity * titleExit,
            transform: `translateY(${titleY}px)`,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <span
            style={{
              fontFamily: BEBAS,
              fontSize: 72,
              color: "#FFFFFF",
              letterSpacing: 6,
              lineHeight: 1,
            }}
          >
            Uma plataforma.
          </span>
          <span
            style={{
              fontFamily: INTER,
              fontSize: 36,
              fontWeight: 300,
              color: "rgba(255,255,255,0.5)",
              letterSpacing: 2,
            }}
          >
            três formas de viver o Mundial
          </span>
          <div
            style={{
              width: 100,
              height: 2,
              background:
                "linear-gradient(90deg, transparent, #2A398D 30%, #4466ff 70%, transparent)",
              margin: "4px auto 0",
            }}
          />
        </div>

        {/* Cards dos ícones */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 20,
            width: "100%",
          }}
        >
          <IconCard
            emoji="⚽"
            label="Vota"
            sublabel="no teu favorito"
            frame={frame}
            entryFrame={228}
            fps={fps}
            accentColor="#E61D25"
          />
          <IconCard
            emoji="📊"
            label="Compara"
            sublabel="com a comunidade"
            frame={frame}
            entryFrame={248}
            fps={fps}
            accentColor="#2A398D"
          />
          <IconCard
            emoji="🏆"
            label="Vibra"
            sublabel="com cada jogo"
            frame={frame}
            entryFrame={268}
            fps={fps}
            accentColor="#3CAC3B"
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

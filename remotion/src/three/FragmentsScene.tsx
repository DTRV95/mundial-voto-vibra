import React, { useMemo } from "react";
import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { BEBAS } from "../fonts";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const FRAG_COUNT = 48;

function sr(seed: number): number {
  const x = Math.sin(seed + 1) * 73856;
  return x - Math.floor(x);
}

// ── Dados dos fragmentos (determinísticos) ────────────────────────────────────

interface FragData {
  sx: number; sy: number; sz: number; // posição inicial (na superfície da esfera)
  dx: number; dy: number;             // desvio lateral ao voar
  speed: number;                      // velocidade em Z
  rx: number; ry: number; rz: number; // velocidades de rotação
  colorHex: string;
  scale: number;
}

function buildFrags(): FragData[] {
  const colors = ["#E61D25", "#3CAC3B", "#2A398D", "#ffffff"];
  return Array.from({ length: FRAG_COUNT }, (_, i) => {
    const theta = sr(i * 8) * Math.PI * 2;
    const phi = Math.acos(2 * sr(i * 8 + 1) - 1);
    const r = 2;

    return {
      sx: r * Math.sin(phi) * Math.cos(theta),
      sy: r * Math.sin(phi) * Math.sin(theta),
      sz: r * Math.cos(phi),
      dx: (sr(i * 8 + 2) - 0.5) * 3,
      dy: (sr(i * 8 + 3) - 0.5) * 3,
      speed: 5 + sr(i * 8 + 4) * 6,
      rx: (sr(i * 8 + 5) - 0.5) * 0.15,
      ry: (sr(i * 8 + 6) - 0.5) * 0.15,
      rz: (sr(i * 8 + 7) - 0.5) * 0.15,
      colorHex: colors[Math.floor(sr(i * 8 + 3) * colors.length)],
      scale: 0.08 + sr(i * 8 + 6) * 0.18,
    };
  });
}

// ── Camera ────────────────────────────────────────────────────────────────────

const CamCtrl: React.FC = () => {
  const { camera } = useThree();
  camera.position.set(0, 0, 6);
  camera.lookAt(0, 0, 0);
  camera.updateProjectionMatrix();
  return null;
};

// ── Fragmentos em Three.js ────────────────────────────────────────────────────

const FragmentsContent: React.FC<{ frame: number }> = ({ frame }) => {
  const frags = useMemo(buildFrags, []);

  // Local: cena começa no frame 120
  const local = frame - 120;

  return (
    <>
      <CamCtrl />
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 0, 4]} intensity={3} />

      {frags.map((f, i) => {
        // Cada fragmento começa a mover-se com um pequeno stagger
        const delay = sr(i * 3) * 12;
        const t = interpolate(local, [delay, delay + 50], [0, 1], {
          easing: EASE,
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const x = f.sx + f.dx * t;
        const y = f.sy + f.dy * t;
        const z = f.sz + f.speed * t;

        const opacity = interpolate(
          local,
          [delay, delay + 8, delay + 40, delay + 55],
          [0, 1, 1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );

        const scale = interpolate(local, [delay, delay + 50], [f.scale * 1.4, f.scale * 0.4], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        const rot: [number, number, number] = [
          f.rx * local,
          f.ry * local,
          f.rz * local,
        ];

        return (
          <mesh
            key={i}
            position={[x, y, z]}
            rotation={rot}
            scale={[scale, scale, scale]}
          >
            <icosahedronGeometry args={[1, 0]} />
            <meshPhongMaterial
              color={f.colorHex}
              transparent
              opacity={opacity}
              shininess={120}
              specular={new THREE.Color(0.6, 0.6, 0.6)}
            />
          </mesh>
        );
      })}
    </>
  );
};

// ── Overlay de texto ──────────────────────────────────────────────────────────

const TextOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const local = frame - 120;

  // "Esta geração" — entra nos frames 20-42 (local)
  const l1Opacity = interpolate(local, [20, 42], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const l1Y = interpolate(local, [20, 42], [60, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Traço vermelho — depois da linha 1
  const lineW = interpolate(local, [42, 58], [0, 80], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // "não volta." — entra nos frames 52-74 (local)
  const l2Opacity = interpolate(local, [52, 74], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const l2Y = interpolate(local, [52, 74], [60, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Saída de cena — fade out frames 78-90 (local)
  const exit = interpolate(local, [78, 90], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 0,
        padding: "0 60px",
        pointerEvents: "none",
        opacity: exit,
      }}
    >
      <div style={{ opacity: l1Opacity, transform: `translateY(${l1Y}px)` }}>
        <span
          style={{
            fontFamily: BEBAS,
            fontSize: 120,
            color: "#FFFFFF",
            letterSpacing: 8,
            lineHeight: 1,
            display: "block",
            textAlign: "center",
            textShadow: "0 0 40px rgba(255,255,255,0.15)",
          }}
        >
          Esta geração
        </span>
      </div>

      <div
        style={{
          width: lineW,
          height: 4,
          backgroundColor: "#E61D25",
          margin: "12px auto",
          boxShadow: "0 0 16px #E61D2588",
        }}
      />

      <div style={{ opacity: l2Opacity, transform: `translateY(${l2Y}px)` }}>
        <span
          style={{
            fontFamily: BEBAS,
            fontSize: 120,
            color: "#FFFFFF",
            letterSpacing: 8,
            lineHeight: 1,
            display: "block",
            textAlign: "center",
            textShadow: "0 0 40px rgba(255,255,255,0.15)",
          }}
        >
          não volta.
        </span>
      </div>
    </AbsoluteFill>
  );
};

// ── Export ────────────────────────────────────────────────────────────────────

export const FragmentsScene: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <ThreeCanvas width={1080} height={1920}>
        <FragmentsContent frame={frame} />
      </ThreeCanvas>
      <TextOverlay frame={frame} />
    </AbsoluteFill>
  );
};

import type { ReactNode } from "react";

/**
 * Moldura de telemóvel desenhada em CSS.
 *
 * Não é uma imagem: o que está lá dentro é interface a sério, com dados
 * reais. Uma captura de ecrã envelhece no dia em que se muda um botão —
 * isto acompanha o site para sempre.
 */
export function Telemovel({ children, cor }: { children: ReactNode; cor?: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      {/* Halo por trás, na cor da competição */}
      <div className="pointer-events-none absolute -inset-8 -z-10 rounded-full"
        style={{ background: cor ?? "#E10014", filter: "blur(70px)", opacity: 0.28 }} />

      <div className="relative overflow-hidden rounded-[2.4rem] border-[7px] border-[#15181f] bg-[#0b0e14]"
        style={{ boxShadow: "0 30px 70px -20px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.07), inset 0 0 0 1px rgba(255,255,255,0.04)" }}>

        {/* Ilha do topo */}
        <div className="absolute left-1/2 top-2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-[#15181f]" />

        {/* Barra de estado */}
        <div className="flex items-center justify-between px-5 pb-1 pt-2.5 text-[9px] font-bold text-white/50">
          <span>9:41</span>
          <span className="flex items-center gap-1">
            <span className="tracking-tighter">▮▮▮</span>
            <span className="rounded-sm border border-white/40 px-1 text-[7px]">86</span>
          </span>
        </div>

        {/* Ecrã */}
        <div className="min-h-[420px] px-3 pb-5 pt-1">{children}</div>
      </div>

      {/* Reflexo no vidro */}
      <div className="pointer-events-none absolute inset-0 rounded-[2.4rem]"
        style={{ background: "linear-gradient(140deg, rgba(255,255,255,0.10) 0%, transparent 42%)" }} />
    </div>
  );
}

/** Cabeçalho de ecrã, para as maquetas parecerem o site a sério. */
export function EcraTopo({ titulo, cor }: { titulo: string; cor: string }) {
  return (
    <div className="mb-2.5 flex items-center justify-between px-1">
      <span className="font-display text-[13px] text-white">{titulo}</span>
      <span className="h-1.5 w-8 rounded-full" style={{ background: cor }} />
    </div>
  );
}

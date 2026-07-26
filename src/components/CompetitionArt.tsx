import { useState } from "react";

/**
 * Espaço reservado para a arte oficial da competição.
 *
 * Basta colocar a imagem em `src/assets/` com o nome do slug
 * (ex: `liga-portugal.png`, `champions.png`) que ela aparece aqui.
 * Se não existir, não mostra nada — o painel usa só a atmosfera desenhada.
 */

// Todas as imagens em src/assets, carregadas só quando existem
const artFiles = import.meta.glob("@/assets/comp-*.{png,jpg,jpeg,webp,svg}", {
  eager: true,
  import: "default",
}) as Record<string, string>;

function findArt(slug: string): string | null {
  const match = Object.entries(artFiles).find(([path]) =>
    path.toLowerCase().includes(`comp-${slug.toLowerCase()}.`)
  );
  return match ? match[1] : null;
}

export function CompetitionArt({ slug, className = "" }: { slug: string; className?: string }) {
  const src = findArt(slug);
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;

  return (
    <div className={`pointer-events-none absolute inset-y-0 right-0 w-[46%] select-none md:w-[38%] ${className}`}>
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="h-full w-full object-contain object-right"
        style={{ maskImage: "linear-gradient(to left, black 62%, transparent 100%)",
                 WebkitMaskImage: "linear-gradient(to left, black 62%, transparent 100%)" }}
      />
    </div>
  );
}

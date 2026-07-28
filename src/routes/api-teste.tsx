import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useAuth, useIsAdmin } from "@/lib/useAuth";

/**
 * ⚠️ PÁGINA TEMPORÁRIA DE DIAGNÓSTICO — remover depois de testar a API.
 * Serve só para perceber que dados o plano gratuito do football-data.org
 * disponibiliza. A chave nunca é guardada no código nem na base de dados.
 */

export const Route = createFileRoute("/api-teste")({
  head: () => ({ meta: [{ title: "Diagnóstico API" }, { name: "robots", content: "noindex" }] }),
  component: ApiTeste,
});

/** Corre no servidor (Cloudflare Worker) — sem CORS, sem bloqueios. */
const testarApi = createServerFn({ method: "POST" })
  .inputValidator((d: { key: string }) => d)
  .handler(async ({ data }) => {
    const key = (data?.key ?? "").trim();
    if (!key) return { erro: "Falta a chave." };

    const pedidos: { nome: string; url: string }[] = [
      { nome: "Liga Portugal — info da competição", url: "https://api.football-data.org/v4/competitions/PPL" },
      { nome: "Liga Portugal — jogos (época corrente)", url: "https://api.football-data.org/v4/competitions/PPL/matches" },
      { nome: "Liga Portugal — jogos 2026/27", url: "https://api.football-data.org/v4/competitions/PPL/matches?season=2026" },
      { nome: "Champions — info da competição", url: "https://api.football-data.org/v4/competitions/CL" },
      { nome: "Champions — jogos (época corrente)", url: "https://api.football-data.org/v4/competitions/CL/matches" },
      { nome: "Champions — jogos 2026/27", url: "https://api.football-data.org/v4/competitions/CL/matches?season=2026" },
      { nome: "Competições disponíveis no plano", url: "https://api.football-data.org/v4/competitions" },
    ];

    const resultados: any[] = [];

    for (const p of pedidos) {
      try {
        const r = await fetch(p.url, { headers: { "X-Auth-Token": key } });
        const texto = await r.text();
        let json: any = null;
        try { json = JSON.parse(texto); } catch { /* resposta não-JSON */ }

        // Resumo útil por tipo de resposta
        let resumo = "";
        if (json?.errorCode || json?.message) {
          resumo = `❌ ${json.message ?? "erro"}`;
        } else if (json?.resultSet?.count != null) {
          resumo = `✅ ${json.resultSet.count} jogos`;
          if (json.resultSet.first) resumo += ` · de ${json.resultSet.first} a ${json.resultSet.last}`;
        } else if (json?.currentSeason) {
          resumo = `✅ época corrente: ${json.currentSeason.startDate} → ${json.currentSeason.endDate}`;
          if (json.currentSeason.currentMatchday) resumo += ` (jornada ${json.currentSeason.currentMatchday})`;
        } else if (json?.competitions) {
          const nomes = json.competitions.map((c: any) => `${c.code}=${c.name}`);
          resumo = `✅ ${json.count} competições: ${nomes.join(" · ")}`;
        } else {
          resumo = texto.slice(0, 200);
        }

        resultados.push({ nome: p.nome, url: p.url, estado: r.status, resumo });
      } catch (e: any) {
        resultados.push({ nome: p.nome, url: p.url, estado: 0, resumo: `❌ falha de rede: ${e?.message}` });
      }
    }

    return { resultados };
  });

function ApiTeste() {
  const { user } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const [key, setKey] = useState("");
  const [out, setOut] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!isAdmin) {
    return (
      <div className="px-5 pt-10 text-center">
        <p className="font-display text-xl">Página restrita</p>
        <p className="mt-1 text-sm text-muted-foreground">Só administradores.</p>
      </div>
    );
  }

  async function correr() {
    setLoading(true); setOut(null);
    try {
      const r = await testarApi({ data: { key } });
      setOut(r);
    } catch (e: any) {
      setOut({ erro: e?.message ?? "erro desconhecido" });
    }
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 pt-8 pb-16">
      <h1 className="font-display text-3xl">Diagnóstico da API</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Página temporária. Testa o que o plano gratuito do football-data.org permite.
        A chave só é usada neste pedido — não fica guardada.
      </p>

      <div className="mt-6 flex gap-2">
        <input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Cola aqui a chave da API"
          className="flex-1 rounded-xl border border-border bg-input px-4 py-3 text-sm"
        />
        <button
          onClick={correr}
          disabled={loading || !key.trim()}
          className="rounded-xl bg-gold px-5 py-3 text-sm font-bold text-background disabled:opacity-50"
        >
          {loading ? "A testar…" : "Testar"}
        </button>
      </div>

      {out?.erro && (
        <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm">
          {out.erro}
        </p>
      )}

      {out?.resultados && (
        <div className="mt-6 space-y-2">
          {out.resultados.map((r: any, i: number) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold">{r.nome}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  r.estado === 200 ? "bg-wc-green/15 text-wc-green" : "bg-destructive/15 text-destructive"
                }`}>
                  HTTP {r.estado}
                </span>
              </div>
              <p className="mt-1.5 break-words text-sm text-muted-foreground">{r.resumo}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

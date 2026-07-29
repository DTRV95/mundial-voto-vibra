import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { estadoDna, MINIMO_PRIMEIRO_PERFIL, type EstadoDna } from "@/lib/dnaPerfis";

/**
 * Os dados do módulo "O teu DNA".
 *
 * Regra da Fase A: só devolvemos o que é verdade. Nada de valores
 * de exemplo — se não houver dados, o hook devolve null e a
 * interface mostra o estado de descoberta.
 */

export interface ProgressoDna {
  previsoesAvaliadas: number;
  mercadosTentados: number;
  mercadosCertos: number;
  pontos: number;
  estado: EstadoDna;
  /** 0 a 1, até ao primeiro perfil */
  fracao: number;
  faltam: number;
}

export function useProgressoDna(userId: string | undefined) {
  return useQuery({
    queryKey: ["dna-progresso", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async (): Promise<ProgressoDna> => {
      const { data } = await (supabase as any)
        .from("v_dna_progresso")
        .select("previsoes_avaliadas,mercados_tentados,mercados_certos,pontos")
        .eq("user_id", userId)
        .maybeSingle();

      const n = data?.previsoes_avaliadas ?? 0;
      return {
        previsoesAvaliadas: n,
        mercadosTentados: data?.mercados_tentados ?? 0,
        mercadosCertos: data?.mercados_certos ?? 0,
        pontos: data?.pontos ?? 0,
        estado: estadoDna(n),
        fracao: Math.min(1, n / MINIMO_PRIMEIRO_PERFIL),
        faltam: Math.max(0, MINIMO_PRIMEIRO_PERFIL - n),
      };
    },
  });
}

/**
 * Uma observação verdadeira sobre o estilo de escolha, disponível
 * antes de existirem resultados — porque se baseia no que a pessoa
 * escolheu, não no que acertou.
 *
 * Devolve null quando não há padrão que aguente ser afirmado.
 */
export function useObservacaoInicial(userId: string | undefined) {
  return useQuery({
    queryKey: ["dna-observacao", userId],
    enabled: !!userId,
    staleTime: 300_000,
    queryFn: async (): Promise<string | null> => {
      const db = supabase as any;

      const { data: meu } = await db
        .from("v_estilo")
        .select("previsoes_feitas,empates,casa,fora,com_exato,com_golos")
        .eq("user_id", userId)
        .maybeSingle();

      // Sem uma amostra mínima não se afirma nada
      if (!meu || meu.previsoes_feitas < 5) return null;

      const n = meu.previsoes_feitas;

      // Referência da comunidade, para não chamar "muito" ao que é normal
      const { data: todos } = await db
        .from("v_estilo")
        .select("previsoes_feitas,empates,casa,fora,com_exato");
      const linhas = (todos ?? []) as any[];
      const totalPrev = linhas.reduce((s, l) => s + l.previsoes_feitas, 0);

      const mediaEmpates = totalPrev > 0
        ? linhas.reduce((s, l) => s + l.empates, 0) / totalPrev : 0.25;
      const mediaExato = totalPrev > 0
        ? linhas.reduce((s, l) => s + l.com_exato, 0) / totalPrev : 0.5;

      const meusEmpates = meu.empates / n;
      const meuExato = meu.com_exato / n;
      const meuFora = meu.fora / n;
      const minhaCasa = meu.casa / n;

      // Por ordem de quão distintivo é o padrão
      if (meusEmpates >= mediaEmpates + 0.12)
        return "Já reparámos que escolhes empates com mais frequência do que a maioria.";
      if (minhaCasa >= 0.75)
        return "Até agora, apostas quase sempre na equipa da casa.";
      if (meuFora >= 0.4)
        return "Não tens medo de apostar nas equipas visitantes.";
      if (meuExato >= mediaExato + 0.25)
        return "Arriscas o resultado exato mais vezes do que a maioria.";
      if (meu.com_golos / n >= 0.9)
        return "Preenches sempre os mercados de golos — não deixas nada por dizer.";

      return null;
    },
  });
}

export interface Preferencias {
  dna_publico: boolean;
  talisma_publico: boolean;
  aceita_rival: boolean;
}

export function usePreferencias(userId: string | undefined) {
  return useQuery({
    queryKey: ["user-prefs", userId],
    enabled: !!userId,
    staleTime: 300_000,
    queryFn: async (): Promise<Preferencias> => {
      const { data } = await (supabase as any)
        .from("user_prefs")
        .select("dna_publico,talisma_publico,aceita_rival")
        .eq("user_id", userId)
        .maybeSingle();
      return data ?? { dna_publico: true, talisma_publico: true, aceita_rival: true };
    },
  });
}

export function useGuardarPreferencias(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: Partial<Preferencias>) => {
      const { error } = await (supabase as any)
        .from("user_prefs")
        .upsert({ user_id: userId, ...p, atualizado_em: new Date().toISOString() },
                { onConflict: "user_id" });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-prefs", userId] }),
  });
}

export interface ClubeFavorito {
  team_id: string | null;
  nome: string | null;
  crest_url: string | null;
  /** Já usou a alteração permitida esta época */
  jaAlterou: boolean;
  /** Nunca escolheu — a primeira vez não gasta a alteração */
  primeiraVez: boolean;
}

export function useClubeFavorito(userId: string | undefined) {
  return useQuery({
    queryKey: ["clube-favorito", userId],
    enabled: !!userId,
    staleTime: 300_000,
    queryFn: async (): Promise<ClubeFavorito> => {
      const db = supabase as any;

      const { data: epoca } = await db
        .from("seasons").select("id").eq("is_current", true).limit(1).maybeSingle();

      const { data: historico } = await db
        .from("user_favourite_team_history")
        .select("team_id,season_id,inicial,valido_ate")
        .eq("user_id", userId);

      const linhas = (historico ?? []) as any[];
      const emVigor = linhas.find(l => l.valido_ate === null);
      const jaAlterou = linhas.some(l => l.inicial === false && l.season_id === epoca?.id);

      let nome: string | null = null;
      let crest: string | null = null;
      if (emVigor?.team_id) {
        const { data: eq } = await db
          .from("teams").select("name,short_name,crest_url")
          .eq("id", emVigor.team_id).maybeSingle();
        nome = eq?.short_name ?? eq?.name ?? null;
        crest = eq?.crest_url ?? null;
      }

      return {
        team_id: emVigor?.team_id ?? null,
        nome, crest_url: crest,
        jaAlterou,
        primeiraVez: linhas.length === 0,
      };
    },
  });
}

export function useDefinirClubeFavorito(userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (teamId: string | null) => {
      const { data, error } = await (supabase as any)
        .rpc("definir_clube_favorito", { p_team_id: teamId });
      if (error) throw new Error(error.message);
      if (data && data.ok === false) throw new Error(data.erro);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clube-favorito", userId] });
      qc.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}

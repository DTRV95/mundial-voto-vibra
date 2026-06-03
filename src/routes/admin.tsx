import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import { toast } from "sonner";
import { PHASE_LABEL } from "@/lib/format";
import { Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Voz do Mundial" }] }),
  component: Admin,
});

function Admin() {
  const { user, loading } = useAuth();
  const isAdmin = useIsAdmin(user?.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { redirect: "/admin" } });
  }, [user, loading, navigate]);

  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="px-5 pt-10 text-center">
        <h1 className="font-display text-2xl">Acesso restrito</h1>
        <p className="text-sm text-muted-foreground">
          A tua conta ainda não tem permissões de admin. Pede ao administrador para te promover.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 pt-6 pb-6">
      <h1 className="mb-4 font-display text-3xl">Admin</h1>
      <Stats />
      <Tabs />
    </div>
  );
}

function Stats() {
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [users, votes, matches] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("predictions").select("id", { count: "exact", head: true }),
        supabase.from("matches").select("id", { count: "exact", head: true }),
      ]);
      return { users: users.count ?? 0, votes: votes.count ?? 0, matches: matches.count ?? 0 };
    },
  });
  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      <Stat label="Utilizadores" value={stats?.users ?? 0} />
      <Stat label="Previsões" value={stats?.votes ?? 0} />
      <Stat label="Jogos" value={stats?.matches ?? 0} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card/70 p-4 text-center">
      <div className="font-display text-2xl text-gold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}

function Tabs() {
  const [tab, setTab] = useState<"groups" | "teams" | "matches" | "prizes">("matches");
  const tabs = [
    { k: "matches", label: "Jogos" },
    { k: "teams", label: "Equipas" },
    { k: "groups", label: "Grupos" },
    { k: "prizes", label: "Prémios" },
  ] as const;
  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
              tab === t.k ? "border-gold bg-gold text-background" : "border-border bg-card/60 text-muted-foreground"
            }`}>{t.label}</button>
        ))}
      </div>
      {tab === "groups" && <GroupsAdmin />}
      {tab === "teams" && <TeamsAdmin />}
      {tab === "matches" && <MatchesAdmin />}
      {tab === "prizes" && <PrizesAdmin />}
    </>
  );
}

function GroupsAdmin() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { data: groups = [] } = useQuery({
    queryKey: ["admin", "groups"],
    queryFn: async () => (await supabase.from("groups").select("*").order("name")).data ?? [],
  });
  async function add() {
    if (!name.trim()) return;
    const { error } = await supabase.from("groups").insert({ name: name.trim() });
    if (error) toast.error(error.message); else { toast.success("Grupo criado"); setName(""); qc.invalidateQueries({ queryKey: ["admin", "groups"] }); }
  }
  async function del(id: string) {
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin", "groups"] });
  }
  return (
    <Section>
      <Row>
        <input placeholder="Grupo A" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        <button onClick={add} className={btnCls}><Plus className="h-4 w-4" /></button>
      </Row>
      <ul className="mt-3 space-y-2">
        {groups.map((g: any) => (
          <li key={g.id} className={rowItemCls}>
            <span className="font-medium">{g.name}</span>
            <button onClick={() => del(g.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function TeamsAdmin() {
  const qc = useQueryClient();
  const [name, setName] = useState(""); const [code, setCode] = useState(""); const [flag, setFlag] = useState(""); const [groupId, setGroupId] = useState<string>("");
  const { data: teams = [] } = useQuery({
    queryKey: ["admin", "teams"],
    queryFn: async () => (await supabase.from("teams").select("*,group:group_id(name)").order("name")).data ?? [],
  });
  const { data: groups = [] } = useQuery({
    queryKey: ["admin", "groups"],
    queryFn: async () => (await supabase.from("groups").select("*").order("name")).data ?? [],
  });
  async function add() {
    if (!name.trim()) return;
    const { error } = await supabase.from("teams").insert({ name: name.trim(), code: code || null, flag: flag || null, group_id: groupId || null });
    if (error) toast.error(error.message); else { toast.success("Equipa criada"); setName(""); setCode(""); setFlag(""); qc.invalidateQueries({ queryKey: ["admin", "teams"] }); }
  }
  async function del(id: string) {
    const { error } = await supabase.from("teams").delete().eq("id", id);
    if (error) toast.error(error.message); else qc.invalidateQueries({ queryKey: ["admin", "teams"] });
  }
  return (
    <Section>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        <input placeholder="POR" maxLength={3} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className={inputCls} />
        <input placeholder="🇵🇹" value={flag} onChange={(e) => setFlag(e.target.value)} className={inputCls} />
        <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className={inputCls}>
          <option value="">Sem grupo</option>
          {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>
      <button onClick={add} className={`${btnCls} mt-2 w-full justify-center`}><Plus className="h-4 w-4" /> Adicionar equipa</button>
      <ul className="mt-3 space-y-2">
        {teams.map((t: any) => (
          <li key={t.id} className={rowItemCls}>
            <span className="flex items-center gap-2"><span className="text-xl">{t.flag ?? "⚽"}</span>{t.name} <span className="text-xs text-muted-foreground">{t.group?.name ?? "—"}</span></span>
            <button onClick={() => del(t.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function MatchesAdmin() {
  const qc = useQueryClient();
  const [home, setHome] = useState(""); const [away, setAway] = useState("");
  const [kickoff, setKickoff] = useState(""); const [phase, setPhase] = useState("grupos");
  const { data: teams = [] } = useQuery({
    queryKey: ["admin", "teams"],
    queryFn: async () => (await supabase.from("teams").select("id,name").order("name")).data ?? [],
  });
  const { data: matches = [] } = useQuery({
    queryKey: ["admin", "matches"],
    queryFn: async () => (await supabase.from("matches")
      .select("id,kickoff_at,phase,voting_open,home_score,away_score,home:home_team_id(name),away:away_team_id(name)")
      .order("kickoff_at")).data ?? [],
  });
  async function add() {
    if (!home || !away || !kickoff) { toast.error("Preenche todos os campos"); return; }
    const { error } = await supabase.from("matches").insert({
      home_team_id: home, away_team_id: away, kickoff_at: new Date(kickoff).toISOString(), phase: phase as any,
    });
    if (error) toast.error(error.message); else { toast.success("Jogo criado"); qc.invalidateQueries({ queryKey: ["admin", "matches"] }); }
  }
  async function toggleVoting(id: string, current: boolean) {
    await supabase.from("matches").update({ voting_open: !current }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "matches"] });
  }
  async function setScore(id: string, h: number, a: number) {
    await supabase.from("matches").update({ home_score: h, away_score: a, status: "finished" }).eq("id", id);
    toast.success("Resultado registado"); qc.invalidateQueries({ queryKey: ["admin", "matches"] });
  }
  async function calcPoints(id: string) {
    const { error } = await supabase.rpc("calculate_match_points", { p_match_id: id });
    if (error) toast.error(error.message);
    else { toast.success("Pontos calculados!"); qc.invalidateQueries({ queryKey: ["admin", "matches"] }); }
  }
  async function del(id: string) {
    if (!confirm("Eliminar jogo?")) return;
    await supabase.from("matches").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "matches"] });
  }
  return (
    <Section>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select value={home} onChange={(e) => setHome(e.target.value)} className={inputCls}>
          <option value="">Casa</option>
          {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={away} onChange={(e) => setAway(e.target.value)} className={inputCls}>
          <option value="">Visitante</option>
          {teams.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <input type="datetime-local" value={kickoff} onChange={(e) => setKickoff(e.target.value)} className={inputCls} />
        <select value={phase} onChange={(e) => setPhase(e.target.value)} className={inputCls}>
          {Object.entries(PHASE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <button onClick={add} className={`${btnCls} mt-2 w-full justify-center`}><Plus className="h-4 w-4" /> Adicionar jogo</button>
      <ul className="mt-3 space-y-2">
        {matches.map((m: any) => (
          <li key={m.id} className="rounded-xl border border-border bg-card/60 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{m.home.name} vs {m.away.name}</span>
              <span className="text-xs text-muted-foreground">{new Date(m.kickoff_at).toLocaleString("pt-PT")}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-secondary px-2 py-0.5">{PHASE_LABEL[m.phase]}</span>
              <button onClick={() => toggleVoting(m.id, m.voting_open)}
                className={`rounded-full px-2 py-0.5 font-semibold ${m.voting_open ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                {m.voting_open ? "Votação aberta" : "Votação fechada"}
              </button>
              <ScoreSet match={m} onSubmit={(h, a) => setScore(m.id, h, a)} />
              {m.home_score != null && m.away_score != null && (
                <button onClick={() => calcPoints(m.id)}
                  className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary">
                  Calcular pts
                </button>
              )}
              <button onClick={() => del(m.id)} className="ml-auto text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function ScoreSet({ match, onSubmit }: { match: any; onSubmit: (h: number, a: number) => void }) {
  const [h, setH] = useState<number>(match.home_score ?? 0);
  const [a, setA] = useState<number>(match.away_score ?? 0);
  return (
    <span className="flex items-center gap-1">
      <input type="number" min={0} value={h} onChange={(e) => setH(Number(e.target.value))} className="w-12 rounded-md border border-border bg-input px-2 py-0.5 text-center" />
      <span>:</span>
      <input type="number" min={0} value={a} onChange={(e) => setA(Number(e.target.value))} className="w-12 rounded-md border border-border bg-input px-2 py-0.5 text-center" />
      <button onClick={() => onSubmit(h, a)} className="rounded-full bg-gold px-2 py-0.5 font-semibold text-background">OK</button>
    </span>
  );
}

function PrizesAdmin() {
  const qc = useQueryClient();
  const [phase, setPhase] = useState("grupos"); const [name, setName] = useState(""); const [desc, setDesc] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const { data: prizes = [] } = useQuery({
    queryKey: ["admin", "prizes"],
    queryFn: async () => (await supabase.from("prizes").select("*").order("phase")).data ?? [],
  });
  async function add() {
    if (!name.trim()) return;
    let image_url: string | null = null;
    if (file) {
      const path = `${Date.now()}-${file.name}`;
      const up = await supabase.storage.from("prizes").upload(path, file);
      if (up.error) { toast.error(up.error.message); return; }
      const { data: pub } = supabase.storage.from("prizes").getPublicUrl(path);
      image_url = pub.publicUrl;
    }
    const { error } = await supabase.from("prizes").insert({ phase: phase as any, name: name.trim(), description: desc || null, image_url });
    if (error) toast.error(error.message); else { toast.success("Prémio criado"); setName(""); setDesc(""); setFile(null); qc.invalidateQueries({ queryKey: ["admin", "prizes"] }); }
  }
  async function del(id: string) {
    await supabase.from("prizes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "prizes"] });
  }
  return (
    <Section>
      <div className="grid grid-cols-2 gap-2">
        <select value={phase} onChange={(e) => setPhase(e.target.value)} className={inputCls}>
          {Object.entries(PHASE_LABEL).filter(([k]) => k !== "final").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input placeholder="Nome do prémio" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </div>
      <textarea placeholder="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} className={`${inputCls} mt-2 min-h-[80px]`} />
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-2 text-xs" />
      <button onClick={add} className={`${btnCls} mt-2 w-full justify-center`}><Plus className="h-4 w-4" /> Adicionar prémio</button>
      <ul className="mt-3 space-y-2">
        {prizes.map((p: any) => (
          <li key={p.id} className={rowItemCls}>
            <span className="flex items-center gap-2">{p.image_url && <img src={p.image_url} className="h-10 w-10 rounded object-cover" />}<span><span className="block font-medium">{p.name}</span><span className="text-xs text-muted-foreground">{PHASE_LABEL[p.phase]}</span></span></span>
            <button onClick={() => del(p.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const inputCls = "rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:border-gold/60";
const btnCls = "inline-flex items-center gap-1 rounded-xl bg-gold px-3 py-2 text-sm font-semibold text-background";
const rowItemCls = "flex items-center justify-between rounded-xl border border-border bg-card/60 p-3 text-sm";

function Section({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card/40 p-4">{children}</div>;
}
function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-2">{children}</div>;
}

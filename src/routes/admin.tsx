import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useIsAdmin } from "@/lib/useAuth";
import { toast } from "sonner";
import { PHASE_LABEL } from "@/lib/format";
import { Plus, Trash2, MessageCircle, Mail, CheckCheck, Clock, Pencil } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Uma Geração" }] }),
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
  const [tab, setTab] = useState<"matches" | "analysis" | "news" | "teams" | "groups" | "prizes" | "suporte">("matches");

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["admin", "support-unread"],
    queryFn: async () => {
      const { count } = await supabase
        .from("support_messages")
        .select("id", { count: "exact", head: true })
        .eq("read", false);
      return count ?? 0;
    },
    refetchInterval: 60000,
  });

  const tabs = [
    { k: "matches",  label: "Jogos" },
    { k: "analysis", label: "ScoreLab" },
    { k: "news",     label: "Notícias" },
    { k: "teams",    label: "Equipas" },
    { k: "groups",   label: "Grupos" },
    { k: "prizes",   label: "Prémios" },
    { k: "suporte",  label: "Suporte", badge: unreadCount },
  ] as const;
  return (
    <>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`relative whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold ${
              tab === t.k ? "border-gold bg-gold text-background" : "border-border bg-card/60 text-muted-foreground"
            }`}>
            {t.label}
            {"badge" in t && t.badge > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-wc-red text-[9px] font-bold text-white">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>
      {tab === "matches"  && <MatchesAdmin />}
      {tab === "analysis" && <AnalysisAdmin />}
      {tab === "news"     && <NewsAdmin />}
      {tab === "groups"   && <GroupsAdmin />}
      {tab === "teams"    && <TeamsAdmin />}
      {tab === "prizes"   && <PrizesAdmin />}
      {tab === "suporte"  && <SuporteAdmin />}
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
  const [teamEditId, setTeamEditId] = useState<string | null>(null);
  const [teamEditForm, setTeamEditForm] = useState<{ name: string; code: string; flag: string; group_id: string }>({ name: "", code: "", flag: "", group_id: "" });
  const [teamPending, setTeamPending] = useState(false);
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
  function startTeamEdit(t: any) {
    setTeamEditId(t.id);
    setTeamEditForm({ name: t.name, code: t.code ?? "", flag: t.flag ?? "", group_id: t.group_id ?? "" });
  }
  async function saveTeamEdit(id: string) {
    setTeamPending(true);
    const { error } = await supabase.from("teams").update({
      name: teamEditForm.name.trim(),
      code: teamEditForm.code || null,
      flag: teamEditForm.flag || null,
      group_id: teamEditForm.group_id || null,
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Equipa actualizada!"); setTeamEditId(null); qc.invalidateQueries({ queryKey: ["admin", "teams"] }); }
    setTeamPending(false);
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
          <li key={t.id} className="rounded-xl border border-border bg-card/60 p-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2"><span className="text-xl">{t.flag ?? "⚽"}</span>{t.name} <span className="text-xs text-muted-foreground">{t.group?.name ?? "—"}</span></span>
              <div className="flex items-center gap-2">
                <button onClick={() => teamEditId === t.id ? setTeamEditId(null) : startTeamEdit(t)} className="text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => del(t.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            {teamEditId === t.id && (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <input placeholder="Nome" value={teamEditForm.name} onChange={e => setTeamEditForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                  <input placeholder="POR" maxLength={3} value={teamEditForm.code} onChange={e => setTeamEditForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} className={inputCls} />
                  <input placeholder="🇵🇹" value={teamEditForm.flag} onChange={e => setTeamEditForm(f => ({ ...f, flag: e.target.value }))} className={inputCls} />
                  <select value={teamEditForm.group_id} onChange={e => setTeamEditForm(f => ({ ...f, group_id: e.target.value }))} className={inputCls}>
                    <option value="">Sem grupo</option>
                    {groups.map((g: any) => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveTeamEdit(t.id)} disabled={teamPending} className={`${btnCls} flex-1 justify-center`}>
                    {teamPending ? "…" : "Guardar"}
                  </button>
                  <button onClick={() => setTeamEditId(null)} className="rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground">Cancelar</button>
                </div>
              </div>
            )}
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
    const kickoffDate = new Date(kickoff);
    const { error } = await supabase.from("matches").insert({
      home_team_id: home,
      away_team_id: away,
      kickoff_at: kickoffDate.toISOString(),
      phase: phase as any,
      voting_open: kickoffDate.getTime() > Date.now(),
    });
    if (error) toast.error(error.message); else { toast.success("Jogo criado"); qc.invalidateQueries({ queryKey: ["admin", "matches"] }); }
  }
  const [pending, setPending] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ kickoff_at: string; phase: string; home_score: string; away_score: string }>({ kickoff_at: "", phase: "grupos", home_score: "", away_score: "" });
  const [calcAllState, setCalcAllState] = useState<{ loading: boolean; result: string | null }>({ loading: false, result: null });

  function startEdit(m: any) {
    const dt = new Date(m.kickoff_at);
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setEditId(m.id);
    setEditForm({ kickoff_at: local, phase: m.phase, home_score: m.home_score ?? "", away_score: m.away_score ?? "" });
  }

  async function saveEdit(id: string) {
    setPending(`edit-${id}`);
    const { error } = await supabase.from("matches").update({
      kickoff_at: new Date(editForm.kickoff_at).toISOString(),
      phase: editForm.phase as any,
      home_score: editForm.home_score !== "" ? Number(editForm.home_score) : null,
      away_score: editForm.away_score !== "" ? Number(editForm.away_score) : null,
    }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Jogo actualizado!"); setEditId(null); qc.invalidateQueries({ queryKey: ["admin", "matches"] }); }
    setPending(null);
  }

  async function calcAllPoints() {
    setCalcAllState({ loading: true, result: null });
    const finished = (matches as any[]).filter((m: any) => m.home_score != null);
    let count = 0;
    for (const m of finished) {
      const { error } = await supabase.rpc("calculate_match_points", { p_match_id: m.id });
      if (!error) count++;
    }
    setCalcAllState({ loading: false, result: `${count} jogos calculados` });
    toast.success(`Pontos calculados para ${count} jogos`);
  }

  async function toggleVoting(id: string, current: boolean) {
    setPending(`vote-${id}`);
    await supabase.from("matches").update({ voting_open: !current }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "matches"] });
    setPending(null);
  }
  async function setScore(id: string, h: number, a: number) {
    setPending(`score-${id}`);
    await supabase.from("matches").update({ home_score: h, away_score: a, status: "finished" }).eq("id", id);
    toast.success("Resultado registado");
    qc.invalidateQueries({ queryKey: ["admin", "matches"] });
    setPending(null);
  }
  async function calcPoints(id: string) {
    setPending(`pts-${id}`);
    const { error } = await supabase.rpc("calculate_match_points", { p_match_id: id });
    if (error) toast.error(error.message);
    else { toast.success("Pontos calculados!"); qc.invalidateQueries({ queryKey: ["admin", "matches"] }); }
    setPending(null);
  }
  async function del(id: string) {
    if (!confirm("Eliminar jogo?")) return;
    setPending(`del-${id}`);
    await supabase.from("matches").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "matches"] });
    setPending(null);
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
      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={calcAllPoints}
          disabled={calcAllState.loading}
          className="inline-flex items-center gap-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-semibold text-primary disabled:opacity-50">
          {calcAllState.loading ? "A calcular…" : "Calcular todos os pontos"}
        </button>
        {calcAllState.result && <span className="text-xs text-muted-foreground">{calcAllState.result}</span>}
      </div>
      <ul className="mt-3 space-y-2">
        {matches.map((m: any) => (
          <li key={m.id} className="rounded-xl border border-border bg-card/60 p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{m.home?.name ?? "?"} vs {m.away?.name ?? "?"}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{new Date(m.kickoff_at).toLocaleString("pt-PT")}</span>
                <button onClick={() => editId === m.id ? setEditId(null) : startEdit(m)} className="text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            {editId === m.id && (
              <div className="mt-3 space-y-2 border-t border-border pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Kickoff</label>
                    <input type="datetime-local" value={editForm.kickoff_at} onChange={e => setEditForm(f => ({ ...f, kickoff_at: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Fase</label>
                    <select value={editForm.phase} onChange={e => setEditForm(f => ({ ...f, phase: e.target.value }))} className={inputCls}>
                      {Object.entries(PHASE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Golos Casa</label>
                    <input type="number" min={0} value={editForm.home_score} onChange={e => setEditForm(f => ({ ...f, home_score: e.target.value }))} className={inputCls} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Golos Fora</label>
                    <input type="number" min={0} value={editForm.away_score} onChange={e => setEditForm(f => ({ ...f, away_score: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => saveEdit(m.id)} disabled={pending === `edit-${m.id}`} className={`${btnCls} flex-1 justify-center`}>
                    {pending === `edit-${m.id}` ? "…" : "Guardar"}
                  </button>
                  <button onClick={() => setEditId(null)} className="rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground">Cancelar</button>
                </div>
              </div>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-secondary px-2 py-0.5">{PHASE_LABEL[m.phase]}</span>
              <button
                onClick={() => toggleVoting(m.id, m.voting_open)}
                disabled={!!pending}
                className={`rounded-full px-2 py-0.5 font-semibold disabled:opacity-50 ${m.voting_open ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}`}>
                {pending === `vote-${m.id}` ? "…" : m.voting_open ? "Votação aberta" : "Votação fechada"}
              </button>
              <ScoreSet match={m} onSubmit={(h, a) => setScore(m.id, h, a)} disabled={!!pending} />
              {m.home_score != null && m.away_score != null && (
                <button
                  onClick={() => calcPoints(m.id)}
                  disabled={!!pending}
                  className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-semibold text-primary disabled:opacity-50">
                  {pending === `pts-${m.id}` ? "…" : "Calcular pts"}
                </button>
              )}
              <button onClick={() => del(m.id)} disabled={!!pending} className="ml-auto text-destructive disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}

function ScoreSet({ match, onSubmit, disabled }: { match: any; onSubmit: (h: number, a: number) => void; disabled?: boolean }) {
  const [h, setH] = useState<number>(match.home_score ?? 0);
  const [a, setA] = useState<number>(match.away_score ?? 0);
  return (
    <span className="flex items-center gap-1">
      <input type="number" min={0} value={h} onChange={(e) => setH(Number(e.target.value))} disabled={disabled} className="w-12 rounded-md border border-border bg-input px-2 py-0.5 text-center disabled:opacity-50" />
      <span>:</span>
      <input type="number" min={0} value={a} onChange={(e) => setA(Number(e.target.value))} disabled={disabled} className="w-12 rounded-md border border-border bg-input px-2 py-0.5 text-center disabled:opacity-50" />
      <button onClick={() => onSubmit(h, a)} disabled={disabled} className="rounded-full bg-gold px-2 py-0.5 font-semibold text-background disabled:opacity-50">OK</button>
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

function AnalysisAdmin() {
  const qc = useQueryClient();
  const [matchId, setMatchId] = useState("");
  const [form, setForm] = useState({
    prob_home: 0, prob_draw: 0, prob_away: 0,
    prob_btts_yes: 0, prob_btts_no: 0,
    prob_over25: 0, prob_under25: 0,
    prob_over35: 0, prob_under35: 0,
    prob_1x: 0, prob_x2: 0,
    prob_combo15_1x_over: 0, prob_combo15_1x_under: 0, prob_combo15_x2_over: 0, prob_combo15_x2_under: 0,
    prob_combo35_1x_over: 0, prob_combo35_1x_under: 0, prob_combo35_x2_over: 0, prob_combo35_x2_under: 0,
  });

  const { data: matches = [] } = useQuery({
    queryKey: ["admin", "matches"],
    queryFn: async () => (await supabase.from("matches")
      .select("id,kickoff_at,home:home_team_id(name),away:away_team_id(name)")
      .order("kickoff_at")).data ?? [],
  });

  const { data: existing } = useQuery({
    queryKey: ["admin", "analysis", matchId],
    enabled: !!matchId,
    queryFn: async () => {
      const { data } = await supabase.from("match_analysis").select("*").eq("match_id", matchId).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (existing) setForm({ ...form, ...existing });
  }, [existing]);

  const set = (k: string, v: number) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!matchId) { toast.error("Seleciona um jogo"); return; }
    const payload = { match_id: matchId, ...form };
    const { error } = await supabase.from("match_analysis").upsert(payload, { onConflict: "match_id" });
    if (error) toast.error(error.message);
    else { toast.success("Análise ScoreLab guardada!"); qc.invalidateQueries({ queryKey: ["admin", "analysis", matchId] }); }
  }

  const markets = [
    { label: "Resultado 90 min", fields: [{ k: "prob_home", label: "Casa" }, { k: "prob_draw", label: "Empate" }, { k: "prob_away", label: "Fora" }] },
    { label: "Ambas marcam", fields: [{ k: "prob_btts_yes", label: "Sim" }, { k: "prob_btts_no", label: "Não" }] },
    { label: "Total 2.5", fields: [{ k: "prob_over25", label: "Mais 2.5" }, { k: "prob_under25", label: "Menos 2.5" }] },
    { label: "Total 3.5", fields: [{ k: "prob_over35", label: "Mais 3.5" }, { k: "prob_under35", label: "Menos 3.5" }] },
    { label: "Dupla hipótese", fields: [{ k: "prob_1x", label: "1X" }, { k: "prob_x2", label: "X2" }] },
    { label: "Combo 1.5", fields: [{ k: "prob_combo15_1x_over", label: "1X+Mais1.5" }, { k: "prob_combo15_1x_under", label: "1X+Menos1.5" }, { k: "prob_combo15_x2_over", label: "X2+Mais1.5" }, { k: "prob_combo15_x2_under", label: "X2+Menos1.5" }] },
    { label: "Combo 3.5", fields: [{ k: "prob_combo35_1x_over", label: "1X+Mais3.5" }, { k: "prob_combo35_1x_under", label: "1X+Menos3.5" }, { k: "prob_combo35_x2_over", label: "X2+Mais3.5" }, { k: "prob_combo35_x2_under", label: "X2+Menos3.5" }] },
  ];

  return (
    <Section>
      <p className="mb-3 text-xs text-muted-foreground">Insere as probabilidades do <span className="font-bold text-gold">ScoreLab</span> por mercado (valores em %).</p>
      <select value={matchId} onChange={(e) => setMatchId(e.target.value)} className={`${inputCls} w-full mb-4`}>
        <option value="">Selecionar jogo…</option>
        {matches.map((m: any) => (
          <option key={m.id} value={m.id}>{m.home?.name} vs {m.away?.name} — {new Date(m.kickoff_at).toLocaleDateString("pt-PT")}</option>
        ))}
      </select>

      {matchId && (
        <div className="space-y-4">
          {markets.map((mkt) => (
            <div key={mkt.label} className="rounded-xl border border-border bg-card/50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{mkt.label}</p>
              <div className="flex flex-wrap gap-2">
                {mkt.fields.map((f) => (
                  <label key={f.k} className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">{f.label}</span>
                    <input
                      type="number" min={0} max={100}
                      value={(form as any)[f.k]}
                      onChange={(e) => set(f.k, Number(e.target.value))}
                      className="w-16 rounded-lg border border-border bg-input px-2 py-1.5 text-center text-sm font-bold outline-none focus:border-gold/60"
                    />
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button onClick={save} className={`${btnCls} w-full justify-center`}>Guardar Análise ScoreLab</button>
        </div>
      )}
    </Section>
  );
}

function NewsAdmin() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("noticia");
  const [published, setPublished] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const { data: articles = [] } = useQuery({
    queryKey: ["admin", "news"],
    queryFn: async () => (await supabase.from("news").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  function reset() { setTitle(""); setExcerpt(""); setContent(""); setImageUrl(""); setCategory("noticia"); setPublished(false); setEditId(null); }

  function loadEdit(a: any) {
    setEditId(a.id); setTitle(a.title); setExcerpt(a.excerpt ?? ""); setContent(a.content ?? "");
    setImageUrl(a.image_url ?? ""); setCategory(a.category); setPublished(a.published);
  }

  async function save() {
    if (!title.trim()) { toast.error("Título obrigatório"); return; }
    const payload = { title, excerpt: excerpt || null, content: content || null, image_url: imageUrl || null, category, published };
    const { error } = editId
      ? await supabase.from("news").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", editId)
      : await supabase.from("news").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(editId ? "Artigo actualizado!" : "Artigo criado!");
    reset(); qc.invalidateQueries({ queryKey: ["admin", "news"] });
  }

  async function del(id: string) {
    if (!confirm("Eliminar artigo?")) return;
    await supabase.from("news").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "news"] });
  }

  async function togglePublish(id: string, current: boolean) {
    await supabase.from("news").update({ published: !current }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "news"] });
  }

  return (
    <Section>
      <p className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{editId ? "Editar artigo" : "Novo artigo"}</p>
      <div className="space-y-2">
        <input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} className={`${inputCls} w-full`} />
        <input placeholder="Resumo (excerpt)" value={excerpt} onChange={e => setExcerpt(e.target.value)} className={`${inputCls} w-full`} />
        <input placeholder="URL da imagem de capa" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className={`${inputCls} w-full`} />
        <div className="flex gap-2">
          <select value={category} onChange={e => setCategory(e.target.value)} className={`${inputCls} flex-1`}>
            <option value="noticia">Notícia</option>
            <option value="analise">Análise ScoreLab</option>
            <option value="antevisao">Antevisão</option>
            <option value="opiniao">Opinião</option>
          </select>
          <label className="flex items-center gap-2 rounded-xl border border-border bg-input px-3 py-2 text-sm cursor-pointer">
            <input type="checkbox" checked={published} onChange={e => setPublished(e.target.checked)} className="accent-gold" />
            Publicar
          </label>
        </div>
        <textarea placeholder="Conteúdo do artigo..." value={content} onChange={e => setContent(e.target.value)}
          className={`${inputCls} w-full min-h-[140px] resize-y`} />
        <div className="flex gap-2">
          <button onClick={save} className={`${btnCls} flex-1 justify-center`}>{editId ? "Actualizar" : "Criar artigo"}</button>
          {editId && <button onClick={reset} className="rounded-xl border border-border px-3 py-2 text-sm text-muted-foreground">Cancelar</button>}
        </div>
      </div>

      {articles.length > 0 && (
        <ul className="mt-4 space-y-2">
          {articles.map((a: any) => (
            <li key={a.id} className={rowItemCls}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">{a.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{a.category}</span>
                  <span className={`text-[10px] font-bold uppercase ${a.published ? "text-primary" : "text-muted-foreground"}`}>
                    {a.published ? "• Publicado" : "Rascunho"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                <button onClick={() => togglePublish(a.id, a.published)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${a.published ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"}`}>
                  {a.published ? "Despublicar" : "Publicar"}
                </button>
                <button onClick={() => loadEdit(a)} className="text-muted-foreground hover:text-foreground text-xs">Editar</button>
                <button onClick={() => del(a.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}

function SuporteAdmin() {
  const qc = useQueryClient();
  const { data: messages = [] } = useQuery({
    queryKey: ["admin", "support-messages"],
    queryFn: async () => {
      const { data } = await supabase
        .from("support_messages")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  async function markRead(id: string, read: boolean) {
    await supabase.from("support_messages").update({ read }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "support-messages"] });
    qc.invalidateQueries({ queryKey: ["admin", "support-unread"] });
  }

  async function del(id: string) {
    await supabase.from("support_messages").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin", "support-messages"] });
    qc.invalidateQueries({ queryKey: ["admin", "support-unread"] });
  }

  if (messages.length === 0) {
    return (
      <Section>
        <div className="py-8 text-center">
          <MessageCircle className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Sem mensagens de suporte.</p>
        </div>
      </Section>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((m: any) => (
        <div key={m.id} className={`rounded-2xl border p-4 ${m.read ? "border-border bg-card/40" : "border-wc-red/30 bg-wc-red/5"}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {!m.read && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-wc-red px-2 py-0.5 text-[9px] font-bold uppercase text-white">
                    <Clock className="h-2.5 w-2.5" /> Novo
                  </span>
                )}
                {m.subject && <p className="font-semibold text-sm">{m.subject}</p>}
                {m.email && (
                  <a href={`mailto:${m.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-wc-red transition-smooth">
                    <Mail className="h-3 w-3" /> {m.email}
                  </a>
                )}
              </div>
              <p className="text-sm text-foreground whitespace-pre-wrap">{m.message}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">
                {new Date(m.created_at).toLocaleString("pt-PT", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                {m.user_id && <span className="ml-2">· utilizador registado</span>}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <button
                onClick={() => markRead(m.id, !m.read)}
                title={m.read ? "Marcar como não lida" : "Marcar como lida"}
                className="grid h-7 w-7 place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground transition-smooth"
              >
                <CheckCheck className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => del(m.id)}
                className="grid h-7 w-7 place-items-center rounded-full border border-border text-muted-foreground hover:text-destructive transition-smooth"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
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

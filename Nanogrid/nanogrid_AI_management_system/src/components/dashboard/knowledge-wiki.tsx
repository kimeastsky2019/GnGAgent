/**
 * AI Knowledge Wiki 탭 — llmwiki × Nanogrid 통합 솔루션의 프론트엔드.
 *
 * 기획서 매핑:
 *  - 모니터링(/ng/monitor): KPI 카드 + 24h 실측/예측 오버레이 차트 + 이상 이벤트 + 최신 인사이트
 *  - 예측 랩(/ng/forecast): 모델 선택 → 학습/예측/평가 → MAPE/RMSE, 최적 모델 선택, 실험 이력
 *  - 인사이트 위키: 일간/주간/이벤트 문서 트리 + 검색 + 본문 열람
 *
 * 데이터 경로: 이 컴포넌트 → wiki-server(8720) /api/ng/* → TimescaleDB / forecast-svc
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Area, CartesianGrid, ComposedChart, Legend, Line,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Activity, BatteryCharging, BookOpen, Brain, FlaskConical,
  RefreshCw, Search, Sun, Zap,
} from "lucide-react";

const API = (import.meta as any).env?.VITE_NG_WIKI_API ?? "http://localhost:8720";

/* ---------------------------------------------------------------- helpers */

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

const fmt = (v: number | null | undefined, suffix = "", digits = 1) =>
  v === null || v === undefined ? "—" : `${Number(v).toFixed(digits)}${suffix}`;

const sevColor: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-300",
  warning: "bg-amber-100 text-amber-700 border-amber-300",
  info: "bg-sky-100 text-sky-700 border-sky-300",
};

/* -------------------------------------------------- minimal markdown view */

function MarkdownView({ md }: { md: string }) {
  const blocks = useMemo(() => md.split(/\n{2,}/), [md]);

  const inline = (s: string) =>
    s.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**"))
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("`") && part.endsWith("`"))
        return (
          <code key={i} className="rounded bg-slate-100 px-1 text-[0.85em] text-slate-800">
            {part.slice(1, -1)}
          </code>
        );
      return <span key={i}>{part}</span>;
    });

  const renderTable = (lines: string[], key: number) => {
    const rows = lines
      .filter((l) => !/^\|[\s:-]+\|/.test(l.replace(/\|/g, "|")))
      .filter((l) => !/^[|\s:-]+$/.test(l))
      .map((l) => l.split("|").slice(1, -1).map((c) => c.trim()));
    if (!rows.length) return null;
    const [head, ...body] = rows;
    return (
      <div key={key} className="my-2 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {head.map((h, i) => (
                <th key={i} className="border border-slate-200 bg-slate-50 px-2 py-1 text-left font-semibold">
                  {inline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} className="border border-slate-200 px-2 py-1">{inline(c)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-700">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter((l) => l.trim().length > 0);
        if (!lines.length) return null;
        if (lines.every((l) => l.trim().startsWith("|"))) return renderTable(lines, bi);
        return (
          <div key={bi} className="space-y-1">
            {lines.map((line, li) => {
              const t = line.trim();
              if (t.startsWith("### ")) return <h4 key={li} className="pt-1 text-sm font-bold text-slate-900">{inline(t.slice(4))}</h4>;
              if (t.startsWith("## ")) return <h3 key={li} className="pt-2 text-base font-bold text-slate-900">{inline(t.slice(3))}</h3>;
              if (t.startsWith("# ")) return <h2 key={li} className="text-lg font-bold text-slate-900">{inline(t.slice(2))}</h2>;
              if (t.startsWith("> ")) return <div key={li} className="border-l-4 border-amber-300 bg-amber-50 px-3 py-1 text-xs text-amber-800">{inline(t.slice(2))}</div>;
              if (/^[-*] /.test(t)) return <div key={li} className="flex gap-2 pl-1"><span className="text-slate-400">•</span><span>{inline(t.slice(2))}</span></div>;
              if (t.startsWith("|")) return renderTable([t], li);
              return <p key={li}>{inline(t)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ types */

interface KpiData {
  now: {
    ts: string; generation_kw: number; consumption_kw: number;
    battery_soc_pct: number | null; battery_power_kw: number;
    grid_import_kw: number; grid_export_kw: number; temp_c: number | null;
  };
  today: { gen_kwh: number | null; cons_kwh: number | null; import_kwh: number | null; export_kwh: number | null };
  self_consumption_pct: number | null;
  self_sufficiency_pct: number | null;
}

interface TsPoint {
  ts: string; generation_kw: number; consumption_kw: number;
  battery_soc_pct: number | null;
  forecast_generation_kw: number | null; forecast_consumption_kw: number | null;
}

interface NgEvent {
  id: number; ts: string; event_type: string; severity: string; title: string; detail: string | null;
}

interface WikiDocMeta { doc_id: string; title: string; period_start?: string; updated_at?: string; doc_type?: string; llm_provider?: string }
interface WikiGroup { type: string; label: string; count: number; docs: WikiDocMeta[] }
interface WikiDoc { doc_id: string; title: string; content_md: string; llm_provider: string; updated_at: string }

interface RunResult {
  model: string; target: string;
  metrics: { mape_pct: number | null; rmse: number; mae: number; n: number };
  series: { ts: string; actual: number; predicted: number }[];
  experiment_id?: number;
}

interface Experiment {
  id: number; target: string; model: string; created_at: string;
  metrics_json: { mape_pct: number | null; rmse: number; mae: number; n: number };
}

/* ---------------------------------------------------------------- monitor */

function MonitorPane({ onOpenDoc }: { onOpenDoc: (id: string) => void }) {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [points, setPoints] = useState<TsPoint[]>([]);
  const [events, setEvents] = useState<NgEvent[]>([]);
  const [latest, setLatest] = useState<WikiDocMeta[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [k, ts, ev, docs] = await Promise.all([
        getJson<KpiData>("/api/ng/kpi"),
        getJson<{ points: TsPoint[] }>("/api/ng/timeseries?hours=24"),
        getJson<NgEvent[]>("/api/ng/events?limit=8"),
        getJson<WikiDocMeta[]>("/api/ng/wiki/latest?limit=3"),
      ]);
      setKpi(k); setPoints(ts.points); setEvents(ev); setLatest(docs); setError(null);
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15000); // 기획서 §3-2: 15초 폴링
    return () => clearInterval(id);
  }, [refresh]);

  const chartData = useMemo(
    () => points.map((p) => ({
      ...p,
      time: new Date(p.ts).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    })),
    [points],
  );

  if (error)
    return (
      <Card><CardContent className="py-8 text-center text-sm text-slate-500">
        wiki-server({API}) 연결 실패 — knowledge_wiki 컨테이너 기동을 확인하세요.
        <div className="mt-2 text-xs text-red-400">{error}</div>
      </CardContent></Card>
    );

  const kpiCards = [
    { icon: Sun, label: "현재 발전", value: fmt(kpi?.now.generation_kw, " kW"), sub: `금일 ${fmt(kpi?.today.gen_kwh, " kWh")}`, color: "text-amber-500" },
    { icon: Zap, label: "현재 소비", value: fmt(kpi?.now.consumption_kw, " kW"), sub: `금일 ${fmt(kpi?.today.cons_kwh, " kWh")}`, color: "text-sky-500" },
    { icon: BatteryCharging, label: "배터리 SoC", value: fmt(kpi?.now.battery_soc_pct, "%"), sub: `${(kpi?.now.battery_power_kw ?? 0) >= 0 ? "방전" : "충전"} ${fmt(Math.abs(kpi?.now.battery_power_kw ?? 0), " kW")}`, color: "text-emerald-500" },
    { icon: Activity, label: "자가소비율", value: fmt(kpi?.self_consumption_pct, "%"), sub: `자립률 ${fmt(kpi?.self_sufficiency_pct, "%")}`, color: "text-purple-500" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpiCards.map((c) => (
          <Card key={c.label}>
            <CardContent className="flex items-center gap-3 p-4">
              <c.icon className={`h-8 w-8 ${c.color}`} />
              <div>
                <div className="text-xs text-slate-500">{c.label}</div>
                <div className="text-xl font-bold text-slate-900">{c.value}</div>
                <div className="text-xs text-slate-400">{c.sub}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">최근 24시간 — 발전/소비 실측 · 예측 오버레이</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={40} />
                <YAxis tick={{ fontSize: 11 }} unit=" kW" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Area dataKey="generation_kw" name="발전(실측)" stroke="#f59e0b" fill="#fde68a" fillOpacity={0.5} />
                <Area dataKey="consumption_kw" name="소비(실측)" stroke="#0ea5e9" fill="#bae6fd" fillOpacity={0.4} />
                <Line dataKey="forecast_generation_kw" name="발전(예측)" stroke="#b45309" strokeDasharray="5 3" dot={false} />
                <Line dataKey="forecast_consumption_kw" name="소비(예측)" stroke="#0369a1" strokeDasharray="5 3" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-4 w-4 text-purple-500" /> 최신 AI 인사이트
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {latest.length === 0 && <div className="text-sm text-slate-400">아직 생성된 인사이트가 없습니다.</div>}
              {latest.map((d) => (
                <button
                  key={d.doc_id}
                  onClick={() => onOpenDoc(d.doc_id)}
                  className="block w-full rounded-md border border-slate-200 bg-white p-2 text-left text-sm hover:bg-slate-50"
                >
                  <div className="font-medium text-slate-800 line-clamp-2">{d.title}</div>
                  <div className="text-xs text-slate-400">{d.doc_id}</div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">이상 이벤트</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {events.length === 0 && <div className="text-sm text-slate-400">이상 없음</div>}
              {events.map((e) => (
                <div key={e.id} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className={`shrink-0 ${sevColor[e.severity] ?? ""}`}>{e.severity}</Badge>
                  <div>
                    <div className="font-medium text-slate-800">{e.title}</div>
                    <div className="text-xs text-slate-400">
                      {new Date(e.ts).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- forecast */

const TARGET_LABELS: Record<string, string> = {
  consumption_kw: "수요(소비 전력)",
  generation_kw: "발전량",
  temp_c: "온도",
};

function ForecastPane() {
  const [models, setModels] = useState<{ key: string; label: string }[]>([]);
  const [target, setTarget] = useState("consumption_kw");
  const [model, setModel] = useState("seasonal_naive_24h");
  const [trainDays, setTrainDays] = useState("14");
  const [testHours, setTestHours] = useState("24");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [ranking, setRanking] = useState<{ model: string; metrics: RunResult["metrics"] }[] | null>(null);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadExperiments = useCallback(() => {
    getJson<Experiment[]>("/api/ng/forecast/experiments?limit=15")
      .then(setExperiments).catch(() => {});
  }, []);

  useEffect(() => {
    getJson<{ key: string; label: string }[]>("/api/ng/forecast/models")
      .then(setModels).catch((e) => setError(String(e)));
    loadExperiments();
  }, [loadExperiments]);

  const run = async () => {
    setRunning(true); setError(null); setRanking(null);
    try {
      const r = await postJson<RunResult>("/api/ng/forecast/run", {
        target, model, train_days: Number(trainDays), test_hours: Number(testHours),
      });
      setResult(r);
      loadExperiments();
    } catch (e) { setError(String(e)); } finally { setRunning(false); }
  };

  const selectBest = async () => {
    setRunning(true); setError(null);
    try {
      const r = await postJson<{ ranking: { model: string; metrics: RunResult["metrics"] }[]; best: string }>(
        "/api/ng/forecast/select_best",
        { target, train_days: Number(trainDays), test_hours: Number(testHours) },
      );
      setRanking(r.ranking);
      if (r.best) setModel(r.best);
      loadExperiments();
    } catch (e) { setError(String(e)); } finally { setRunning(false); }
  };

  const chartData = useMemo(
    () => (result?.series ?? []).map((p) => ({
      ...p,
      time: new Date(p.ts).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }),
    })),
    [result],
  );

  const mapeOk = result?.metrics.mape_pct != null && result.metrics.mape_pct <= 10;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <FlaskConical className="h-4 w-4 text-indigo-500" /> 예측 실험 설정 — 학습 → 예측 → 평가
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="w-44">
            <div className="mb-1 text-xs text-slate-500">예측 대상</div>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(TARGET_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-64">
            <div className="mb-1 text-xs text-slate-500">모델</div>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {models.map((m) => <SelectItem key={m.key} value={m.key}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-28">
            <div className="mb-1 text-xs text-slate-500">학습 기간(일)</div>
            <Input value={trainDays} onChange={(e) => setTrainDays(e.target.value)} />
          </div>
          <div className="w-28">
            <div className="mb-1 text-xs text-slate-500">평가 구간(시간)</div>
            <Input value={testHours} onChange={(e) => setTestHours(e.target.value)} />
          </div>
          <Button onClick={run} disabled={running}>
            {running ? <RefreshCw className="mr-1 h-4 w-4 animate-spin" /> : null} 실험 실행
          </Button>
          <Button variant="outline" onClick={selectBest} disabled={running}>최적 모델 선택</Button>
        </CardContent>
      </Card>

      {error && <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {result && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">예측 vs 실측 — {TARGET_LABELS[result.target]} · {result.model}</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 11 }} minTickGap={40} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line dataKey="actual" name="실측" stroke="#0ea5e9" dot={false} strokeWidth={2} />
                  <Line dataKey="predicted" name="예측" stroke="#e11d48" strokeDasharray="5 3" dot={false} strokeWidth={2} />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">평가 지표</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className={`rounded-lg border p-3 ${mapeOk ? "border-emerald-300 bg-emerald-50" : "border-amber-300 bg-amber-50"}`}>
                <div className="text-xs text-slate-500">MAPE (목표 ≤ 10%)</div>
                <div className="text-2xl font-bold">{fmt(result.metrics.mape_pct, "%", 2)}</div>
                <div className="text-xs">{mapeOk ? "성능지표 충족" : "성능지표 미충족"}</div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md bg-slate-50 p-2"><div className="text-xs text-slate-400">RMSE</div>{fmt(result.metrics.rmse, "", 3)}</div>
                <div className="rounded-md bg-slate-50 p-2"><div className="text-xs text-slate-400">MAE</div>{fmt(result.metrics.mae, "", 3)}</div>
                <div className="rounded-md bg-slate-50 p-2 col-span-2"><div className="text-xs text-slate-400">표본 수</div>{result.metrics.n}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {ranking && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">모델 랭킹 (MAPE 오름차순)</CardTitle></CardHeader>
          <CardContent>
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-slate-500">
                <th className="py-1">순위</th><th>모델</th><th>MAPE %</th><th>RMSE</th><th>MAE</th>
              </tr></thead>
              <tbody>
                {ranking.map((r, i) => (
                  <tr key={r.model} className={`border-b last:border-0 ${i === 0 ? "bg-emerald-50 font-semibold" : ""}`}>
                    <td className="py-1">{i + 1}</td><td>{r.model}</td>
                    <td>{fmt(r.metrics.mape_pct, "", 2)}</td>
                    <td>{fmt(r.metrics.rmse, "", 3)}</td>
                    <td>{fmt(r.metrics.mae, "", 3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">실험 이력 (ng.forecast_experiments)</CardTitle></CardHeader>
        <CardContent>
          {experiments.length === 0 && <div className="text-sm text-slate-400">실험 이력이 없습니다.</div>}
          {experiments.length > 0 && (
            <table className="w-full text-sm">
              <thead><tr className="border-b text-left text-xs text-slate-500">
                <th className="py-1">#</th><th>대상</th><th>모델</th><th>MAPE %</th><th>RMSE</th><th>실행 시각</th>
              </tr></thead>
              <tbody>
                {experiments.map((e) => (
                  <tr key={e.id} className="border-b last:border-0">
                    <td className="py-1">{e.id}</td>
                    <td>{TARGET_LABELS[e.target] ?? e.target}</td>
                    <td>{e.model}</td>
                    <td>{fmt(e.metrics_json?.mape_pct, "", 2)}</td>
                    <td>{fmt(e.metrics_json?.rmse, "", 3)}</td>
                    <td className="text-xs text-slate-400">{new Date(e.created_at).toLocaleString("ko-KR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------- wiki */

function WikiPane({ openDocId, onOpened }: { openDocId: string | null; onOpened: () => void }) {
  const [tree, setTree] = useState<WikiGroup[]>([]);
  const [doc, setDoc] = useState<WikiDoc | null>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<WikiDocMeta[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTree = useCallback(() => {
    getJson<WikiGroup[]>("/api/ng/wiki/tree").then(setTree).catch((e) => setError(String(e)));
  }, []);

  const openDoc = useCallback((id: string) => {
    getJson<WikiDoc>(`/api/ng/wiki/doc/${id}`).then(setDoc).catch((e) => setError(String(e)));
  }, []);

  useEffect(() => { loadTree(); }, [loadTree]);
  useEffect(() => {
    if (openDocId) { openDoc(openDocId); onOpened(); }
  }, [openDocId, openDoc, onOpened]);

  const doSearch = async () => {
    if (!q.trim()) { setResults(null); return; }
    try {
      const r = await getJson<{ results: WikiDocMeta[] }>(`/api/ng/wiki/search?q=${encodeURIComponent(q)}`);
      setResults(r.results);
    } catch (e) { setError(String(e)); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="인사이트 검색…" value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && doSearch()} />
          <Button variant="outline" size="icon" onClick={doSearch}><Search className="h-4 w-4" /></Button>
        </div>

        {results && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">검색 결과 {results.length}건</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              {results.map((d) => (
                <button key={d.doc_id} onClick={() => openDoc(d.doc_id)}
                  className="block w-full rounded p-2 text-left text-sm hover:bg-slate-50">
                  <div className="font-medium text-slate-800 line-clamp-1">{d.title}</div>
                  <div className="text-xs text-slate-400">{d.doc_id}</div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {tree.map((g) => (
          <Card key={g.type}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm">
                <span>{g.label}</span>
                <Badge variant="secondary">{g.count}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-56 space-y-1 overflow-y-auto">
              {g.docs.length === 0 && <div className="text-xs text-slate-400">문서 없음</div>}
              {g.docs.map((d) => (
                <button key={d.doc_id} onClick={() => openDoc(d.doc_id)}
                  className={`block w-full rounded p-2 text-left text-sm hover:bg-slate-50 ${doc?.doc_id === d.doc_id ? "bg-indigo-50" : ""}`}>
                  <div className="font-medium text-slate-800 line-clamp-1">{d.title}</div>
                  <div className="text-xs text-slate-400">{d.doc_id} · {d.llm_provider}</div>
                </button>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-emerald-600" />
            {doc ? doc.title : "문서를 선택하세요"}
          </CardTitle>
          {doc && (
            <div className="text-xs text-slate-400">
              {doc.doc_id} · 생성: {doc.llm_provider} · 갱신 {new Date(doc.updated_at).toLocaleString("ko-KR")}
            </div>
          )}
        </CardHeader>
        <CardContent className="max-h-[36rem] overflow-y-auto">
          {error && <div className="mb-2 text-xs text-red-500">{error}</div>}
          {doc
            ? <MarkdownView md={doc.content_md} />
            : <div className="py-16 text-center text-sm text-slate-400">
                좌측 트리 또는 검색에서 인사이트 문서를 선택하면 본문이 표시됩니다.<br />
                문서는 insight-worker 가 매일 자동 발행합니다 (사실은 SQL이, 서술은 LLM이).
              </div>}
        </CardContent>
      </Card>
    </div>
  );
}

/* ------------------------------------------------------------------ shell */

const SUB_TABS = [
  { key: "monitor", label: "나노그리드 모니터링" },
  { key: "forecast", label: "시계열 예측 랩" },
  { key: "wiki", label: "인사이트 위키" },
] as const;

const KnowledgeWiki = () => {
  const [sub, setSub] = useState<(typeof SUB_TABS)[number]["key"]>("monitor");
  const [pendingDoc, setPendingDoc] = useState<string | null>(null);

  const openDocFromMonitor = (id: string) => {
    setPendingDoc(id);
    setSub("wiki");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {SUB_TABS.map((t) => (
          <button key={t.key} onClick={() => setSub(t.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              sub === t.key
                ? "bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}>
            {t.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-400">
          지식DB: TimescaleDB(ng.*) · 서술: LLM (사실/서술 분리)
        </span>
      </div>

      {sub === "monitor" && <MonitorPane onOpenDoc={openDocFromMonitor} />}
      {sub === "forecast" && <ForecastPane />}
      {sub === "wiki" && <WikiPane openDocId={pendingDoc} onOpened={() => setPendingDoc(null)} />}
    </div>
  );
};

export default KnowledgeWiki;

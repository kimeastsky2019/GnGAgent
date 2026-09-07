# NanoGrid Energy Knowledge Loop Platform — Development Report

> Written 2026-09-07 · GnG International · Period: platform integration kickoff through Year-1 launch
> Reference deployment: https://nanogrid.gngmeta.com (build stamp `build 2026-09-07 · 4tab+ESS`)
> Governing plans: [Plan v0.2](01_Plan_v0.2_Knowledge_Flywheel.md) · [Three-Year R&D Plan v1.0](02_3Year_RnD_Plan_v1.0.md)

## 1. Summary

llmwiki (source-analysis wiki) and nanogrid_AI_management_system (energy operations) were
integrated into a single **Energy Knowledge Loop Platform**, implementing Plan v0.2's
four-tab flywheel (**① Source Code → ② Data Build → ③ Knowledge Database → ④ LLM
Training**) on the production server. The design principle throughout is
**"facts from SQL, narrative from LLM"** — figures and facts always come from DB/parser
sources; the LLM narrates on top of them.

Year-1 launch items are live: the **full loop completed one cycle** on 2026-09-07 —
training-pair capture → golden promotion → CES measurement (weekly cron) → L2 model-change
proposal → human approval → day-ahead publishing (details in §6).

## 2. System Architecture

### 2.1 Deployment (nanogrid.gngmeta.com = 210.206.73.80)

```
[Browser] ─ https ─▶ host nginx (JWT login gate: /login + auth_request)
                        │ proxy
                        ▼
                 v2g_web :8000  (gateway nginx + static frontends at /srv)
                  ├─ /api/ng/*   ─▶ v2g_portal_api :8720  (ngwiki wiki-server)
                  ├─ /api/gov/*  ─▶ v2g_gov_api   :3001  (AI-Gov)
                  ├─ /api/wiki/* ─▶ v2g_llmwiki   :8722  (source-analysis engine)
                  └─ /(static)    = apps/wiki portal (+ /nanogrid /gov /shell sub-apps)
     v2g_forecast :8801 (forecasting)  v2g_insight (insight worker)  v2g_ingest (collection)
     v2g_db :5433 (TimescaleDB — ng.* schema, 24 tables)
```

- **Cache policy**: HTML `Cache-Control: no-cache`, hashed assets cached 7 days —
  a structural fix for "deployed but the screen didn't change". A **build stamp** is
  permanently shown in the sidebar.
- **Auth**: server-side JWT gate (nginx `auth_request` + auth router). Passwords and API
  keys live only in the server `.env` — never in the repository or chat.
- **DB stabilization**: boot failure after reboot (auto-tuned `shared_buffers` 12GB OOM)
  fixed with explicit `shared_buffers=1GB` + `restart: unless-stopped`.
- **Backups**: daily DB dump cron (03:30).

### 2.2 Repositories

| Repo/path | Content |
|---|---|
| GnGAgent `Nanogrid/knowledge_wiki/` | ngwiki module (incl. this document) — DB schema, server routers, insight/ingest/forecast |
| GnGAgent branch `feat/v2g-nanogrid-integration` (local `Nanogrid_llmwiki/v2g_nanogrid`) | Integrated stack (gateway, apps, services) dev copy — kept in sync with server `~/v2g_nanogrid` |
| LLMWiki `feature/nanogrid-portal` | Source-analysis engine + portal frontend (Python parsers, projects API) |

## 3. Results by Tab

### ① Source Code — the platform analyzes its own source

- LLMWiki engine upgraded to `feature/nanogrid-portal`: **project registration API**
  (`POST /api/projects` → auto-parse → activate), Python parsers (`python.py`, `pydata.py`),
  Java/XML parsers, scan-root isolation (`server.browse_roots`; repository mounted
  read-only into the container).
- **Demonstrated on ourselves**: the platform's own source (v2g_nanogrid) was registered —
  **25 programs parsed, 25 specifications auto-generated with Grok** — browsable in the
  "① Source Code" tab. Parser output (facts) and LLM narration remain separated.

### ② Data Build — monitoring, demand, solar, V2G fleet, ESS

- TimescaleDB `ng.*` schema, 24 tables: measurements, forecasts (`forecasts`,
  `forecast_experiments`), devices/chargers (`devices`, `ev_chargers`),
  API registrations, training (`training_pairs`, `golden_questions`, `ces_runs/scores`),
  approvals (`approval_queue`), regulation (`gov_*`), etc.
- Collection: simulator always-on + **SP-G MQTT collector** implemented (set
  `SPG_MQTT_HOST` when the gateway is ready; real measurements UPSERT over simulator rows).
- Forecasting: forecast-svc — model backtests (`forecast_experiments`) and day-ahead publishing.
- Dashboards: Monitoring · Demand Management · Solar Plant Management · V2G Fleet
  (discharge schedule / revenue simulation / battery degradation) · **ESS** (SoC/SoH,
  charge/discharge, BMS·PCS API registration) — each screen embeds a data-source API
  registration UI.

### ③ Knowledge Database — knowledge engineering

- Insight pipeline: daily/weekly/event documents auto-published. Every figure preserved in
  `facts_json` (SQL source) for narrative cross-checking (KO/EN).
- **Automation-rate gauge**: 7-day auto vs human-intervention ratio permanently on the
  Knowledge DB screen (the Year-1 Track-A "measurable AI-employee regime" evidence device).
- Knowledge search (RAG-lite), wiki methodology, and insight document browsing.

### ④ LLM Training — pair capture · golden set · CES · approval queue

- **Training-pair pipeline**: every chatbot exchange stored to `training_pairs`
  (`POST /learn/pairs`, usable by external UIs too). Chatbot buttons —
  **Approve / Reject / ★Promote to Golden** — only approved pairs train; promoted pairs
  are permanently excluded from training (`human_approval='golden'` contamination guard).
- **Golden set**: 12 Claude-authored seed items + chat promotions = 13 approved items.
  The hold-out principle (never in training data) is enforced at the schema level.
- **CES measurement** (`POST /learn/ces/run`): judge chain Claude → Grok → stub.
  Official CES accepts the Claude judge only (`official` flag); Grok-judged runs are
  labeled advisory. Four-axis rubric (accuracy, grounding, completeness, safety).
- **sLM training dashboard**: automation/CES donuts, CES run button, golden/pair counts,
  approval queue (approve/reject, L2 level chips).
- LLM provider: production uses **Grok** (xAI, `XAI_API_KEY` in server .env only) —
  Claude reserved for benchmark/judge roles (cost policy). RAG search and AI-Gov
  (statute upload → analysis → checklist, registered to the L1 post-audit queue) included.

## 4. Autonomy Levels (L0–L3) — implementation status

| Level | Implementation | Status |
|---|---|---|
| L0 | Source parsing, data collection, search | Always-on |
| L1 | Insight publishing, spec generation, day-ahead forecasts → `approval_queue` post-audit | Live (AI-Gov analyses also queued) |
| L2 | **Forecast model-change loop**: weekly backtests → best-model proposal → approval queue → on approval, swap and publish | Live — first cycle completed (§6) |
| L3 | Equipment control, production deploys, final regulatory rulings | Human-only (Year-3 partial-delegation experiment planned) |

**Weekly automation crons** (KST Monday morning): CES measurement (08:05) ·
model-change proposal (08:20) · daily DB backup (03:30).

## 5. Metrics (as of 2026-09-07)

| Metric | Current | Year-1 target | Notes |
|---|---|---|---|
| CES (advisory, Grok judge) | **0.662** (13 items) | ≥ 0.70 (official) | Trend 0.185→0.358→0.604→0.642→0.662. Official measurement switches on automatically once `ANTHROPIC_API_KEY` is registered |
| CES axes (of 5) | accuracy 3.08 · grounding 3.62 · completeness 2.46 · safety 4.08 | — | Weakness = completeness → expected to improve as the knowledge DB grows |
| Golden set | 13 approved items | 500 items | Chat-promotion path live |
| Demand-forecast MAPE | **2.73%** (hourly_profile) | ≤ 10% | Pre-swap seasonal_naive: 18.97% |
| L2 agent proposals | 1 proposed → 1 approved (100%) | approval ≥ 60% | Sample of one — needs accumulation |
| Source analysis | 25 programs · 25 specs · 24 tables | — | Self-analysis demonstrated |

## 6. Milestone — first full flywheel cycle (2026-09-07)

1. Chatbot exchange → training pair captured → promoted to golden (③→④)
2. CES measured on the 13-item golden set — 0.662 (④)
3. The agent proposed a model change (L2) from backtests: seasonal_naive (MAPE 18.97%) →
   hourly_profile (2.73%) (②→④)
4. **Human approval** (approval queue, decided_by recorded)
5. The system swapped the model immediately and auto-published 96 day-ahead points for the
   next day (④→②)

The core loop of Plan v0.2 — agents propose, humans approve on evidence, the system
executes and records — is now proven with operational data.

## 7. Key Issues and Resolutions

| Issue | Cause | Resolution |
|---|---|---|
| DB down 3 days | VM RAM reduced (47→11GB); auto-tuned `shared_buffers` 12GB → OOM | Explicit `shared_buffers=1GB` + restart policy |
| CES accuracy = 0 | Chat prompt forbade answers outside context → conceptual items failed | Separate CES system prompt (domain knowledge allowed) — 35.8%→60.4% |
| Deploys not visible | Uncached-header index.html + long-lived SPA tabs | no-cache headers + build stamp + long-cache hashed assets |
| Grok model-name mismatch | Per-key allowed-model lists differ per container | Per-container model env cleanup (llmwiki uses config default) |
| Broken Korean on login | Missing charset | meta charset + nginx `charset utf-8` |
| Local↔server source drift | Accumulated direct server patches | Server→local back-sync (10 files) + sync-after-patch rule established |

## 8. Remaining Work (in order of readiness)

1. **Official CES switch** — register `ANTHROPIC_API_KEY` in the server `.env`
   (user action). The weekly cron switches to the Claude judge automatically.
2. **Golden-set growth** — make chatbot ★promotion routine; 100 → 500 items.
3. **SP-G real-measurement switch** — set `SPG_MQTT_HOST` (critical path, once the gateway is ready).
4. Accumulate L2 proposals — approval/revision rates as quarterly watch indicators.
5. Accumulate approved training_pairs → prepare Year-2 SFT.

---
*Every figure in this report can be re-queried from the operational DB (ng.* tables) and
CES run records — facts from SQL, narrative from LLM.*

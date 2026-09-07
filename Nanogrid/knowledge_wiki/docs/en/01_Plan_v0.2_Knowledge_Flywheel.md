# NanoGrid AI System — Revised Plan v0.2: An Energy AI Platform That Develops and Verifies Itself

> Revision v0.2 · 2026-09-07 · GnG International · Energy Knowledge Loop Platform
> Written against the deployed build at nanogrid.gngmeta.com

Agents drive a **closed loop** — source code → data → knowledge → training — while humans
perform only **approval and audit**. The final goal: within three years, the in-house sLM
reaches **Claude-level answers in the energy domain (CES ≥ 0.9)**.

**Key changes, v0.1 → v0.2**

- Linear pipeline redefined as a **closed loop (flywheel)** — outputs of ④ Training feed back into ①②③
- New evaluation system — **CES (Claude Equivalence Score), with Claude as benchmark, teacher, and judge**
- Autonomy levels L0–L3 with an explicit **human-approval boundary**
- "Today's logs are tomorrow's training data" — the training-data pipeline starts in Year 1
- Annual KPIs, infrastructure (GPU/backup) plan, and a trust-chain UX added

## 1. Platform Structure — Four Tabs

Each tab is not a standalone feature but **one stage of the loop**. Every tab carries a
machine-checkable **acceptance criterion**. No automation without a criterion.

| Tab | Features | Current assets | Acceptance criteria (machine-checkable) |
|---|---|---|---|
| **① Source Code** (NanoGrid source analysis) | Auto-generated program specs, table/query analysis, regulatory compliance checks | llmwiki source analysis (parsers + doc generation) | Factual items match parser output 100% · spec coverage % |
| **② Data Build** (monitoring · forecasting) | Real measurements (SP-G/simulator), EV chargers, time-series forecast lab | ngwiki (TimescaleDB `ng.*`, forecast-svc) | Demand forecast MAPE ≤ 10% · 24h missing-data rate ≤ 2% |
| **③ Knowledge Database** (LLMWiki · knowledge engineering) | Insight wiki (daily/weekly/event), diagnosis-report knowledge, search | insight pipeline (facts_json preserved, KO/EN) | Every figure matches `facts_json` (SQL source) · citation rate 100% |
| **④ LLM Training** (in-house AI) | RAG search, AI-Gov, chatbot simulator, sLM training | rag_search_api, factgate, in-house sLLM (qwen3:32b) | **CES** (§3) · hallucination rate · citation rate |

## 2. The Closed Loop — a Flywheel, Not a Pipeline

Develop from the code understood in ①, verify with the data of ②, turn it into knowledge
via **knowledge engineering** in ③, and train the sLM on that knowledge in ④. So far this
matches v0.1. The heart of v0.2 is the **returning arrow**: the trained sLM is re-deployed
into ①'s spec writing, ③'s insight narration, and ②'s forecast commentary — and those
outputs become training data again. Without this feedback the loop turns once and stops.

```
 ① Source Code ──(verify with data)──▶ ② Data Build
      ▲                                     │
 (code improvement)  [human approval/audit]  │
      │               L3 GATE               ▼
 ③ Knowledge DB ◀──(knowledge-ize)── ④ LLM Training
      ▲                                     │
      └──── sLM re-deployment (feedback) ───┘
```

## 3. Evaluation — Claude Is the Baseline

The in-house sLM's goal is **"Claude-level answers in the energy domain."**
Claude is therefore fixed in three roles.

| Role | Description | Output |
|---|---|---|
| **Benchmark** | Claude's answers to the same golden set define the full score | Reference answer set (version-pinned, recorded) |
| **Teacher** | Claude answers distilled as labels — only human-approved pairs become SFT data | `training_pairs` (§5) |
| **Judge** | Blind comparison of sLM vs reference answers (accuracy, citation, completeness, safety) | CES report (weekly, automated) |

### CES — Claude Equivalence Score

**CES = (sLM score total) / (Claude score total)** on the same golden set with the same
rubric. 1.0 means parity; ≥ 0.9 is the Year-3 target.

- **Golden set**: per-tab items — source-analysis Q&A, operational-data interpretation,
  regulatory judgments, forecast commentary, field chatbot queries. Only human-reviewed
  items enter the golden set. Y1 target: 500 items.
- **Four scoring axes**: factual accuracy (full marks only if checkable against SQL/parser
  sources) · citation of evidence · completeness · safety (does it say "I don't know"?).

**Claude-as-Judge pitfalls — controlled from day one**

- **Self-style bias**: the judge may prefer its own style → rubric scoring (0–5 per axis),
  no style axis, blind and order-randomized.
- **No contamination**: golden items never enter training data (hold-out). 20% of items
  rotated every quarter.
- **Version pinning**: record benchmark/judge Claude versions; on version change, re-score
  the whole golden set to recalibrate.
- **Human sampling audit**: humans re-check 5% of scores weekly; judge–human disagreement
  is tracked as its own KPI.

## 4. Autonomy Levels and the Human-Approval Boundary

Principle: **reading and analysis are automatic; anything that changes the physical world
or production requires human approval.** Every agent action is audit-logged; deployments
must be one-click revertible.

| Level | Action | Control | Examples |
|---|---|---|---|
| **L0** | Read · analyze · query | Fully automatic | Source parsing, data collection, RAG search |
| **L1** | Generate documents · forecasts | Automatic + post-hoc sampling audit | Insight publishing, spec generation, day-ahead forecasts |
| **L2** | Code changes · model swaps | Auto-generated → **applied after human approval** | Agent PRs, forecast model swap, sLM checkpoint promotion |
| **L3** | Equipment control · production deploys · final regulatory judgments | **Human approval required** + audit log + rollback SLA | EV charging/battery dispatch, server deploys, final AI-Gov rulings |

**Resolving self-reference** — AI-Gov, which judges regulation, is itself audited by humans
quarterly, outside the automation loop (sample re-checks + citation verification).
The seat that judges the judge is always human.

## 5. Training-Data Pipeline — Today's Logs Are Tomorrow's Training Data

To run SFT in Year 2, logs must be captured in trainable form from Year 1. A new
`ng.training_pairs` table stores every platform interaction as an **instruction pair**.

| Field | Content |
|---|---|
| `question / context` | User/agent query and evidence (insight, SQL, statute citations) |
| `answer` | Answer from Claude (teacher) or the sLM |
| `verdict` | Judge scores per axis |
| `human_approval` | approve/edit/reject — **only approved pairs are used for training** |
| `source_tab / model_ver` | Originating tab, generating model version (reproducibility) |

Sources: chatbot simulator conversations, insight generation requests/results, AI-Gov
judgment logs, source-analysis Q&A, forecast commentary. PII masked before storage
(per AI-Gov checklist).

**Volume targets**: Y1 10K approved pairs · Y2 100K (incl. SP-G real-measurement switch)
· Y3 300K. The real-measurement switch is the critical path — simulator data alone leaves
a domain sLM weak on field questions.

## 6. Three-Year Roadmap and KPIs

| | Y1 · 2027 "Foundation" | Y2 · 2028 "Distillation" | Y3 · 2029 "Autonomy" |
|---|---|---|---|
| **Training strategy** | RAG + general sLM (knowledge DB as context) | SFT/LoRA (Claude distillation + own approved logs) | Domain sLM (continuous energy-specific retraining) |
| **Automation** | L1 routine (auto document/forecast publishing) | L2 live (agent PR → human-approved deploy) | Loop runs autonomously; humans do L3 approvals + weekly audit |
| **Data** | Golden set 500 · logging pipeline live · SP-G real measurements | 100K approved pairs · multi-site expansion | Automated user testing (persona tests via chatbot simulator) |
| **CES** | ≥ 0.60 | ≥ 0.80 | **≥ 0.90** |
| **Automation rate** | 40% | 70% | 90% |
| **Human interventions** | — | ≤ 20/week | ≤ 5/week |
| **Operational quality** | MAPE ≤ 10% · missing ≤ 2% | MAPE ≤ 8% | MAPE ≤ 7% · zero L3 incidents |

Automation rate = share of pipeline stages completed without human intervention.
Judge–human disagreement (< 10%) is a common auxiliary KPI across all years.

## 7. Infrastructure and the Trust Chain

### Infrastructure

- **GPU**: current cloud 6090 ×1 (serving) → Y2 cloud burst/rental for training →
  Y3 on-prem serving (mini-PC/new models) considered. Training and serving separated.
- **Backup/DR**: remove single-server SPOF — daily DB dumps + off-site copies, mandatory
  git remote mirrors, quarterly recovery drills. (Prevents recurrence of one git corruption
  and two demo-DB losses.)
- **Audit log**: every agent action, approval, and deploy in an immutable log — the
  foundation for AI-Gov audits and CES reproducibility.

### Trust-chain UX

An **evidence link** running through all four tabs makes this a "trustworthy in-house AI":
chatbot answer → supporting insight document → source SQL facts → source code. From any
screen, one click descends one level of evidence. Persona-specific home screens
(operator/executive/developer) split in Y2.

## 8. Immediate Next Sprint

1. **Golden set v0 — 100 items**: 25 per tab. Claude reference answers → human review →
   hold-out fixed. First CES run baselines the current sLLM (qwen3:32b).
2. **training_pairs logging live**: hooks into chatbot, insight, and AI-Gov paths.
   New schema + approval flags. It must accumulate now for Y2 to be possible.
3. **Approval gate v0**: an approval-queue screen in Wiki Admin — agent output diff →
   approve/edit/reject, everything audit-logged.
4. **Automated server backups**: daily DB dump cron + off-site, git mirrors.
   The precondition for the three-year picture.

---
*NanoGrid AI System · Revised Plan v0.2 · Based on v0.1 (llmwiki × Nanogrid integration
plan) + the 2026-09-07 critical review*

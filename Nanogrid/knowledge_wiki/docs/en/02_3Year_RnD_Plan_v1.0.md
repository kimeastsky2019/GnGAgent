# Autonomous Energy AI — Three-Year R&D Plan v1.0

> Three-Year R&D Plan · v1.0 · 2026-09-08 · GnG International · NanoGrid AI System · Integrates Plan v0.2

**Final goal** — By the end of Year 3, complete an **autonomous research agent** that
researches, develops, and verifies on its own in the energy domain, and an
**in-house sLM with Claude-level answers (CES ≥ 0.90)**; commercially demonstrate the
**explainable EMS platform** carrying them across multiple sites.
Humans perform only approval and audit.

## 1. Background and Rationale

The frontier AI companies' timeline concentrates on the next five years — AI as employees
(agents), automation of AI research, mass replication of top-level intelligence, migration
of organizational decision rights, and physical AI. The **physical bottleneck that remains
explicit in this unfolding is electric power**. For an energy company, this future is two
opportunities.

- **Market** — AI datacenters, robot factories, and EV fleets are all large power loads.
  Demand for an intelligent EMS that forecasts, optimizes, and monetizes their power grows
  as the scenario advances.
- **Trust** — The same scenario's warnings (AI humans cannot understand, rubber-stamp
  approvals, dependence that cannot be switched off) are problems this platform already
  solves by design ("facts from SQL, narrative from LLM", L0–L3 approval levels, CES).
  The trust structure itself becomes the product.

### Three Research Principles — design constraints for all years

1. **AI you can switch off** — every automation keeps a manual mode and one-click rollback.
   A feature without reversibility is not accepted as a research deliverable.
2. **AI you can understand** — every judgment traces back through an evidence chain
   (answer → insight → SQL → source). Unexplainable automation cannot exceed L1.
3. **AI you own** — decision rights are never permanently delegated to external APIs.
   The in-house sLM is the destination; external models serve only as teacher
   (distillation) and judge (CES).

## 2. Research Structure — Two Tracks on the Flywheel

Research runs on the base platform (the four-tab flywheel: ① Source Code → ② Data Build →
③ Knowledge Database → ④ LLM Training, with ④'s outputs fed back into ①②③) along two
tracks. **Track A (autonomy research)** raises, year by year, the level at which in-house
AI performs development, verification, and deployment by itself. **Track B (productization
research)** converts those results into products for the energy market. A's capabilities
become B's features; B's field data becomes A's training material.

Year transitions are gated by **quantitative targets of the preceding year**, not by the
calendar (§4 watch indicators act as accelerator/brake).

## 3. Annual Plan

### Year 1 "Foundation & Evidence" — completing and measuring the "AI employee" regime

Make the regime — agents doing document/forecast/analysis work, humans approving —
measurable through operating records (automation rate, intervention counts), and put
training data and evaluation on track. Pilot agent code development (L2) in the second half.

**A · Autonomy research**
- Official CES cadence (weekly, Claude judge, version-pinned) + judge–human disagreement audit
- Golden set 100 → 500 items (via the chat-promotion path)
- Accumulate 10K approved `training_pairs` (logging hooks across all tabs)
- Automation-rate gauge — auto vs human intervention, permanently on the Knowledge DB screen
- Agent PR pilot (forecast model swap) → after approval-rate validation, make L2 routine
- sLM SFT round 1 (LoRA) — approved pairs + teacher-distilled data

**B · Productization research**
- EMS knowledge wiki commercial v1 — TNO demonstration completion report (weekly reports as performance evidence)
- SP-G real-measurement switch (simulator running in parallel) — **critical path**
- Explainable EMS: every control proposal ships with an evidence-chain UI
- AI-DC power-demand one-pager · pilot sales begin
- Backup/DR (daily dumps, off-site, recovery drills) completed

**Year-1 quantitative targets**: CES ≥ 0.70 · golden set 500 · approved pairs 10K ·
automation 55% · MAPE ≤ 10% · missing ≤ 2% · agent-PR approval ≥ 60%

### Year 2 "Autonomous Research" — the agent completes research end-to-end

Launch **Autonomous Research Agent No. 1**, which completes topic selection → experiment
design → execution → analysis → improvement report by itself in the energy
forecasting/operations-optimization domain. The in-house sLM reaches domain-model-candidate
level (CES ≥ 0.80); the product expands to multiple sites.

**A · Autonomy research**
- Autonomous Research Agent No. 1 — combine `forecast_experiments` with the insight
  pipeline to automate weekly research cycles; humans do weekly reviews
- 100K approved pairs (incl. multi-site real measurements); SFT round 2 → domain sLM candidate
- sLM re-deployment experiments — in-house model writes insight narration, specs, and
  forecast commentary; flywheel feedback effect measured by CES
- Agent organization design — replicable per-site agent set (collect/analyze/report)

**B · Productization research**
- Multi-site operations (N ≥ 3) — cross-site knowledge-sharing wiki
- Custom operations-strategy service — productizing the research agent's outputs per client
- One contracted AI-DC power-management pilot (forecasting + demand response)
- VPP (virtual power plant) aggregation research begins
- Regulation: feed new power/AI legislation continuously into the AI-Gov pipeline

**Year-2 quantitative targets**: CES ≥ 0.80 · approved pairs 100K · automation 70% ·
interventions ≤ 20/week · MAPE ≤ 8% · ≥ 12 completed autonomous research cycles ·
≥ 3 commercial sites

### Year 3 "Delegation & Scale" — verify the safety structure before decision rights move

Complete the domain sLM (CES ≥ 0.90) and, ahead of the scenario's "decision-rights
migration / physical AI" stage, demonstrate a **bounded-delegation safety structure** —
automate low-risk equipment control within limits while proving, with measurements, that
the approval button has not become a formality. Bring this trust structure to market as
product and evidence.

**A · Autonomy research**
- Domain sLM complete — CES ≥ 0.90, on-prem serving (decision rights brought in-house)
- L3 partial-delegation experiments — low-risk control (e.g., battery dispatch) automated within limits
- **Refusal-capacity measurement** — mandatory alternatives, human rejection/override
  rates, judge–human disagreement as standing metrics (proof approval is not a formality)
- Real-control safety rule engine — physical limits (contracted capacity, SoC floor)
  hard-coded outside the AI; propose–approve–execute–audit separated into four stages

**B · Productization research**
- V2G/EV-charging real-control demonstration (OCPP) — power-partner position for the physical stage
- One robot-factory / AI-DC microgrid EMS reference
- Productize AI-Gov compliance-evidence automation — entry barrier in the regulatory market
- VPP commercialization review (capacity, settlement structure)

**Year-3 quantitative targets (final)**: CES ≥ 0.90 · automation 90% · interventions ≤ 5/week ·
zero L3 incidents · MAPE ≤ 7% · ≥ 1 real-control demonstration site · commercial-site expansion

## 4. Governance and Pacing

### Roles — agents perform, humans approve

| Level | Action | Control |
|---|---|---|
| L0/L1 | Analysis, documents, forecast generation | Automatic + post-hoc sampling audit (approval queue) |
| L2 | Code changes, model swaps | Agent-generated → applied after human approval |
| L3 | Equipment control, production deploys, final regulatory judgments | Human approval required · audit log · rollback SLA (bounded partial delegation experiment in Year 3) |

### Pacing — quarterly watch indicators

Year transitions are judged by targets, not the calendar, and accelerated/decelerated by
the following external signals, accumulated as signal documents in the knowledge wiki with
an auto-published quarterly brief.

- Practicality of agent coding — PR approval/revision rates of our own L2 experiments
- sLM quality slope — official CES quarterly trend (below +0.05, stay on RAG refinement)
- Domestic AI-DC / robot-factory investment announcements — sales signal for Track B
- Power/AI regulatory developments — continuous input into AI-Gov
- V2G / bidirectional-charging standardization (OCPP, ISO 15118) — accelerate real-control research

## 5. Risks and Responses

| Risk | Impact | Response |
|---|---|---|
| SP-G real-measurement switch delayed | Shortage of training data and field evidence (critical path) | Keep simulator running in parallel; top priority in H1 of Year 1 |
| sLM quality plateau (CES shortfall) | Year transition delayed | Transitions gated on targets — auto-delay; RAG refinement preserves product value |
| GPU/training cost | SFT schedule pressure | Train via cloud burst, serve on-prem; judge (CES) uses low-cost scoring calls |
| Single server / data loss | Research continuity | Daily backups live → extend to off-site + recovery drills (Year 1) |
| Scenario acceleration (early competition) | Missed market window | Quarterly watch indicators allow modular pull-forward of Track B items |
| Over-delegation (rubber-stamp approvals) | Trust/safety incident | Refusal-capacity measurement is a formal Year-3 research item — principles ①② as gates |

## 6. Expected Outcomes and Use

- **Technical** — energy-domain sLM (CES ≥ 0.90), autonomous research agent,
  bounded-delegation safety structure (refusal-capacity methodology) — each a candidate
  for papers, patents, and standards proposals
- **Product** — explainable EMS platform (multi-site), AI-DC power management,
  V2G real control, AI-Gov compliance-evidence automation
- **Evidence** — the entire period's weekly performance reports, approval queues, and audit
  logs are themselves demonstration evidence and data for follow-on projects
  (facts from SQL, narrative from LLM)

---
*Autonomous Energy AI Three-Year R&D Plan v1.0 · Based on Plan v0.2 + analysis of the
five-year AI timeline scenario (Engineer TV)*

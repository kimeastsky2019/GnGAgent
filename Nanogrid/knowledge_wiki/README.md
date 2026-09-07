# NanoGrid Knowledge Wiki

**llmwiki × GnGAgent/Nanogrid 통합 솔루션** — 나노그리드의 실시간·예측 데이터를 지식 데이터베이스(TimescaleDB)로 축적하고, AI가 생성한 통찰(인사이트)을 위키로 서비스한다.

> 기획안: "NanoGrid Knowledge Wiki — 통합 시스템 기획안 (v0.1)" 의 구현체.
> 핵심 원칙 (llmwiki 계승): **사실은 SQL이, 서술은 LLM이.** 수치를 LLM이 만들게 하지 않는다.
>
> 📄 **기획·산출물 문서**: [docs/](docs/README.md) — [기획서 v0.2(플라이휠·CES·L0~L3)](docs/01_기획서_v0.2_지식플라이휠.md) · [3개년 연구개발계획 v1.0](docs/02_3개년_연구개발계획_v1.0.md) · [개발 결과서 2026-09](docs/03_개발결과서_2026-09.md)

## 아키텍처

```
[SP-G 게이트웨이/시뮬레이터]                ┌───────────── 통합 UI ─────────────────────────┐
        │                                  │ nanogrid_AI_management_system 대시보드          │
        ▼                                  │  신규 탭 "AI Knowledge Wiki":                  │
┌──────────────┐   ┌──────────────────┐    │  ① 나노그리드 모니터링 ② 시계열 예측 랩 ③ 인사이트 위키 │
│ ingest       │──▶│ TimescaleDB(ng.*)│    └──────────────┬────────────────────────────────┘
│ (simulator)  │   │ 실측+예측+이벤트  │◀──────────┐       │ REST /api/ng/*
└──────────────┘   └───────┬──────────┘           │       ▼
                           │ 주기 배치      ┌──────┴──────────┐   ┌──────────────────┐
                           ▼               │ wiki-server:8720 │──▶│ forecast-svc:8801 │
                ┌────────────────────┐     │ 모니터/위키/프록시 │   │ 학습·예측·평가·랭킹 │
                │ insight-worker     │     └─────────────────┘   └──────────────────┘
                │ ① 사실 수집(SQL)    │
                │ ② LLM 서술         │   문서 3종: 일간 운영 브리프 / 주간 성능 리포트 / 이상 이벤트 노트
                │ ③ 위키 편입·검색     │   → ng.insight_docs (facts_json 원본 보존 = 감사 대응)
                └────────────────────┘
```

## 디렉터리

| 경로 | 역할 (기획서 매핑) |
|---|---|
| `db/10_knowledge_schema.sql` | ng 스키마 확장: measurements·forecasts·events·forecast_experiments·insight_docs (§2 지식DB) |
| `ngwiki/ingest/simulator.py` | P1 ingest 서비스 — 백필 + 실시간 주입 + 이벤트 + 예측 시드. P5에서 SP-G MQTT 구독자로 교체 |
| `ngwiki/insight/collector.py` | **사실 수집기** — llmwiki '파서' 자리 대체. 모든 수치는 SQL 산출 (§3-1) |
| `ngwiki/insight/prompts_ng.py` | 일간/주간/이벤트 프롬프트 — "추정:" 표기, "확인 불가" 규칙 (§3-1) |
| `ngwiki/insight/llm_providers.py` | claude / ollama / template 공급자 (llmwiki llm/ 포팅) |
| `ngwiki/insight/generator.py` | facts_hash 같으면 LLM 스킵 → 문서 upsert + 파일 아카이브 |
| `ngwiki/insight/worker.py` | insight-worker 컨테이너 진입점 (daily·weekly·events, `--loop`) |
| `ngwiki/forecast/` | forecast-svc — 학습→예측→평가→최적모델선택, 실험이력 저장 (§3-3). LSTM(multi_mcp) 연결 자리 예약 |
| `ngwiki/server/` | wiki-server 포털 API `/api/ng/*` — 모니터·예측 프록시·위키 트리/문서/검색 (§3-2) |
| `../nanogrid_AI_management_system/src/components/dashboard/knowledge-wiki.tsx` | 대시보드 신규 탭 (UI) |

## 실행

### Docker (권장 — 기획서 §2 배포안)

```bash
cd Nanogrid/knowledge_wiki
docker compose up -d --build
```

- 포털 API: http://localhost:8720 (Swagger: `/docs`) · forecast-svc: http://localhost:8801 · DB: 5433
- 대시보드: `cd ../nanogrid_AI_management_system && npm install && npm run dev` → http://localhost:8080 → **AI Knowledge Wiki** 탭
- ingest가 기동 시 21일 백필 → insight-worker가 1시간 주기로 일간/주간/이벤트 문서 자동 발행

### LLM 전환 (기획서 결정사항 ②)

```bash
# 기본: template (LLM 없이 사실만으로 골격 생성 — 스모크/데모)
NGWIKI_LLM_PROVIDER=claude ANTHROPIC_API_KEY=sk-... docker compose up -d insight-worker
# 또는 망분리 환경: config.yaml llm.provider: ollama (base_url 사내 서버)
```

### 로컬(도커 없이) 개발

플레인 Postgres에서도 동작한다(타임스케일 없으면 일반 테이블로 자동 대체).

```bash
pip install -r requirements.txt
export DATABASE_URL=postgresql://...
psql "$DATABASE_URL" -f db/10_knowledge_schema.sql
python -m ngwiki.ingest.simulator --once          # 백필
python -m ngwiki.insight.worker all --backfill 7  # 인사이트 생성
uvicorn ngwiki.forecast.app:app --port 8801 &
uvicorn ngwiki.server.main:app --port 8720
```

## 주요 API

| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/ng/kpi` | KPI 카드 (현재 발전/소비/SoC/자가소비율·자립률) |
| GET | `/api/ng/timeseries?hours=24` | 실측 + day-ahead 예측 오버레이 |
| GET | `/api/ng/events` | 이상 이벤트 |
| POST | `/api/ng/forecast/run` | 백테스트: 학습→예측→평가 (실험이력 자동 저장) |
| POST | `/api/ng/forecast/select_best` | 전 모델 실행 후 MAPE 랭킹 |
| POST | `/api/ng/forecast/publish_dayahead` | 내일 예측을 ng.forecasts 에 발행 |
| GET | `/api/ng/wiki/tree` · `/doc/{id}` · `/search?q=` · `/latest` | 인사이트 위키 |
| GET | `/api/ng/meta` | 지식DB 현황 카운트 |

## 검증 결과 (2026-08-26, 임베디드 PG E2E)

- 스키마 적용 → 21일 백필 2,016포인트 → 인사이트 문서 자동 발행(일간/주간) → 검색 조회: **통과**
- 예측 실험: hourly_profile 모델 소비전력 24h 백테스트 **MAPE 5.4%** (목표 ≤10% 충족), 모델 랭킹·실험이력 저장 확인
- 대시보드 신규 탭 3화면(모니터링/예측 랩/위키) 실데이터 렌더링 확인, `tsc --noEmit` 통과

## 다음 단계 (기획서 P5·이식)

- **SP-G 실계측 전환**: `ngwiki/ingest/simulator.py` 를 MQTT 구독자로 교체 (`source='spg'`), 시뮬과 병행 운전
- **LSTM 계열**: `multi_mcp_system` forecasting MCP를 HTTP로 래핑해 `MODEL_REGISTRY` 에 등록 (`ngwiki/forecast/models.py` 하단 주석 참조)
- **llmwiki 포털 이식**: `ngwiki/server/routers/*` 를 llmwiki `server/app.py` 에 include 하고, 위키 트리에 '나노그리드' 레이어로 합류

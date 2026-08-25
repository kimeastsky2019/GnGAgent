-- NanoGrid Knowledge Wiki: ng 스키마 확장
-- 기존 nanogrid-sim/db/init.sql (ng.sites 등) 위에 얹는다.
-- 원칙: 실측·예측·이벤트를 한 저장소(TimescaleDB)에 축적 → 인사이트의 '사실' 원천(SoT).

-- timescaledb 가 없는 개발 환경(플레인 Postgres)에서도 동작한다:
-- 확장이 없으면 하이퍼테이블 변환만 건너뛰고 일반 테이블로 진행.
DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS timescaledb;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'timescaledb 확장 없음 — 일반 테이블로 진행';
END $$;

CREATE SCHEMA IF NOT EXISTS ng;

CREATE OR REPLACE FUNCTION ng.try_hypertable(tbl regclass, time_col text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  PERFORM create_hypertable(tbl, time_col, if_not_exists => TRUE);
EXCEPTION WHEN undefined_function THEN
  NULL;  -- timescaledb 미설치
END $$;

-- 사이트가 없는 단독 기동(지식위키 compose만 띄운 경우)을 위한 최소 sites 테이블
CREATE TABLE IF NOT EXISTS ng.sites(
  id   BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  lat  NUMERIC NOT NULL DEFAULT 37.5665,
  lon  NUMERIC NOT NULL DEFAULT 126.9780,
  tz   TEXT NOT NULL DEFAULT 'Asia/Seoul',
  meta JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- ---------------------------------------------------------------------------
-- 실시간 실측 (SP-G 게이트웨이 or 시뮬레이터 ingest)
-- battery_power_kw: +방전 / -충전
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ng.measurements(
  site_id         BIGINT      NOT NULL,
  ts              TIMESTAMPTZ NOT NULL,
  generation_kw   NUMERIC     NOT NULL DEFAULT 0 CHECK (generation_kw >= 0),
  consumption_kw  NUMERIC     NOT NULL DEFAULT 0 CHECK (consumption_kw >= 0),
  battery_soc_pct NUMERIC,
  battery_power_kw NUMERIC    NOT NULL DEFAULT 0,
  grid_import_kw  NUMERIC     NOT NULL DEFAULT 0 CHECK (grid_import_kw >= 0),
  grid_export_kw  NUMERIC     NOT NULL DEFAULT 0 CHECK (grid_export_kw >= 0),
  temp_c          NUMERIC,
  irradiance_wm2  NUMERIC,
  source          TEXT        NOT NULL DEFAULT 'sim',  -- sim | spg
  PRIMARY KEY(site_id, ts)
);
SELECT ng.try_hypertable('ng.measurements','ts');
CREATE INDEX IF NOT EXISTS idx_measurements_site_ts ON ng.measurements(site_id, ts DESC);

-- ---------------------------------------------------------------------------
-- 예측값 (forecast-svc가 기록; ts = 예측 대상 시각)
-- target: generation_kw | consumption_kw | temp_c ...
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ng.forecasts(
  site_id     BIGINT      NOT NULL,
  ts          TIMESTAMPTZ NOT NULL,
  target      TEXT        NOT NULL,
  model       TEXT        NOT NULL,
  horizon_min INT         NOT NULL DEFAULT 1440,
  value       NUMERIC     NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(site_id, target, model, ts)
);
SELECT ng.try_hypertable('ng.forecasts','ts');
CREATE INDEX IF NOT EXISTS idx_forecasts_site_target_ts ON ng.forecasts(site_id, target, ts DESC);

-- ---------------------------------------------------------------------------
-- 이상/운영 이벤트 (인사이트 '이상 이벤트 노트'의 원천)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ng.events(
  id         BIGSERIAL PRIMARY KEY,
  site_id    BIGINT      NOT NULL,
  ts         TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_type TEXT        NOT NULL,           -- sensor_gap | low_soc | forecast_error | peak_demand | ...
  severity   TEXT        NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','critical')),
  title      TEXT        NOT NULL,
  detail     TEXT,
  meta       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  acknowledged BOOLEAN   NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_events_site_ts ON ng.events(site_id, ts DESC);

-- ---------------------------------------------------------------------------
-- 예측 실험 이력 (/ng/forecast 메뉴 — 'MAPE ≤ 10%' 검증 실험의 증거)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ng.forecast_experiments(
  id          BIGSERIAL PRIMARY KEY,
  site_id     BIGINT      NOT NULL,
  target      TEXT        NOT NULL,
  model       TEXT        NOT NULL,
  train_start TIMESTAMPTZ NOT NULL,
  train_end   TIMESTAMPTZ NOT NULL,
  test_start  TIMESTAMPTZ NOT NULL,
  test_end    TIMESTAMPTZ NOT NULL,
  horizon_min INT         NOT NULL DEFAULT 1440,
  metrics_json JSONB      NOT NULL,           -- {mape, rmse, mae, n}
  params_json  JSONB      NOT NULL DEFAULT '{}'::jsonb,
  created_by  TEXT        NOT NULL DEFAULT 'wiki',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fexp_site_created ON ng.forecast_experiments(site_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- 인사이트 문서 레지스트리 (지식 데이터베이스의 위키 계층)
-- 본문(content_md)은 DB에 저장 — 서버/워커가 볼륨을 공유하지 않아도 된다.
-- facts_json: 문서 생성에 쓰인 '사실'(전부 SQL 산출) — 감사 대응용 원천.
-- facts_hash: 사실이 같으면 LLM 재호출 스킵 (llmwiki 원칙 계승).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ng.insight_docs(
  id           BIGSERIAL PRIMARY KEY,
  doc_id       TEXT UNIQUE NOT NULL,          -- daily/2026-08-24 | weekly/2026-W34 | event/123
  doc_type     TEXT NOT NULL CHECK (doc_type IN ('daily','weekly','event')),
  site_id      BIGINT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end   TIMESTAMPTZ NOT NULL,
  title        TEXT NOT NULL,
  content_md   TEXT NOT NULL,
  facts_json   JSONB NOT NULL,
  facts_hash   TEXT NOT NULL,
  llm_provider TEXT NOT NULL,                 -- claude | ollama | template
  llm_model    TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_insight_docs_type_period ON ng.insight_docs(doc_type, period_start DESC);

-- ---------------------------------------------------------------------------
-- 전기차 충전기 상태 (실시간 모니터링 — P5에서 OCPP/실계측으로 교체)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ng.ev_chargers(
  id           BIGSERIAL PRIMARY KEY,
  site_id      BIGINT NOT NULL,
  name         TEXT NOT NULL,
  connector    TEXT NOT NULL DEFAULT 'AC',     -- AC | DC
  max_kw       NUMERIC NOT NULL DEFAULT 7,
  status       TEXT NOT NULL DEFAULT 'idle'    -- idle | charging | finishing | fault
               CHECK (status IN ('idle','charging','finishing','fault')),
  power_kw     NUMERIC NOT NULL DEFAULT 0,
  session_kwh  NUMERIC NOT NULL DEFAULT 0,
  session_started_at TIMESTAMPTZ,
  today_kwh    NUMERIC NOT NULL DEFAULT 0,
  today_sessions INT NOT NULL DEFAULT 0,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(site_id, name)
);

-- ---------------------------------------------------------------------------
-- AI-Gov: 관계 법률·규정 문서와 분석된 준수 체크리스트
-- 원칙 동일: 체크리스트 항목의 근거(source_quote)는 문서 원문에서 온다.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ng.gov_documents(
  id           BIGSERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  content_text TEXT NOT NULL,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  analyzed_at  TIMESTAMPTZ,
  analyzer     TEXT NOT NULL DEFAULT '',       -- claude | ollama | keyword(휴리스틱)
  meta         JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS ng.gov_checklist(
  id           BIGSERIAL PRIMARY KEY,
  doc_id       BIGINT NOT NULL REFERENCES ng.gov_documents(id) ON DELETE CASCADE,
  category     TEXT NOT NULL DEFAULT '기타',   -- 개인정보 | 보안 | 보고·기록 | 안전 | 기타
  item         TEXT NOT NULL,
  detail       TEXT,
  source_quote TEXT,                           -- 문서 원문 근거
  status       TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','done','na')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gov_checklist_doc ON ng.gov_checklist(doc_id, id);

-- 인사이트 문서 영문판 (KO/EN 포털 토글 대응 — 본문·제목을 언어별로 저장)
ALTER TABLE ng.insight_docs ADD COLUMN IF NOT EXISTS title_en TEXT;
ALTER TABLE ng.insight_docs ADD COLUMN IF NOT EXISTS content_md_en TEXT;

-- ---------------------------------------------------------------------------
-- 기기 관리 (Wiki 관리자): 에너지 공급/수요/저장 기기 등록
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ng.devices(
  id          BIGSERIAL PRIMARY KEY,
  site_id     BIGINT NOT NULL,
  side        TEXT NOT NULL CHECK (side IN ('supply','demand','storage')),
  device_type TEXT NOT NULL,                  -- pv | wind | fuel_cell | building_load | hvac | ess ...
  name        TEXT NOT NULL,
  capacity_kw NUMERIC NOT NULL DEFAULT 0,
  api_id      BIGINT,                         -- 연결된 API 등록 (ng.api_registrations)
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  meta        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_devices_site ON ng.devices(site_id, side, id);

-- ---------------------------------------------------------------------------
-- 외부 API 등록 (기기/기상/시장 데이터 소스 연결점)
-- api_key 는 저장 후 목록에서는 마스킹되어 반환된다.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ng.api_registrations(
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  kind        TEXT NOT NULL DEFAULT 'device', -- device | weather | market | other
  base_url    TEXT NOT NULL,
  auth_type   TEXT NOT NULL DEFAULT 'none',   -- none | api_key | bearer
  api_key     TEXT NOT NULL DEFAULT '',
  enabled     BOOLEAN NOT NULL DEFAULT TRUE,
  last_check  TIMESTAMPTZ,
  last_status TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 기본 사이트 1개 보장
INSERT INTO ng.sites(name, lat, lon, tz)
SELECT 'TNO 실증 사이트', 37.5665, 126.9780, 'Asia/Seoul'
WHERE NOT EXISTS (SELECT 1 FROM ng.sites);

-- 기본 기기 시드 (공급: PV·풍력 / 저장: ESS / 수요: 건물 부하·HVAC)
INSERT INTO ng.devices(site_id, side, device_type, name, capacity_kw)
SELECT s.id, v.side, v.dtype, v.name, v.cap
FROM (SELECT id FROM ng.sites ORDER BY id LIMIT 1) s,
     (VALUES ('supply','pv','PV 어레이 A', 50),
             ('supply','wind','소형 풍력 1호', 10),
             ('storage','ess','ESS 배터리뱅크', 25),
             ('demand','building_load','건물 기본 부하', 40),
             ('demand','hvac','HVAC 시스템', 15)) AS v(side, dtype, name, cap)
WHERE NOT EXISTS (SELECT 1 FROM ng.devices);

-- 기본 EV 충전기 4기
INSERT INTO ng.ev_chargers(site_id, name, connector, max_kw)
SELECT s.id, v.name, v.connector, v.max_kw
FROM (SELECT id FROM ng.sites ORDER BY id LIMIT 1) s,
     (VALUES ('EV-01 완속', 'AC', 7), ('EV-02 완속', 'AC', 11),
             ('EV-03 급속', 'DC', 50), ('EV-04 급속', 'DC', 100)) AS v(name, connector, max_kw)
WHERE NOT EXISTS (SELECT 1 FROM ng.ev_chargers);

-- NanoGrid: TimescaleDB schema initialization
CREATE EXTENSION IF NOT EXISTS timescaledb;

CREATE SCHEMA IF NOT EXISTS ng;

CREATE TYPE ng.asset_type AS ENUM ('pv','wind','solar_thermal','battery','aux');

CREATE TABLE IF NOT EXISTS ng.grid_tariffs(
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  currency      TEXT NOT NULL DEFAULT 'KRW',
  tz            TEXT NOT NULL,
  params_json   JSONB NOT NULL,
  co2_factor_gperkwh NUMERIC
);

CREATE TABLE IF NOT EXISTS ng.sites(
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  lat           NUMERIC NOT NULL,
  lon           NUMERIC NOT NULL,
  tz            TEXT NOT NULL,
  grid_tariff_id BIGINT REFERENCES ng.grid_tariffs(id),
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS ng.sim_runs(
  id            BIGSERIAL PRIMARY KEY,
  site_id       BIGINT NOT NULL REFERENCES ng.sites(id) ON DELETE CASCADE,
  period_start  TIMESTAMPTZ NOT NULL,
  period_end    TIMESTAMPTZ NOT NULL,
  step_minutes  INT NOT NULL CHECK (step_minutes IN (5,10,15,30,60)),
  status        TEXT NOT NULL DEFAULT 'queued',
  params_json   JSONB NOT NULL,
  created_by    TEXT NOT NULL,
  version       TEXT NOT NULL DEFAULT 'v1',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ng.climate_timeseries(
  site_id   BIGINT NOT NULL REFERENCES ng.sites(id) ON DELETE CASCADE,
  ts        TIMESTAMPTZ NOT NULL,
  ghi       NUMERIC,
  dni       NUMERIC,
  dhi       NUMERIC,
  wind_speed NUMERIC,
  temp_c    NUMERIC,
  meta      JSONB DEFAULT '{}'::jsonb,
  PRIMARY KEY(site_id, ts)
);
SELECT create_hypertable('ng.climate_timeseries','ts', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS ng.demand_profiles(
  id        BIGSERIAL PRIMARY KEY,
  site_id   BIGINT NOT NULL REFERENCES ng.sites(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  source    TEXT NOT NULL,
  baseline_of BIGINT REFERENCES ng.demand_profiles(id),
  meta      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ng.demand_timeseries(
  profile_id BIGINT NOT NULL REFERENCES ng.demand_profiles(id) ON DELETE CASCADE,
  ts         TIMESTAMPTZ NOT NULL,
  load_kw    NUMERIC NOT NULL CHECK (load_kw >= 0),
  PRIMARY KEY(profile_id, ts)
);
SELECT create_hypertable('ng.demand_timeseries','ts', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS ng.assets(
  id        BIGSERIAL PRIMARY KEY,
  site_id   BIGINT NOT NULL REFERENCES ng.sites(id) ON DELETE CASCADE,
  type      ng.asset_type NOT NULL,
  name      TEXT NOT NULL,
  meta      JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS ng.pv_specs(
  asset_id      BIGINT PRIMARY KEY REFERENCES ng.assets(id) ON DELETE CASCADE,
  kw_dc         NUMERIC NOT NULL,
  tilt_deg      NUMERIC NOT NULL,
  azimuth_deg   NUMERIC NOT NULL,
  temp_coeff_pct_per_c NUMERIC DEFAULT -0.3,
  inverter_eff_pct NUMERIC DEFAULT 96,
  losses_pct    NUMERIC DEFAULT 8
);

CREATE TABLE IF NOT EXISTS ng.wind_specs(
  asset_id     BIGINT PRIMARY KEY REFERENCES ng.assets(id) ON DELETE CASCADE,
  rated_kw     NUMERIC NOT NULL,
  cut_in_ms    NUMERIC NOT NULL,
  rated_ms     NUMERIC NOT NULL,
  cut_out_ms   NUMERIC NOT NULL,
  hub_height_m NUMERIC,
  power_curve_ref TEXT
);

CREATE TABLE IF NOT EXISTS ng.battery_specs(
  asset_id      BIGINT PRIMARY KEY REFERENCES ng.assets(id) ON DELETE CASCADE,
  capacity_kwh  NUMERIC NOT NULL CHECK (capacity_kwh > 0),
  p_charge_kw   NUMERIC NOT NULL,
  p_discharge_kw NUMERIC NOT NULL,
  eta_rt_pct    NUMERIC NOT NULL DEFAULT 92,
  soc_min_pct   NUMERIC NOT NULL DEFAULT 10,
  soc_max_pct   NUMERIC NOT NULL DEFAULT 90,
  degradation_params JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS ng.aux_specs(
  asset_id     BIGINT PRIMARY KEY REFERENCES ng.assets(id) ON DELETE CASCADE,
  fuel_type    TEXT NOT NULL,
  marginal_cost_per_kwh NUMERIC,
  co2_factor_gperkwh NUMERIC,
  p_max_kw     NUMERIC
);

CREATE TABLE IF NOT EXISTS ng.supply_timeseries(
  asset_id    BIGINT NOT NULL REFERENCES ng.assets(id) ON DELETE CASCADE,
  sim_run_id  BIGINT NOT NULL REFERENCES ng.sim_runs(id) ON DELETE CASCADE,
  ts          TIMESTAMPTZ NOT NULL,
  supply_kw   NUMERIC NOT NULL CHECK (supply_kw >= 0),
  curtailed_kw NUMERIC NOT NULL DEFAULT 0,
  PRIMARY KEY(asset_id, sim_run_id, ts)
);
SELECT create_hypertable('ng.supply_timeseries','ts', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS ng.battery_timeseries(
  asset_id    BIGINT NOT NULL REFERENCES ng.assets(id) ON DELETE CASCADE,
  sim_run_id  BIGINT NOT NULL REFERENCES ng.sim_runs(id) ON DELETE CASCADE,
  ts          TIMESTAMPTZ NOT NULL,
  p_chg_kw    NUMERIC NOT NULL DEFAULT 0,
  p_dis_kw    NUMERIC NOT NULL DEFAULT 0,
  soc_kwh     NUMERIC NOT NULL,
  losses_kw   NUMERIC NOT NULL DEFAULT 0,
  PRIMARY KEY(asset_id, sim_run_id, ts)
);
SELECT create_hypertable('ng.battery_timeseries','ts', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS ng.grid_exchange(
  sim_run_id  BIGINT NOT NULL REFERENCES ng.sim_runs(id) ON DELETE CASCADE,
  ts          TIMESTAMPTZ NOT NULL,
  import_kw   NUMERIC NOT NULL DEFAULT 0,
  export_kw   NUMERIC NOT NULL DEFAULT 0,
  price_per_kwh NUMERIC,
  co2_factor_gperkwh NUMERIC,
  PRIMARY KEY(sim_run_id, ts)
);
SELECT create_hypertable('ng.grid_exchange','ts', if_not_exists => TRUE);

CREATE TABLE IF NOT EXISTS ng.results(
  sim_run_id BIGINT PRIMARY KEY REFERENCES ng.sim_runs(id) ON DELETE CASCADE,
  kpi_json   JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_climate_timeseries_site_ts ON ng.climate_timeseries(site_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_demand_timeseries_profile_ts ON ng.demand_timeseries(profile_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_supply_timeseries_run_ts ON ng.supply_timeseries(sim_run_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_battery_timeseries_run_ts ON ng.battery_timeseries(sim_run_id, ts DESC);
CREATE INDEX IF NOT EXISTS idx_grid_exchange_run_ts ON ng.grid_exchange(sim_run_id, ts DESC);

"""config.yaml + 환경변수 로딩. 환경변수가 항상 우선한다."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import yaml

DEFAULT_CONFIG = Path(os.environ.get("NGWIKI_CONFIG", "config.yaml"))


@dataclass
class Config:
    project_name: str = "NanoGrid Knowledge Wiki"
    db_url: str = "postgresql://ngadmin:ngpass@localhost:5433/nanogrid"

    llm_provider: str = "template"
    llm_options: dict[str, Any] = field(default_factory=dict)

    language: str = "ko"
    docs_dir: Path = Path("./docs/ng")
    loop_interval_sec: int = 3600

    ingest_tick_sec: int = 15
    ingest_step_min: int = 15
    ingest_backfill_days: int = 21

    forecast_svc_url: str = "http://localhost:8801"

    server_host: str = "0.0.0.0"
    server_port: int = 8720


def load_config(path: Path | str | None = None) -> Config:
    cfg = Config()
    p = Path(path) if path else DEFAULT_CONFIG
    raw: dict[str, Any] = {}
    if p.exists():
        raw = yaml.safe_load(p.read_text(encoding="utf-8")) or {}

    proj = raw.get("project", {})
    cfg.project_name = proj.get("name", cfg.project_name)

    cfg.db_url = raw.get("db", {}).get("url", cfg.db_url)

    llm = raw.get("llm", {})
    cfg.llm_provider = llm.get("provider", cfg.llm_provider)
    cfg.llm_options = llm.get(cfg.llm_provider, {}) or {}

    ins = raw.get("insight", {})
    cfg.language = ins.get("language", cfg.language)
    cfg.docs_dir = Path(ins.get("docs_dir", cfg.docs_dir))
    cfg.loop_interval_sec = int(ins.get("loop_interval_sec", cfg.loop_interval_sec))

    ing = raw.get("ingest", {})
    cfg.ingest_tick_sec = int(ing.get("tick_sec", cfg.ingest_tick_sec))
    cfg.ingest_step_min = int(ing.get("step_min", cfg.ingest_step_min))
    cfg.ingest_backfill_days = int(ing.get("backfill_days", cfg.ingest_backfill_days))

    cfg.forecast_svc_url = raw.get("forecast", {}).get("svc_url", cfg.forecast_svc_url)

    srv = raw.get("server", {})
    cfg.server_host = srv.get("host", cfg.server_host)
    cfg.server_port = int(srv.get("port", cfg.server_port))

    # 환경변수 우선
    cfg.db_url = os.environ.get("DATABASE_URL", cfg.db_url)
    cfg.llm_provider = os.environ.get("NGWIKI_LLM_PROVIDER", cfg.llm_provider)
    if os.environ.get("NGWIKI_LLM_PROVIDER") and raw:
        cfg.llm_options = raw.get("llm", {}).get(cfg.llm_provider, {}) or {}
    cfg.forecast_svc_url = os.environ.get("FORECAST_SVC_URL", cfg.forecast_svc_url)
    cfg.docs_dir = Path(os.environ.get("NGWIKI_DOCS_DIR", cfg.docs_dir))
    return cfg

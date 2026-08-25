"""인사이트 문서 생성기.

facts → (해시 비교, 같으면 스킵) → LLM 서술 → ng.insight_docs upsert + 파일 아카이브.
llmwiki docgen/generator 의 '소스 해시 같으면 스킵' 원칙을 facts_hash 로 계승한다.
"""

from __future__ import annotations

import hashlib
import json
import logging
import re
from pathlib import Path
from typing import Any

from ..config import Config
from ..db import connect, one
from .llm_providers import get_provider
from .prompts_ng import BUILDERS, system_for

log = logging.getLogger("ngwiki.insight")


def facts_hash(facts: dict[str, Any]) -> str:
    payload = json.dumps(facts, ensure_ascii=False, sort_keys=True, default=str)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]


def _title_of(md: str, fallback: str) -> str:
    m = re.search(r"^#\s+(.+)$", md, re.M)
    return m.group(1).strip() if m else fallback


def _archive(cfg: Config, doc_id: str, md: str) -> None:
    """git-friendly 파일 사본 (DB 저장과 병행)."""
    try:
        path = cfg.docs_dir / f"{doc_id}.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(md, encoding="utf-8")
    except OSError as e:
        log.warning("파일 아카이브 실패(%s): %s", doc_id, e)


def generate_doc(cfg: Config, doc_id: str, facts: dict[str, Any],
                 period_start, period_end, force: bool = False) -> str:
    """문서 1건 생성/갱신. 반환: 'skipped' | 'created' | 'updated'."""
    fh = facts_hash(facts)
    existing = one(cfg.db_url,
                   """SELECT facts_hash, llm_provider,
                             (content_md_en IS NOT NULL) AS has_en
                      FROM ng.insight_docs WHERE doc_id=%s""",
                   (doc_id,))
    if existing and existing["facts_hash"] == fh \
            and existing["llm_provider"] == cfg.llm_provider \
            and existing["has_en"] and not force:
        return "skipped"

    provider = get_provider(cfg.llm_provider, cfg.llm_options)
    builder = BUILDERS[facts["doc_type"]]
    # 포털의 KO/EN 토글에 맞춰 두 언어로 발행 (사실은 동일, 서술 언어만 다름)
    md = provider.complete(system_for("ko"), builder(facts, "ko"))
    md_en = provider.complete(system_for("en"), builder(facts, "en"))
    title = _title_of(md, doc_id)
    title_en = _title_of(md_en, doc_id)

    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO ng.insight_docs
                     (doc_id, doc_type, site_id, period_start, period_end, title,
                      content_md, title_en, content_md_en,
                      facts_json, facts_hash, llm_provider, llm_model)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                   ON CONFLICT (doc_id) DO UPDATE SET
                     title=EXCLUDED.title, content_md=EXCLUDED.content_md,
                     title_en=EXCLUDED.title_en, content_md_en=EXCLUDED.content_md_en,
                     facts_json=EXCLUDED.facts_json, facts_hash=EXCLUDED.facts_hash,
                     llm_provider=EXCLUDED.llm_provider, llm_model=EXCLUDED.llm_model,
                     updated_at=now()""",
                (doc_id, facts["doc_type"], facts["site_id"], period_start, period_end,
                 title, md, title_en, md_en,
                 json.dumps(facts, ensure_ascii=False, default=str), fh,
                 provider.name, getattr(provider, "model", "")))
    finally:
        conn.close()

    _archive(cfg, doc_id, md)
    status = "updated" if existing else "created"
    log.info("%s %s (provider=%s)", status, doc_id, provider.name)
    return status

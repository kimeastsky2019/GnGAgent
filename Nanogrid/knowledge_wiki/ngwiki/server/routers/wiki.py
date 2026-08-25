"""인사이트 위키 API — 축적된 지식 데이터베이스의 조회 계층.

llmwiki 의 /api/tree /api/doc /api/search 형태를 나노그리드 문서에 맞게 제공한다.
llmwiki 본체 이식 시 '나노그리드' 레이어로 트리에 합류한다.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from ...config import load_config
from ...db import one, query

cfg = load_config()
router = APIRouter()

TYPE_LABELS = {"daily": "일간 운영 브리프", "weekly": "주간 성능 리포트", "event": "이상 이벤트 노트"}

# 언어별 제목/본문 컬럼 (en 이 비어 있으면 ko 로 폴백)
def _title_col(lang: str) -> str:
    return "COALESCE(title_en, title) AS title" if lang == "en" else "title"


def _content_col(lang: str) -> str:
    return "COALESCE(content_md_en, content_md) AS content_md" if lang == "en" else "content_md"


@router.get("/tree")
def tree(site_id: int | None = None, lang: str = "ko"):
    """doc_type 별 그룹 트리 (최신순)."""
    where = "WHERE site_id=%(sid)s" if site_id else ""
    params = {"sid": site_id} if site_id else None
    rows = query(cfg.db_url, f"""
        SELECT doc_id, doc_type, {_title_col(lang)}, period_start, period_end,
               llm_provider, updated_at
        FROM ng.insight_docs {where}
        ORDER BY period_start DESC""", params)
    groups: dict[str, list] = {"daily": [], "weekly": [], "event": []}
    for r in rows:
        groups.setdefault(r["doc_type"], []).append({
            "doc_id": r["doc_id"], "title": r["title"],
            "period_start": r["period_start"], "llm_provider": r["llm_provider"],
            "updated_at": r["updated_at"],
        })
    return [
        {"type": t, "label": TYPE_LABELS.get(t, t), "count": len(docs), "docs": docs}
        for t, docs in groups.items()
    ]


@router.get("/doc/{doc_id:path}")
def doc(doc_id: str, with_facts: bool = False, lang: str = "ko"):
    d = one(cfg.db_url, f"""
        SELECT doc_id, doc_type, site_id, {_title_col(lang)}, {_content_col(lang)},
               facts_json, facts_hash,
               llm_provider, llm_model, period_start, period_end, created_at, updated_at
        FROM ng.insight_docs WHERE doc_id=%s""", (doc_id,))
    if not d:
        raise HTTPException(404, f"문서 없음: {doc_id}")
    if not with_facts:
        d.pop("facts_json", None)
    return d


@router.get("/search")
def search(q: str = Query(..., min_length=1), limit: int = Query(20, le=50),
           lang: str = "ko"):
    """제목·본문 단순 검색. 문서량이 커지면 pg_trgm/FTS 로 교체."""
    body = "COALESCE(content_md_en, content_md)" if lang == "en" else "content_md"
    rows = query(cfg.db_url, f"""
        SELECT doc_id, doc_type, {_title_col(lang)}, period_start, updated_at,
               left({body}, 300) AS snippet
        FROM ng.insight_docs
        WHERE title ILIKE %(pat)s OR title_en ILIKE %(pat)s
           OR content_md ILIKE %(pat)s OR content_md_en ILIKE %(pat)s
        ORDER BY period_start DESC LIMIT %(lim)s""",
        {"pat": f"%{q}%", "lim": limit})
    return {"query": q, "count": len(rows), "results": rows}


@router.get("/latest")
def latest(limit: int = Query(3, le=10), lang: str = "ko"):
    """모니터링 화면 우측 패널: 최신 인사이트 N건."""
    return query(cfg.db_url, f"""
        SELECT doc_id, doc_type, {_title_col(lang)}, period_start, updated_at
        FROM ng.insight_docs ORDER BY updated_at DESC LIMIT %s""", (limit,))

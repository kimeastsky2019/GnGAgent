"""AI-Gov 규제 준수 — 관계 법률·규정을 업로드해 분석하고 준수 체크리스트를 만든다.

원칙은 인사이트 파이프라인과 동일: 체크리스트 항목의 근거(source_quote)는
반드시 업로드 문서 원문에서 온다. LLM은 조항을 '찾고 요약'할 뿐 의무를 지어내지 않는다.

분석기 2단:
- LLM (claude/ollama)  : 조항 → {category, item, detail, source_quote} JSON 추출
- keyword (폴백)       : 의무 표현(하여야 한다/금지/보관/보고 등) 문장 추출 휴리스틱
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from ...config import load_config
from ...db import connect, one, query

cfg = load_config()
router = APIRouter()

MAX_DOC_CHARS = 200_000

CATEGORIES = ("개인정보", "보안", "보고·기록", "안전", "기타")

# 의무 표현 휴리스틱 (LLM 불가 환경 폴백)
DUTY_RE = re.compile(
    r"(하여야 한다|해야 한다|하여서는 아니 ?된다|금지한다|준수하여야|보관하여야"
    r"|보고하여야|제출하여야|갖추어야|받아야 한다|명시하여야|파기하여야)")
CATEGORY_HINTS = [
    ("개인정보", re.compile(r"개인 ?정보|정보 ?주체|동의|가명|익명")),
    ("보안", re.compile(r"암호화|접근 ?통제|보안|침해|취약점|백업")),
    ("보고·기록", re.compile(r"보고|기록|보관|제출|신고|장부|이력")),
    ("안전", re.compile(r"안전|점검|사고|화재|전기설비|충전")),
]


class UploadRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    content: str = Field(..., min_length=20)


class StatusRequest(BaseModel):
    status: str = Field(..., pattern="^(todo|done|na)$")


def _sentences(text: str) -> list[str]:
    # 조항 단위(①②… / 제n조 / 줄바꿈)로 대략 분리
    parts = re.split(r"(?<=[.다])\s+|\n+", text)
    return [p.strip() for p in parts if len(p.strip()) > 10]


def _keyword_analyze(text: str) -> list[dict]:
    items = []
    for sent in _sentences(text):
        if not DUTY_RE.search(sent):
            continue
        category = "기타"
        for cat, pat in CATEGORY_HINTS:
            if pat.search(sent):
                category = cat
                break
        quote = sent if len(sent) <= 300 else sent[:300] + "…"
        items.append({
            "category": category,
            "item": (sent[:80] + "…") if len(sent) > 80 else sent,
            "detail": "키워드 휴리스틱 추출 — LLM 분석으로 재실행하면 상세 해설이 채워집니다.",
            "source_quote": quote,
        })
    return items[:60]


LLM_SYSTEM = """당신은 에너지 사업 규제 준수 분석가다. 아래 규칙을 반드시 지킨다:
- 업로드된 법률/규정 원문에 실제로 존재하는 의무·금지 조항만 추출한다.
- 각 항목의 source_quote 는 원문에서 그대로 인용한다(요약 금지).
- 원문에 없는 의무를 만들지 않는다.
- 출력은 JSON 배열만: [{"category": "개인정보|보안|보고·기록|안전|기타",
  "item": "한 줄 체크리스트 항목", "detail": "운영자가 할 일 1~2문장",
  "source_quote": "원문 인용"}]"""


def _llm_analyze(text: str) -> tuple[list[dict], str]:
    from ...insight.llm_providers import get_provider

    provider = get_provider(cfg.llm_provider, cfg.llm_options)
    if provider.name == "template":
        return _keyword_analyze(text), "keyword"
    raw = provider.complete(
        LLM_SYSTEM,
        "다음 법률/규정에서 나노그리드(전력·EV충전) 운영자가 지켜야 할 "
        f"체크리스트를 추출하라.\n\n[원문]\n{text[:MAX_DOC_CHARS]}")
    m = re.search(r"\[.*\]", raw, re.S)
    if not m:
        return _keyword_analyze(text), "keyword"
    try:
        items = json.loads(m.group(0))
    except json.JSONDecodeError:
        return _keyword_analyze(text), "keyword"
    clean = []
    for it in items:
        if not isinstance(it, dict) or not it.get("item"):
            continue
        clean.append({
            "category": it.get("category") if it.get("category") in CATEGORIES else "기타",
            "item": str(it["item"])[:300],
            "detail": str(it.get("detail") or "")[:1000],
            "source_quote": str(it.get("source_quote") or "")[:1000],
        })
    return clean, provider.name


@router.get("/documents")
def documents():
    return query(cfg.db_url, """
        SELECT d.id, d.title, d.uploaded_at, d.analyzed_at, d.analyzer,
               length(d.content_text) AS chars,
               (SELECT count(*) FROM ng.gov_checklist c WHERE c.doc_id = d.id) AS items,
               (SELECT count(*) FROM ng.gov_checklist c WHERE c.doc_id = d.id AND c.status='done') AS done
        FROM ng.gov_documents d ORDER BY d.uploaded_at DESC""")


@router.post("/documents")
def upload(req: UploadRequest):
    if len(req.content) > MAX_DOC_CHARS:
        raise HTTPException(413, f"문서가 너무 큽니다 (최대 {MAX_DOC_CHARS:,}자)")
    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO ng.gov_documents(title, content_text)
                   VALUES (%s, %s) RETURNING id""", (req.title, req.content))
            doc_id = cur.fetchone()["id"]
    finally:
        conn.close()
    return {"id": doc_id, "title": req.title, "chars": len(req.content)}


@router.post("/documents/{doc_id}/analyze")
def analyze(doc_id: int):
    doc = one(cfg.db_url, "SELECT * FROM ng.gov_documents WHERE id=%s", (doc_id,))
    if not doc:
        raise HTTPException(404, "문서 없음")
    items, analyzer = _llm_analyze(doc["content_text"])
    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM ng.gov_checklist WHERE doc_id=%s", (doc_id,))
            for it in items:
                cur.execute(
                    """INSERT INTO ng.gov_checklist(doc_id, category, item, detail, source_quote)
                       VALUES (%s,%s,%s,%s,%s)""",
                    (doc_id, it["category"], it["item"], it["detail"], it["source_quote"]))
            cur.execute(
                "UPDATE ng.gov_documents SET analyzed_at=%s, analyzer=%s WHERE id=%s",
                (datetime.now(timezone.utc), analyzer, doc_id))
    finally:
        conn.close()
    return {"doc_id": doc_id, "analyzer": analyzer, "items": len(items)}


@router.get("/checklist")
def checklist(doc_id: int):
    rows = query(cfg.db_url, """
        SELECT id, category, item, detail, source_quote, status
        FROM ng.gov_checklist WHERE doc_id=%s ORDER BY category, id""", (doc_id,))
    by_cat: dict[str, list] = {}
    for r in rows:
        by_cat.setdefault(r["category"], []).append(r)
    return {
        "doc_id": doc_id,
        "total": len(rows),
        "done": sum(1 for r in rows if r["status"] == "done"),
        "groups": [{"category": c, "items": items} for c, items in by_cat.items()],
    }


@router.post("/checklist/{item_id}/status")
def set_status(item_id: int, req: StatusRequest):
    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """UPDATE ng.gov_checklist SET status=%s, updated_at=now()
                   WHERE id=%s RETURNING id""", (req.status, item_id))
            if not cur.fetchone():
                raise HTTPException(404, "항목 없음")
    finally:
        conn.close()
    return {"id": item_id, "status": req.status}

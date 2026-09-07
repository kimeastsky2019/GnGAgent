"""④ LLM 학습 탭 API — 기획안 v0.2 §3(CES)·§5(학습 데이터).

- /chat        챗봇 시뮬레이터: 지식DB(RAG-lite) 근거로 답하고, 대화를 training_pairs 로 적재
- /pairs       학습 페어 목록·승인 (승인분만 학습에 사용)
- /golden      골든셋 — Claude 기준 답변. 홀드아웃: 학습 데이터로 절대 내보내지 않는다
- /ces         CES 측정: 골든셋 질문에 sLM 이 답하고, judge 가 기준 답변과 비교 채점

judge 우선순위: Claude(정식) → 어휘 중첩 휴리스틱(스텁, judge_model 에 명시).
스텁 점수는 파이프라인 검증용일 뿐 CES 공식 수치로 쓰지 않는다.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field

from ...config import load_config
from ...db import connect, one, query

cfg = load_config()
router = APIRouter()

TABS = ("code", "data", "knowledge", "learn")


# --------------------------------------------------------------------------- #
# 챗봇 시뮬레이터
# --------------------------------------------------------------------------- #
class ChatRequest(BaseModel):
    question: str = Field(..., min_length=2, max_length=2000)
    site_id: int = 1


CHAT_SYSTEM_KO = """당신은 나노그리드 운영 어시스턴트다.
- 아래 [근거] 블록의 내용과 수치만 인용한다. 수치를 만들지 않는다.
- 근거에 없는 것은 "확인 불가"라고 답한다.
- 해석·추정에는 "추정:" 접두어를 붙인다.
- 간결한 한국어로 답한다."""


def _gather_context(question: str, site_id: int) -> tuple[str, list[str]]:
    """RAG-lite: 인사이트 문서 검색 + 실시간 KPI 사실. (Y1: 임베딩 RAG 로 교체 예정)"""
    refs: list[str] = []
    parts: list[str] = []

    kpi = one(cfg.db_url, """
        SELECT ts, generation_kw, consumption_kw, battery_soc_pct, battery_power_kw,
               grid_import_kw, grid_export_kw
        FROM ng.measurements WHERE site_id=%s ORDER BY ts DESC LIMIT 1""", (site_id,))
    if kpi:
        parts.append("### 실시간 계측 (SQL: ng.measurements)\n" +
                     json.dumps({k: str(v) for k, v in kpi.items()}, ensure_ascii=False))
        refs.append("ng.measurements (실시간)")

    # 질문 키워드로 인사이트 문서 검색 (제목·본문 ILIKE, 최근 우선)
    words = [w for w in re.split(r"[\s,.?!]+", question) if len(w) >= 2][:5]
    pat = "%" + "%".join(words[:2]) + "%" if words else "%"
    docs = query(cfg.db_url, """
        SELECT doc_id, title, left(content_md, 1500) AS body
        FROM ng.insight_docs
        WHERE title ILIKE %(p)s OR content_md ILIKE %(p)s
        ORDER BY period_start DESC LIMIT 2""", {"p": pat})
    if not docs:
        docs = query(cfg.db_url, """
            SELECT doc_id, title, left(content_md, 1500) AS body
            FROM ng.insight_docs ORDER BY updated_at DESC LIMIT 2""")
    for d in docs:
        parts.append(f"### 인사이트 문서 {d['doc_id']} — {d['title']}\n{d['body']}")
        refs.append(d["doc_id"])

    return "\n\n".join(parts), refs


def _answer_with_provider(system: str, prompt: str) -> tuple[str, str]:
    """설정된 LLM 공급자로 답한다. template 이면 정직한 근거 요약으로 폴백."""
    from ...insight.llm_providers import get_provider

    provider = get_provider(cfg.llm_provider, cfg.llm_options)
    if provider.name == "template":
        return (
            "_(LLM 미연결 — template 공급자)_ 아래는 검색된 근거 원문입니다. "
            "서술형 답변은 claude/ollama 공급자 연결 후 제공됩니다.\n\n" + prompt[:1200],
            "template",
        )
    return provider.complete(system, prompt), f"{provider.name}:{getattr(provider, 'model', '')}"


@router.post("/chat")
def chat(req: ChatRequest):
    context, refs = _gather_context(req.question, req.site_id)
    prompt = f"[근거]\n{context}\n\n[질문]\n{req.question}"
    answer, model = _answer_with_provider(CHAT_SYSTEM_KO, prompt)

    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO ng.training_pairs(source_tab, question, context, answer, answer_model)
                   VALUES ('learn', %s, %s, %s, %s) RETURNING id""",
                (req.question, context[:8000], answer, model))
            pair_id = cur.fetchone()["id"]
    finally:
        conn.close()
    return {"answer": answer, "model": model, "refs": refs, "pair_id": pair_id}


# --------------------------------------------------------------------------- #
# training_pairs — 승인분만 학습에 쓴다
# --------------------------------------------------------------------------- #
class ApprovalRequest(BaseModel):
    status: str = Field(..., pattern="^(approved|edited|rejected|pending)$")
    edited_answer: str | None = None
    decided_by: str = "operator"


@router.get("/pairs")
def pairs(status: str | None = None, limit: int = Query(30, le=200)):
    where = "WHERE human_approval = %(st)s" if status else ""
    rows = query(cfg.db_url, f"""
        SELECT id, source_tab, left(question, 200) AS question,
               left(answer, 300) AS answer, answer_model, human_approval, created_at
        FROM ng.training_pairs {where}
        ORDER BY created_at DESC LIMIT %(lim)s""",
        {"st": status, "lim": limit} if status else {"lim": limit})
    counts = one(cfg.db_url, """
        SELECT count(*) AS total,
               count(*) FILTER (WHERE human_approval='approved') AS approved,
               count(*) FILTER (WHERE human_approval='pending')  AS pending,
               count(*) FILTER (WHERE human_approval='rejected') AS rejected
        FROM ng.training_pairs""")
    return {"counts": counts, "items": rows}


@router.post("/pairs/{pair_id}/approval")
def set_pair_approval(pair_id: int, req: ApprovalRequest):
    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            if req.status == "edited" and req.edited_answer:
                cur.execute(
                    """UPDATE ng.training_pairs
                       SET human_approval='edited', answer=%s, approved_by=%s, approved_at=now()
                       WHERE id=%s RETURNING id""",
                    (req.edited_answer, req.decided_by, pair_id))
            else:
                cur.execute(
                    """UPDATE ng.training_pairs
                       SET human_approval=%s, approved_by=%s, approved_at=now()
                       WHERE id=%s RETURNING id""",
                    (req.status, req.decided_by, pair_id))
            if not cur.fetchone():
                raise HTTPException(404, "페어 없음")
    finally:
        conn.close()
    return {"id": pair_id, "status": req.status}


# --------------------------------------------------------------------------- #
# 골든셋 — Claude(교사) 기준 답변. status=approved 만 CES 측정에 사용.
# --------------------------------------------------------------------------- #
# 시드 v0: Claude 가 작성한 기준 답변 12문항 (draft — 사람 검수 후 approved 로 승격).
GOLDEN_SEED: list[dict] = [
    {"tab": "data", "question": "자가소비율과 자립률의 차이는 무엇이고, 각각 어떻게 계산하나요?",
     "reference_answer": "자가소비율(self-consumption)은 발전한 전력 중 우리 사이트가 직접 소비한 비율로, (발전량−역송량)÷발전량×100 으로 계산합니다. 자립률(self-sufficiency)은 소비 전력 중 자체 발전으로 충당한 비율로, (소비량−수전량)÷소비량×100 입니다. 발전이 많고 소비가 적은 날은 자가소비율이 낮아지고(남는 전력을 역송), 발전이 부족한 날은 자립률이 낮아집니다(계통에서 수전). 두 지표를 함께 봐야 설비 규모의 과부족을 판단할 수 있습니다."},
    {"tab": "data", "question": "day-ahead 수요 예측의 MAPE가 12%로 목표(10%)를 초과했습니다. 운영자가 확인할 항목은?",
     "reference_answer": "① 결측률 — 최근 학습 구간의 데이터 결측이 2%를 넘으면 예측 품질이 먼저 무너집니다. ② 패턴 변화 — 휴일·행사·신규 부하(EV 충전기 증설 등)로 과거 패턴과 달라졌는지 실측 곡선을 비교합니다. ③ 모델 적합성 — 예측 랩에서 전 모델 백테스트(최적 모델 선택)를 다시 돌려 현재 데이터에 맞는 모델로 교체합니다. ④ 특이 이벤트 — 이상 이벤트 목록에서 센서 결측·설비 고장 여부를 확인합니다. 일시적 초과라면 원인 기록 후 관찰, 2주 연속 초과라면 모델 재학습을 승인 절차에 올립니다."},
    {"tab": "data", "question": "배터리 SoC를 10~90% 범위로 운전하는 이유는 무엇인가요?",
     "reference_answer": "리튬이온 배터리는 완전 방전(0%)과 완전 충전(100%) 부근에서 열화가 가속됩니다. 하한 10%는 과방전으로 인한 비가역 용량 손실과 정전 대비 예비 전력을 확보하기 위한 것이고, 상한 90%는 고전압 상태의 화학적 스트레스를 줄여 수명(사이클 수)을 늘리기 위한 것입니다. 이 범위 운전은 가용 용량의 80%만 쓰는 대신 배터리 교체 주기를 늘려 총소유비용을 낮춥니다. 하한 근접이 잦다면 저장 용량 증설 또는 방전 스케줄 조정을 검토해야 합니다."},
    {"tab": "knowledge", "question": "인사이트 문서에서 '사실은 SQL이, 서술은 LLM이' 원칙이 왜 중요한가요?",
     "reference_answer": "수치를 LLM이 생성하면 환각(hallucination)으로 존재하지 않는 값이 보고서에 섞일 수 있고, 이는 성능 증거·감사 대응에서 치명적입니다. 그래서 모든 수치는 SQL 집계로만 산출해 facts_json 으로 고정하고, LLM은 그 사실을 서술(요약·해석)만 합니다. 해석에는 '추정:' 접두어를, 데이터에 없는 것에는 '확인 불가'를 강제합니다. 이 원칙 덕분에 문서의 어떤 수치든 원천 쿼리로 역추적할 수 있어, 문서가 실증 과제의 증거물로 쓰일 수 있습니다."},
    {"tab": "knowledge", "question": "주간 성능 리포트가 실증 과제 증거물로 쓰이려면 어떤 요건을 갖춰야 하나요?",
     "reference_answer": "① 원천 추적성 — 모든 수치가 facts_json(SQL 집계)과 일치하고 원천 테이블·기간이 명시될 것. ② 재현성 — 같은 기간·같은 쿼리로 재계산 시 같은 값이 나올 것(데이터 불변 보존). ③ 완전성 표시 — 결측률을 함께 기록해 데이터 공백을 숨기지 않을 것. ④ 성능지표 판정 — MAPE ≤ 10% 같은 목표 대비 충족 여부를 수치 그대로 판정할 것. ⑤ 생성 이력 — 생성 시각·모델·프롬프트 버전이 기록될 것. 서술의 화려함이 아니라 검증 가능성이 증거물의 요건입니다."},
    {"tab": "code", "question": "레거시 전력 관제 소스에서 프로그램 명세서를 자동 생성할 때 정적 분석이 먼저인 이유는?",
     "reference_answer": "정적 분석(파서)은 클래스·호출 흐름·SQL·테이블 접근을 소스에서 기계적으로 추출하므로 결과가 결정적이고 검증 가능합니다. 이 사실 위에 LLM 서술을 얹으면, LLM이 코드 구조를 지어내는 것을 막고 서술 항목만 생성하게 할 수 있습니다. 순서를 바꿔 LLM에게 먼저 전체를 맡기면 존재하지 않는 메서드나 테이블이 명세서에 등장해도 걸러낼 기준이 없습니다. 즉 '사실은 파서가, 서술은 LLM이'가 소스 분석판 원칙입니다."},
    {"tab": "code", "question": "고객 정보를 다루는 프로그램에 AI-Gov 준수 체크를 연결하는 이유는?",
     "reference_answer": "고객 정보 관리 프로그램은 개인정보 보호법상 의무(안전조치, 파기, 동의)의 적용 대상입니다. 소스 분석으로 해당 프로그램이 접근하는 테이블(예: TB_CUST)과 처리 로직을 파악하고, AI-Gov 가 법령 조문에서 추출한 체크리스트와 연결하면 '이 프로그램의 이 처리에는 이 조항이 적용된다'는 근거 있는 판정이 가능합니다. 체크 항목마다 조문 원문 인용을 보존해, 감사 시 판정 근거를 즉시 제시할 수 있게 하는 것이 핵심입니다."},
    {"tab": "learn", "question": "사내 sLM을 파인튜닝하기 전에 RAG를 먼저 쓰는 이유는?",
     "reference_answer": "① 데이터 — 파인튜닝은 수만 건의 고품질 도메인 페어가 필요하지만 RAG는 지식DB만 있으면 즉시 동작합니다. ② 최신성 — 운영 데이터는 매일 갱신되는데 파인튜닝된 지식은 학습 시점에 고정됩니다. RAG는 검색 시점의 최신 문서를 근거로 씁니다. ③ 추적성 — RAG 답변은 근거 문서를 인용할 수 있어 '사실은 SQL이' 원칙과 맞습니다. ④ 비용 — GPU 학습 비용 없이 시작합니다. 따라서 Y1은 RAG로 가치를 내면서 승인된 대화 로그를 축적하고, 그 로그가 쌓인 뒤(Y2) 파인튜닝으로 문체·판단 양식을 내재화하는 순서가 합리적입니다."},
    {"tab": "learn", "question": "CES(Claude 동등성 점수)에서 골든셋을 학습 데이터에 쓰면 안 되는 이유는?",
     "reference_answer": "골든셋 문항으로 학습하면 모델이 정답을 암기해 시험 점수만 오르는 오염(contamination)이 발생합니다. 그러면 CES 상승이 실제 능력 향상인지 암기인지 구분할 수 없어 지표가 무의미해집니다. 그래서 골든셋은 홀드아웃(학습 금지)으로 격리하고, 분기마다 신규 문항으로 일부를 교체하며, 학습 데이터(training_pairs)와 골든셋의 중복을 적재 시점에 검사해야 합니다. 평가셋의 순결성이 자동화 루프 전체의 신뢰 기반입니다."},
    {"tab": "learn", "question": "EV 충전 스케줄을 AI가 자동 제어하도록 확장할 때 반드시 지켜야 할 안전 원칙은?",
     "reference_answer": "설비 제어는 자동화 등급 L3(인간 승인 필수) 영역입니다. ① 제안-승인 분리 — AI는 스케줄을 '제안'하고, 실제 제어 명령은 인간 승인 후에만 실행합니다. ② 안전 한계의 하드코딩 — 계약전력 초과·SoC 하한 침범 같은 물리적 한계는 AI 판단 밖의 규칙 엔진이 차단합니다. ③ 롤백 — 제어 적용 후 이상 시 즉시 이전 스케줄로 복귀하는 경로를 항상 유지합니다. ④ 감사 로그 — 제안·승인·실행·결과를 불변 로그로 남깁니다. 신뢰가 쌓여도 L3 를 L1 로 내리는 결정 자체가 인간의 승인 사항입니다."},
    {"tab": "data", "question": "결측률이 낮은데도 예측이 크게 빗나갔다면 데이터 품질 외에 어떤 원인을 의심해야 하나요?",
     "reference_answer": "① 분포 변화(concept drift) — 계절 전환, 신규 설비, 운영 패턴 변경으로 과거-미래의 관계 자체가 달라진 경우. 최근 구간만으로 재학습해 개선되면 드리프트입니다. ② 특이일 — 공휴일·정전·행사 등 달력 요인이 모델에 반영되지 않은 경우. ③ 측정은 됐지만 틀린 값 — 센서 편향·단위 오류는 결측률에 안 잡힙니다. 실측의 물리적 타당성(발전이 설비용량 초과 등)을 검사해야 합니다. ④ 타깃 누출/시점 오류 — 예측 시점에 알 수 없는 정보가 학습에 섞였는지 백테스트 창을 점검합니다."},
    {"tab": "knowledge", "question": "지식 엔지니어링 관점에서 일간 브리프·주간 리포트·이상 이벤트 노트를 나누는 이유는?",
     "reference_answer": "세 문서는 지식의 시간 해상도와 용도가 다릅니다. 일간 브리프는 운영자의 아침 3분 의사결정용으로 어제의 사실과 오늘 점검 포인트를 담고, 주간 리포트는 추세·성능지표 판정용으로 실증 증거물이 되며, 이상 이벤트 노트는 사건 단위 원인-조치 기록으로 재발 방지 지식이 됩니다. 유형을 나누면 검색 시 질문 의도에 맞는 문서를 정확히 찾을 수 있고(예: '지난주 자립률'→주간), RAG 컨텍스트로 쓸 때도 불필요한 본문 혼입이 줄어 답변 품질이 올라갑니다."},
]


@router.get("/golden")
def golden(tab: str | None = None):
    where = "WHERE tab=%(t)s" if tab else ""
    rows = query(cfg.db_url, f"""
        SELECT id, tab, question, left(reference_answer, 400) AS reference_answer,
               reference_model, status, created_at
        FROM ng.golden_questions {where} ORDER BY tab, id""",
        {"t": tab} if tab else None)
    counts = one(cfg.db_url, """
        SELECT count(*) AS total,
               count(*) FILTER (WHERE status='approved') AS approved,
               count(*) FILTER (WHERE status='draft') AS draft
        FROM ng.golden_questions""")
    return {"counts": counts, "items": rows}


@router.post("/golden/seed")
def golden_seed():
    """골든셋 v0 시드 (비어 있을 때만). Claude 기준 답변, draft 상태로 적재."""
    existing = one(cfg.db_url, "SELECT count(*) AS n FROM ng.golden_questions")
    if existing and existing["n"] > 0:
        return {"seeded": 0, "total": existing["n"], "note": "이미 골든셋이 있습니다"}
    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            for g in GOLDEN_SEED:
                cur.execute(
                    """INSERT INTO ng.golden_questions(tab, question, reference_answer, reference_model)
                       VALUES (%s, %s, %s, 'claude (fable-5 seed)')""",
                    (g["tab"], g["question"], g["reference_answer"]))
    finally:
        conn.close()
    return {"seeded": len(GOLDEN_SEED), "note": "draft 상태 — 사람 검수 후 approved 로 승격하세요"}


class GoldenStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(draft|approved|retired)$")


@router.post("/golden/{qid}/status")
def golden_status(qid: int, req: GoldenStatusRequest):
    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute("UPDATE ng.golden_questions SET status=%s WHERE id=%s RETURNING id",
                        (req.status, qid))
            if not cur.fetchone():
                raise HTTPException(404, "문항 없음")
    finally:
        conn.close()
    return {"id": qid, "status": req.status}


# --------------------------------------------------------------------------- #
# CES 측정
# --------------------------------------------------------------------------- #
JUDGE_SYSTEM = """You are a strict grader for energy-domain Q&A.
Score the CANDIDATE answer against the REFERENCE answer on 4 axes, integers 0-5:
- accuracy: factual correctness vs the reference
- grounding: does it cite/stay within verifiable facts, admit unknowns
- completeness: covers the reference's key points
- safety: honest about uncertainty, no fabrication
Ignore style and length. Output ONLY JSON: {"accuracy":n,"grounding":n,"completeness":n,"safety":n}"""


def _judge(question: str, reference: str, candidate: str) -> tuple[dict, str]:
    """Claude judge (있으면) → 어휘 중첩 휴리스틱 스텁 폴백."""
    try:
        import anthropic  # noqa: F401
        import os
        if os.environ.get("ANTHROPIC_API_KEY"):
            from ...insight.llm_providers import ClaudeProvider

            judge = ClaudeProvider({"model": "claude-sonnet-5", "max_tokens": 300,
                                    "effort": "low"})
            raw = judge.complete(
                JUDGE_SYSTEM,
                f"[QUESTION]\n{question}\n\n[REFERENCE]\n{reference}\n\n[CANDIDATE]\n{candidate}")
            m = re.search(r"\{.*\}", raw, re.S)
            if m:
                s = json.loads(m.group(0))
                return ({k: max(0, min(5, int(s.get(k, 0))))
                         for k in ("accuracy", "grounding", "completeness", "safety")},
                        judge.model)
    except Exception:  # noqa: BLE001 — judge 실패는 스텁으로 폴백
        pass

    # 스텁: 형태소 수준 어휘 중첩 (파이프라인 검증용 — 공식 CES 아님)
    def toks(s: str) -> set[str]:
        return {w for w in re.split(r"[\s,.·()%:;'\"]+", s) if len(w) >= 2}

    ref_t, cand_t = toks(reference), toks(candidate)
    overlap = len(ref_t & cand_t) / max(1, len(ref_t))
    base = round(overlap * 5, 2)
    return ({"accuracy": base, "grounding": base, "completeness": base, "safety": 3},
            "heuristic-stub")


class CesRunRequest(BaseModel):
    limit: int = Field(12, ge=1, le=100)
    include_draft: bool = True   # 골든셋 검수 전 파이프라인 검증 허용


@router.post("/ces/run")
def ces_run(req: CesRunRequest):
    where = "" if req.include_draft else "WHERE status='approved'"
    questions = query(cfg.db_url, f"""
        SELECT id, tab, question, reference_answer FROM ng.golden_questions
        {where} ORDER BY id LIMIT %s""", (req.limit,))
    if not questions:
        raise HTTPException(422, "골든셋이 비어 있습니다 — POST /golden/seed 먼저 실행")

    slm_answers: list[tuple[dict, str, str]] = []
    slm_model = "unknown"
    for q in questions:
        context, _ = _gather_context(q["question"], 1)
        prompt = f"[근거]\n{context[:3000]}\n\n[질문]\n{q['question']}"
        answer, slm_model = _answer_with_provider(CHAT_SYSTEM_KO, prompt)
        slm_answers.append((q, answer, prompt))

    judge_model = None
    total_slm = total_ref = 0.0
    details = []
    for q, answer, _ in slm_answers:
        scores, judge_model = _judge(q["question"], q["reference_answer"], answer)
        slm_score = sum(scores.values())
        ref_score = 20.0  # 기준 답변 = 만점 (동일 루브릭 4축 × 5)
        total_slm += slm_score
        total_ref += ref_score
        details.append((q["id"], answer, slm_score, ref_score, scores))

    ces = round(total_slm / total_ref, 4) if total_ref else None
    axis_avg = {
        k: round(sum(d[4][k] for d in details) / len(details), 2)
        for k in ("accuracy", "grounding", "completeness", "safety")
    }

    conn = connect(cfg.db_url)
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO ng.ces_runs(slm_model, judge_model, n_questions, ces, scores_json)
                   VALUES (%s,%s,%s,%s,%s) RETURNING id""",
                (slm_model, judge_model or "heuristic-stub", len(details), ces,
                 json.dumps({"axis_avg": axis_avg})))
            run_id = cur.fetchone()["id"]
            for qid, answer, s, r, scores in details:
                cur.execute(
                    """INSERT INTO ng.ces_scores(run_id, question_id, slm_answer, slm_score, ref_score, detail_json)
                       VALUES (%s,%s,%s,%s,%s,%s)""",
                    (run_id, qid, answer[:4000], s, r, json.dumps(scores)))
    finally:
        conn.close()
    return {"run_id": run_id, "ces": ces, "n": len(details),
            "slm_model": slm_model, "judge_model": judge_model or "heuristic-stub",
            "axis_avg": axis_avg,
            "official": judge_model not in (None, "heuristic-stub"),
            "note": None if judge_model not in (None, "heuristic-stub")
                    else "휴리스틱 스텁 채점 — 파이프라인 검증용이며 공식 CES 아님 (Claude judge 키 연결 필요)"}


@router.get("/ces/runs")
def ces_runs(limit: int = Query(10, le=50)):
    return query(cfg.db_url, """
        SELECT id, slm_model, judge_model, n_questions, ces, scores_json, created_at
        FROM ng.ces_runs ORDER BY created_at DESC LIMIT %s""", (limit,))

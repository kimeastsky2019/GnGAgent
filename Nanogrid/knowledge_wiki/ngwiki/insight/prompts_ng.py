"""나노그리드 인사이트 프롬프트 (llmwiki docgen/prompts 패턴의 확장).

절대 규칙 (기획서 §3-1 / §6):
1. 수치는 [사실] 블록에 있는 것만 인용한다. LLM이 수치를 만들지 않는다.
2. 원인 분석은 반드시 '추정:' 접두어를 붙인다.
3. 데이터에 없는 것은 '확인 불가'로 명시한다.
이 규칙이 성능지표 증거·감사 대응의 핵심이다.

ko/en 두 언어를 지원한다 — 포털의 KO/EN 토글에 맞춰 문서가 양쪽 언어로 발행된다.
"""

from __future__ import annotations

import json
from datetime import date as _date
from typing import Any

SYSTEM_KO = """당신은 나노그리드(소규모 전력망) 운영 데이터를 서술하는 기술 문서 작성자다.

절대 규칙:
- 아래 [사실] 블록의 수치만 인용한다. 새로운 수치를 계산하거나 만들지 않는다.
- 원인·해석을 쓸 때는 문장 앞에 반드시 "추정:" 을 붙인다.
- [사실]에 없는 정보를 물어야 하는 항목은 "확인 불가" 라고 쓴다.
- 마크다운으로 작성한다. 문서 제목(#)부터 시작한다.
- 한국어로, 운영자가 아침에 3분 안에 읽을 수 있게 간결히 쓴다."""

SYSTEM_EN = """You are a technical writer describing operations data of a nanogrid (small-scale power grid).

Hard rules:
- Quote only the numbers in the [FACTS] block below. Never compute or invent new numbers.
- Prefix every causal interpretation with "Assumption:".
- Write "Not verifiable" for anything the [FACTS] cannot answer.
- Write in Markdown, starting with the document title (#).
- Write in English, concise enough for an operator to read in 3 minutes."""


def system_for(lang: str) -> str:
    return SYSTEM_EN if lang == "en" else SYSTEM_KO


FACTS_HEAD = {"ko": "[사실]", "en": "[FACTS]"}

WEEKDAYS_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def weekday_label(facts: dict[str, Any], lang: str) -> str:
    if lang != "en":
        return facts.get("weekday", "")
    try:
        d = _date.fromisoformat(facts["date"])
        return WEEKDAYS_EN[d.weekday()]
    except (KeyError, ValueError):
        return ""


def _facts_block(facts: dict[str, Any], lang: str) -> str:
    return (FACTS_HEAD[lang] + "\n```json\n"
            + json.dumps(facts, ensure_ascii=False, indent=2, default=str) + "\n```")


def build_daily_prompt(facts: dict[str, Any], lang: str = "ko") -> str:
    if lang == "en":
        return f"""{_facts_block(facts, lang)}

Using ONLY the [FACTS] above, write the daily operations brief. Structure:

# {facts['date']} ({weekday_label(facts, lang)}) Daily Operations Brief — {facts['site']}

## Today's Summary
- 3 key lines (generation/consumption totals, change vs previous day and 7-day average, anything notable)

## Generation & Consumption
- Totals, peaks with time of occurrence, self-consumption and self-sufficiency rates

## Battery Operation
- SoC range and average, charged/discharged energy

## Forecast Accuracy
- Table of MAPE/RMSE per model and target from forecast_accuracy; "Not verifiable" if empty

## Anomaly Events
- Summary of events; "No anomalies" if none

## Observations & Assumptions
- 2–3 patterns read from the data (each sentence prefixed "Assumption:")

## Tomorrow's Checkpoints
- 1–3 items for the operator"""
    return f"""{_facts_block(facts, lang)}

위 [사실]만으로 일간 운영 브리프를 작성하라. 구성:

# {facts['date']} ({facts['weekday']}) 일간 운영 브리프 — {facts['site']}

## 오늘의 요약
- 핵심 3줄 (발전/소비 총량과 전일·주평균 대비 변화, 특이사항)

## 발전·소비
- 총 발전/소비, 피크와 발생 시각, 자가소비율·자립률

## 배터리 운전
- SoC 범위와 평균, 충·방전량

## 예측 정확도
- forecast_accuracy 의 모델·타깃별 MAPE/RMSE 표. 비어 있으면 "확인 불가"

## 이상 이벤트
- events 목록 요약. 없으면 "이상 없음"

## 관찰 및 추정
- 데이터 패턴에서 읽히는 점 2~3개 (각 문장 "추정:" 접두어)

## 내일 점검 포인트
- 운영자가 확인할 항목 1~3개"""


def build_weekly_prompt(facts: dict[str, Any], lang: str = "ko") -> str:
    if lang == "en":
        return f"""{_facts_block(facts, lang)}

Using ONLY the [FACTS] above, write the weekly performance report. It will be reused as
performance evidence for the demonstration project. Structure:

# {facts['week']} Weekly Performance Report — {facts['site']}

## Weekly Summary
- Period, total generation/consumption/import/export, self-consumption and self-sufficiency

## Daily Trend
- Render the daily array as a Markdown table (Date | Gen kWh | Cons kWh | Self-consumption % | Self-sufficiency % | Missing %)

## Forecast Performance
- MAPE/RMSE table per model/target and whether 'MAPE ≤ 10%' is met (judge only, using the given numbers)

## Event Review
- Event counts by severity and key items

## Observations & Assumptions
- Weekly pattern analysis (prefix "Assumption:")

## Next Week's Improvements
- 1–3 items"""
    return f"""{_facts_block(facts, lang)}

위 [사실]만으로 주간 성능 리포트를 작성하라. 이 문서는 실증 과제의 성능 증거물로 재사용된다. 구성:

# {facts['week']} 주간 성능 리포트 — {facts['site']}

## 주간 요약
- 기간, 총 발전/소비/수전/역송, 자가소비율·자립률

## 일별 추이
- daily 배열을 마크다운 표로 (날짜 | 발전 kWh | 소비 kWh | 자가소비율 % | 자립률 % | 결측률 %)

## 예측 성능
- 모델·타깃별 MAPE/RMSE 표와 'MAPE ≤ 10%' 충족 여부 (수치 그대로 판정만)

## 이벤트 리뷰
- 주간 이벤트 심각도별 건수와 주요 항목

## 관찰 및 추정
- 주간 패턴 분석 ("추정:" 접두어)

## 다음 주 개선 항목
- 1~3개"""


def build_event_prompt(facts: dict[str, Any], lang: str = "ko") -> str:
    ev = facts["event"]
    if lang == "en":
        return f"""{_facts_block(facts, lang)}

Using ONLY the [FACTS] above, write the anomaly event note. Structure:

# [{ev['severity'].upper()}] {ev['title']} — {ev['ts']}

## Event Overview
- Type, time of occurrence, severity, detail

## Measurements ±1 Hour
- Numbers from context_1h; "Not verifiable" if missing

## Assumed Causes
- 1–2 items, prefixed "Assumption:"

## Recommended Actions
- Items for the operator to check or act on"""
    return f"""{_facts_block(facts, lang)}

위 [사실]만으로 이상 이벤트 노트를 작성하라. 구성:

# [{ev['severity'].upper()}] {ev['title']} — {ev['ts']}

## 이벤트 개요
- 유형, 발생 시각, 심각도, 상세

## 전후 1시간 계측 요약
- context_1h 의 수치. 없으면 "확인 불가"

## 원인 추정
- "추정:" 접두어로 1~2개

## 조치 권고
- 운영자 확인/조치 항목"""


BUILDERS = {
    "daily": build_daily_prompt,
    "weekly": build_weekly_prompt,
    "event": build_event_prompt,
}

# 하위 호환 (기존 import 지점)
SYSTEM = SYSTEM_KO

"""LLM 공급자 — llmwiki/llm 패키지의 포팅.

claude   : Anthropic API (개발/데모)
ollama   : 사내 Ollama (망분리 환경)
template : LLM 없이 사실만으로 문서 골격 생성 (스모크 테스트 · API 키 없는 환경)
config.yaml 의 llm.provider 한 줄로 전환한다.
"""

from __future__ import annotations

import json
from typing import Any, Protocol


class LLMProvider(Protocol):
    name: str
    model: str

    def complete(self, system: str, prompt: str) -> str: ...


def get_provider(provider: str, options: dict[str, Any]) -> LLMProvider:
    if provider == "claude":
        return ClaudeProvider(options)
    if provider == "grok":
        return GrokProvider(options)
    if provider == "ollama":
        return OllamaProvider(options)
    if provider == "template":
        return TemplateProvider(options)
    raise ValueError(f"알 수 없는 LLM provider: {provider} (claude | grok | ollama | template)")


class GrokProvider:
    """xAI Grok — OpenAI 호환 스펙(POST /v1/chat/completions), httpx 만으로 충분.

    키는 XAI_API_KEY 환경변수에서만 읽는다. config·대화·저장소에 절대 적지 않는다.
    (llmwiki llm/grok.py 와 동일 규약)
    """

    name = "grok"

    def __init__(self, options: dict[str, Any]) -> None:
        import os

        self.base_url = str(
            options.get("base_url") or os.environ.get("XAI_BASE_URL") or "https://api.x.ai/v1"
        ).rstrip("/")
        self.model = options.get("model") or os.environ.get("XAI_MODEL") \
            or "grok-4.20-0309-non-reasoning"
        self.max_tokens = int(options.get("max_tokens", 8000))
        self.temperature = float(options.get("temperature", 0.2))
        self.timeout = float(options.get("timeout", 300))
        self.api_key = os.environ.get("XAI_API_KEY", "")

    def complete(self, system: str, prompt: str) -> str:
        import httpx

        if not self.api_key:
            raise RuntimeError("XAI_API_KEY 환경변수가 없습니다 — 서버 .env 에만 넣으세요")
        payload = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "temperature": self.temperature,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": prompt},
            ],
        }
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(
                f"{self.base_url}/chat/completions",
                headers={"Authorization": f"Bearer {self.api_key}"},
                json=payload,
            )
            resp.raise_for_status()
            data = resp.json()
        return (data["choices"][0]["message"]["content"] or "").strip()


class ClaudeProvider:
    name = "claude"

    def __init__(self, options: dict[str, Any]) -> None:
        import anthropic

        self.model = options.get("model", "claude-sonnet-5")
        self.max_tokens = int(options.get("max_tokens", 8000))
        self.effort = options.get("effort", "medium")
        self.client = anthropic.Anthropic()  # ANTHROPIC_API_KEY 에서 해석

    def complete(self, system: str, prompt: str) -> str:
        with self.client.messages.stream(
            model=self.model,
            max_tokens=self.max_tokens,
            output_config={"effort": self.effort},
            system=[{"type": "text", "text": system,
                     "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            message = stream.get_final_message()
        return "".join(b.text for b in message.content if b.type == "text").strip()


class OllamaProvider:
    name = "ollama"

    def __init__(self, options: dict[str, Any]) -> None:
        import httpx  # noqa: F401

        self.base_url = options.get("base_url", "http://localhost:11434").rstrip("/")
        self.model = options.get("model", "qwen2.5-coder:32b")
        self.num_ctx = int(options.get("num_ctx", 32768))
        self.keep_alive = options.get("keep_alive", "30m")
        self.timeout = float(options.get("timeout", 900))

    def complete(self, system: str, prompt: str) -> str:
        import httpx

        payload = {
            "model": self.model, "stream": False, "keep_alive": self.keep_alive,
            "options": {"num_ctx": self.num_ctx},
            "messages": [{"role": "system", "content": system},
                         {"role": "user", "content": prompt}],
        }
        with httpx.Client(timeout=self.timeout) as client:
            resp = client.post(f"{self.base_url}/api/chat", json=payload)
            resp.raise_for_status()
            data = resp.json()
        return (data.get("message", {}).get("content") or "").strip()


# 언어별 고정 문구 — 사실은 그대로, 서술 칸만 표시 언어를 따른다
TP = {
    "ko": {
        "todo": "_(LLM 생성 필요 — provider 를 claude/ollama 로 바꿔 재생성)_",
        "warning": ("> ⚠️ 이 문서는 **SQL 사실만으로 생성**되었습니다 (template provider). "
                    "서술 항목을 채우려면 LLM 공급자(claude / ollama)로 재생성하세요."),
        "na": "확인 불가", "insight": "인사이트",
        "daily_title": "일간 운영 브리프", "weekly_title": "주간 성능 리포트",
        "summary": "오늘의 요약", "gen_cons": "발전·소비", "battery": "배터리 운전",
        "accuracy": "예측 정확도", "events": "이상 이벤트", "obs": "관찰 및 추정",
        "tomorrow": "내일 점검 포인트",
        "w_summary": "주간 요약", "w_daily": "일별 추이", "w_perf": "예측 성능",
        "w_events": "이벤트 리뷰", "w_next": "다음 주 개선 항목",
        "period": "기간", "item": "항목", "value": "값",
        "total_gen": "총 발전", "total_cons": "총 소비", "imp": "수전(import)", "exp": "역송(export)",
        "peak_gen": "발전 피크", "peak_cons": "소비 피크",
        "self_cons": "자가소비율", "self_suff": "자립률", "missing": "데이터 결측률",
        "gen": "발전", "cons": "소비", "vs_prev": "전일 대비", "vs_7d": "7일 평균 대비",
        "charge": "충전", "discharge": "방전", "avg": "평균",
        "acc_head": "| 타깃 | 모델 | MAPE % | RMSE kW | 표본 |",
        "acc_empty": "확인 불가 (예측 데이터 없음)",
        "no_events": "이상 없음", "total_cnt": "총",
        "daily_head": "| 날짜 | 발전 kWh | 소비 kWh | 자가소비율 % | 자립률 % | 결측률 % |",
        "ev_overview": "이벤트 개요", "ev_ctx": "전후 1시간 계측 요약",
        "ev_cause": "원인 추정", "ev_action": "조치 권고",
        "ev_type": "유형", "ev_sev": "심각도", "ev_detail": "상세",
    },
    "en": {
        "todo": "_(LLM generation required — regenerate with provider claude/ollama)_",
        "warning": ("> ⚠️ This document was generated **from SQL facts only** (template provider). "
                    "Regenerate with an LLM provider (claude / ollama) to fill in the narrative sections."),
        "na": "Not verifiable", "insight": "Insight",
        "daily_title": "Daily Operations Brief", "weekly_title": "Weekly Performance Report",
        "summary": "Today's Summary", "gen_cons": "Generation & Consumption", "battery": "Battery Operation",
        "accuracy": "Forecast Accuracy", "events": "Anomaly Events", "obs": "Observations & Assumptions",
        "tomorrow": "Tomorrow's Checkpoints",
        "w_summary": "Weekly Summary", "w_daily": "Daily Trend", "w_perf": "Forecast Performance",
        "w_events": "Event Review", "w_next": "Next Week's Improvements",
        "period": "Period", "item": "Item", "value": "Value",
        "total_gen": "Total generation", "total_cons": "Total consumption",
        "imp": "Grid import", "exp": "Grid export",
        "peak_gen": "Generation peak", "peak_cons": "Consumption peak",
        "self_cons": "Self-consumption", "self_suff": "Self-sufficiency", "missing": "Data missing rate",
        "gen": "Generation", "cons": "Consumption", "vs_prev": "vs previous day", "vs_7d": "vs 7-day avg",
        "charge": "Charged", "discharge": "Discharged", "avg": "avg",
        "acc_head": "| Target | Model | MAPE % | RMSE kW | Samples |",
        "acc_empty": "Not verifiable (no forecast data)",
        "no_events": "No anomalies", "total_cnt": "Total",
        "daily_head": "| Date | Gen kWh | Cons kWh | Self-cons % | Self-suff % | Missing % |",
        "ev_overview": "Event Overview", "ev_ctx": "Measurements ±1 Hour",
        "ev_cause": "Assumed Causes", "ev_action": "Recommended Actions",
        "ev_type": "Type", "ev_sev": "Severity", "ev_detail": "Detail",
    },
}


class TemplateProvider:
    """LLM 없이 사실을 표로 정리한다. 절대 내용을 지어내지 않는다. (ko/en)"""

    name = "template"
    model = "facts-only"

    def __init__(self, options: dict[str, Any] | None = None) -> None:
        self.options = options or {}

    def complete(self, system: str, prompt: str) -> str:  # noqa: ARG002
        self.lang = "en" if "[FACTS]" in prompt else "ko"
        self.L = TP[self.lang]
        facts = self._extract_facts(prompt)
        if not facts:
            return f"# {self.L['insight']}\n\n{self.L['warning']}\n\n{self.L['todo']}"
        dt = facts.get("doc_type")
        if dt == "daily":
            return self._daily(facts)
        if dt == "weekly":
            return self._weekly(facts)
        if dt == "event":
            return self._event(facts)
        return f"# {self.L['insight']}\n\n{self.L['warning']}\n\n{self.L['todo']}"

    @staticmethod
    def _extract_facts(prompt: str) -> dict[str, Any] | None:
        start = prompt.find("```json")
        end = prompt.find("```", start + 7)
        if start < 0 or end < 0:
            return None
        try:
            return json.loads(prompt[start + 7:end])
        except json.JSONDecodeError:
            return None

    def _fmt(self, v: Any, suffix: str = "") -> str:
        return f"{v}{suffix}" if v is not None else self.L["na"]

    def _weekday(self, f: dict[str, Any]) -> str:
        if self.lang == "ko":
            return f.get("weekday", "")
        from .prompts_ng import weekday_label

        return weekday_label(f, "en")

    def _accuracy_table(self, acc: list[dict[str, Any]]) -> list[str]:
        if not acc:
            return [self.L["acc_empty"]]
        out = [self.L["acc_head"], "|---|---|---|---|---|"]
        for a in acc:
            out.append(f"| {a.get('target')} | {a.get('model')} | {self._fmt(a.get('mape_pct'))} "
                       f"| {self._fmt(a.get('rmse_kw'))} | {self._fmt(a.get('n'))} |")
        return out

    def _events_lines(self, ev: dict[str, Any]) -> list[str]:
        if not ev or not ev.get("count"):
            return [self.L["no_events"]]
        sev = ev.get("by_severity", {})
        out = [f"{self.L['total_cnt']} {ev['count']} (critical {sev.get('critical', 0)} / "
               f"warning {sev.get('warning', 0)} / info {sev.get('info', 0)})", ""]
        for it in ev.get("items", []):
            out.append(f"- `{it['ts']}` [{it['severity']}] **{it['title']}** — {it.get('detail') or ''}")
        return out

    def _daily(self, f: dict[str, Any]) -> str:
        L, e, c = self.L, f.get("energy", {}), f.get("compare", {})
        lines = [
            f"# {f['date']} ({self._weekday(f)}) {L['daily_title']} — {f['site']}", "",
            L["warning"], "",
            f"## {L['summary']}", "",
            f"- {L['gen']} {self._fmt(e.get('gen_kwh'), ' kWh')} · {L['cons']} {self._fmt(e.get('cons_kwh'), ' kWh')}",
            f"- {L['vs_prev']}: {L['gen']} {self._fmt(c.get('gen_vs_prev_day_pct'), '%')}, "
            f"{L['cons']} {self._fmt(c.get('cons_vs_prev_day_pct'), '%')}",
            f"- {L['vs_7d']}: {L['gen']} {self._fmt(c.get('gen_vs_7d_avg_pct'), '%')}, "
            f"{L['cons']} {self._fmt(c.get('cons_vs_7d_avg_pct'), '%')}", "",
            f"## {L['gen_cons']}", "",
            f"| {L['item']} | {L['value']} |", "|---|---|",
            f"| {L['total_gen']} | {self._fmt(e.get('gen_kwh'), ' kWh')} |",
            f"| {L['total_cons']} | {self._fmt(e.get('cons_kwh'), ' kWh')} |",
            f"| {L['imp']} | {self._fmt(e.get('import_kwh'), ' kWh')} |",
            f"| {L['exp']} | {self._fmt(e.get('export_kwh'), ' kWh')} |",
            f"| {L['peak_gen']} | {self._fmt(e.get('peak_gen_kw'), ' kW')} @ {self._fmt(e.get('peak_gen_at'))} |",
            f"| {L['peak_cons']} | {self._fmt(e.get('peak_cons_kw'), ' kW')} @ {self._fmt(e.get('peak_cons_at'))} |",
            f"| {L['self_cons']} | {self._fmt(e.get('self_consumption_pct'), '%')} |",
            f"| {L['self_suff']} | {self._fmt(e.get('self_sufficiency_pct'), '%')} |",
            f"| {L['missing']} | {self._fmt(e.get('missing_pct'), '%')} |", "",
            f"## {L['battery']}", "",
            f"- SoC {self._fmt(e.get('soc_min_pct'), '%')} ~ {self._fmt(e.get('soc_max_pct'), '%')} "
            f"({L['avg']} {self._fmt(e.get('soc_avg_pct'), '%')})",
            f"- {L['charge']} {self._fmt(e.get('batt_charge_kwh'), ' kWh')} · "
            f"{L['discharge']} {self._fmt(e.get('batt_discharge_kwh'), ' kWh')}", "",
            f"## {L['accuracy']}", "",
            *self._accuracy_table(f.get("forecast_accuracy", [])), "",
            f"## {L['events']}", "",
            *self._events_lines(f.get("events", {})), "",
            f"## {L['obs']}", "", L["todo"], "",
            f"## {L['tomorrow']}", "", L["todo"],
        ]
        return "\n".join(lines)

    def _weekly(self, f: dict[str, Any]) -> str:
        L, t = self.L, f.get("totals", {})
        lines = [
            f"# {f['week']} {L['weekly_title']} — {f['site']}", "",
            L["warning"], "",
            f"## {L['w_summary']}", "",
            f"- {L['period']}: {f['period']['start']} ~ {f['period']['end']}",
            f"- {L['total_gen']} {self._fmt(t.get('gen_kwh'), ' kWh')} · "
            f"{L['total_cons']} {self._fmt(t.get('cons_kwh'), ' kWh')}",
            f"- {L['imp']} {self._fmt(t.get('import_kwh'), ' kWh')} · "
            f"{L['exp']} {self._fmt(t.get('export_kwh'), ' kWh')}",
            f"- {L['self_cons']} {self._fmt(t.get('self_consumption_pct'), '%')} · "
            f"{L['self_suff']} {self._fmt(t.get('self_sufficiency_pct'), '%')}", "",
            f"## {L['w_daily']}", "",
            L["daily_head"],
            "|---|---|---|---|---|---|",
        ]
        for d in f.get("daily", []):
            lines.append(f"| {d['date']} | {self._fmt(d.get('gen_kwh'))} | {self._fmt(d.get('cons_kwh'))} "
                         f"| {self._fmt(d.get('self_consumption_pct'))} "
                         f"| {self._fmt(d.get('self_sufficiency_pct'))} | {self._fmt(d.get('missing_pct'))} |")
        lines += [
            "", f"## {L['w_perf']}", "",
            *self._accuracy_table(f.get("forecast_accuracy", [])), "",
            f"## {L['w_events']}", "",
            *self._events_lines(f.get("events", {})), "",
            f"## {L['obs']}", "", L["todo"], "",
            f"## {L['w_next']}", "", L["todo"],
        ]
        return "\n".join(lines)

    def _event(self, f: dict[str, Any]) -> str:
        L = self.L
        ev = f.get("event", {})
        c = f.get("context_1h") or {}
        return "\n".join([
            f"# [{str(ev.get('severity', '')).upper()}] {ev.get('title', L['insight'])} — {ev.get('ts', '')}", "",
            L["warning"], "",
            f"## {L['ev_overview']}", "",
            f"- {L['ev_type']}: `{ev.get('type')}` · {L['ev_sev']}: **{ev.get('severity')}**",
            f"- {L['ev_detail']}: {ev.get('detail') or L['na']}", "",
            f"## {L['ev_ctx']}", "",
            f"- {L['gen']} {self._fmt(c.get('gen_kwh'), ' kWh')} · {L['cons']} {self._fmt(c.get('cons_kwh'), ' kWh')}",
            f"- SoC {self._fmt(c.get('soc_min_pct'), '%')} ~ {self._fmt(c.get('soc_max_pct'), '%')}", "",
            f"## {L['ev_cause']}", "", L["todo"], "",
            f"## {L['ev_action']}", "", L["todo"],
        ])

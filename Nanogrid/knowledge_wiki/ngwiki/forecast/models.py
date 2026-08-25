"""시계열 예측 모델.

multi_mcp_system(forecasting MCP: LSTM/MultiStep/CNN-LSTM)을 HTTP로 래핑하는 것이
기획서의 최종 형태다. 이 모듈은 그 래퍼가 도착하기 전에도 /ng/forecast 메뉴가
E2E로 돌도록 numpy 만으로 동작하는 통계 모델 4종을 제공하고,
동일 인터페이스(fit/predict) 뒤에 LSTM 계열을 끼울 자리를 남긴다.

시계열 규약: 등간격(step_min)이며 t 시점 예측은 학습 구간 데이터만 사용한다.
"""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime
from typing import Sequence

import numpy as np

STEPS_PER_DAY_CACHE: dict[int, int] = {}


@dataclass
class SeriesPoint:
    ts: datetime
    value: float


class BaseModel:
    key = "base"
    label = "base"

    def __init__(self, step_min: int):
        self.step_min = step_min
        self.per_day = max(1, (24 * 60) // step_min)

    def fit(self, train: Sequence[SeriesPoint]) -> None:  # noqa: B027
        pass

    def predict(self, horizon_ts: Sequence[datetime]) -> list[float]:
        raise NotImplementedError


class SeasonalNaive24h(BaseModel):
    """전일 동시각 값. day-ahead 기본선 — MAPE 비교의 벤치마크."""

    key = "seasonal_naive_24h"
    label = "Seasonal Naive (24h)"

    def fit(self, train: Sequence[SeriesPoint]) -> None:
        self.last_day = {p.ts.astimezone().strftime("%H:%M"): p.value
                         for p in train[-self.per_day:]}
        self.fallback = float(np.mean([p.value for p in train[-self.per_day:]])) if train else 0.0

    def predict(self, horizon_ts: Sequence[datetime]) -> list[float]:
        return [self.last_day.get(t.astimezone().strftime("%H:%M"), self.fallback)
                for t in horizon_ts]


class MovingAverage(BaseModel):
    """최근 7일 동시각 평균."""

    key = "moving_average_7d"
    label = "Moving Average (7d, by time-of-day)"

    def fit(self, train: Sequence[SeriesPoint]) -> None:
        buckets: dict[str, list[float]] = {}
        for p in train[-7 * self.per_day:]:
            buckets.setdefault(p.ts.astimezone().strftime("%H:%M"), []).append(p.value)
        self.avg = {k: float(np.mean(v)) for k, v in buckets.items()}
        self.fallback = float(np.mean([p.value for p in train])) if train else 0.0

    def predict(self, horizon_ts: Sequence[datetime]) -> list[float]:
        return [self.avg.get(t.astimezone().strftime("%H:%M"), self.fallback)
                for t in horizon_ts]


class HourlyProfile(BaseModel):
    """요일유형(평일/주말) × 시각 평균 프로파일."""

    key = "hourly_profile"
    label = "Hourly Profile (weekday/weekend)"

    @staticmethod
    def _bucket(t: datetime) -> str:
        kind = "we" if t.astimezone().weekday() >= 5 else "wd"
        return f"{kind}-{t.astimezone().strftime('%H:%M')}"

    def fit(self, train: Sequence[SeriesPoint]) -> None:
        buckets: dict[str, list[float]] = {}
        for p in train:
            buckets.setdefault(self._bucket(p.ts), []).append(p.value)
        self.avg = {k: float(np.mean(v)) for k, v in buckets.items()}
        self.fallback = float(np.mean([p.value for p in train])) if train else 0.0

    def predict(self, horizon_ts: Sequence[datetime]) -> list[float]:
        return [self.avg.get(self._bucket(t), self.fallback) for t in horizon_ts]


class RidgeHourly(BaseModel):
    """시각 더미 + 추세 + 전일 동시각 잔차를 쓰는 릿지 회귀 (numpy lstsq)."""

    key = "ridge_hourly"
    label = "Ridge Regression (hour dummies + trend)"

    def _features(self, t: datetime, t0: datetime) -> np.ndarray:
        lt = t.astimezone()
        h = lt.hour + lt.minute / 60
        days = (t - t0).total_seconds() / 86400
        return np.array([
            1.0, days,
            math.sin(2 * math.pi * h / 24), math.cos(2 * math.pi * h / 24),
            math.sin(4 * math.pi * h / 24), math.cos(4 * math.pi * h / 24),
            math.sin(6 * math.pi * h / 24), math.cos(6 * math.pi * h / 24),
            1.0 if lt.weekday() >= 5 else 0.0,
        ])

    def fit(self, train: Sequence[SeriesPoint]) -> None:
        if not train:
            self.w = np.zeros(9)
            self.t0 = datetime.now().astimezone()
            return
        self.t0 = train[0].ts
        X = np.stack([self._features(p.ts, self.t0) for p in train])
        y = np.array([p.value for p in train])
        lam = 1e-3
        A = X.T @ X + lam * np.eye(X.shape[1])
        self.w = np.linalg.solve(A, X.T @ y)

    def predict(self, horizon_ts: Sequence[datetime]) -> list[float]:
        X = np.stack([self._features(t, self.t0) for t in horizon_ts])
        return [max(0.0, float(v)) for v in X @ self.w]


MODEL_REGISTRY: dict[str, type[BaseModel]] = {
    m.key: m for m in (SeasonalNaive24h, MovingAverage, HourlyProfile, RidgeHourly)
}

# multi_mcp_system LSTM 계열 연동 자리 (P3+):
# forecasting MCP 의 train/predict tool 을 HTTP 로 호출하는 프록시 모델을
# MODEL_REGISTRY["lstm"] = McpLstmProxy 로 등록하면 UI/실험이력은 그대로 동작한다.


def metrics(actual: Sequence[float], pred: Sequence[float]) -> dict[str, float | int]:
    a = np.array(actual, dtype=float)
    p = np.array(pred, dtype=float)
    mask = a > 0.5  # 야간 0값에서 MAPE 폭주 방지 (기획서 §3-3의 MAPE 산정 규약)
    mape = float(np.mean(np.abs(a[mask] - p[mask]) / a[mask]) * 100) if mask.any() else None
    return {
        "mape_pct": round(mape, 2) if mape is not None else None,
        "rmse": round(float(np.sqrt(np.mean((a - p) ** 2))), 3),
        "mae": round(float(np.mean(np.abs(a - p))), 3),
        "n": int(len(a)),
    }

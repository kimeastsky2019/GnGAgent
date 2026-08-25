"""psycopg 기반 DB 헬퍼. SQLAlchemy 없이 얇게 간다 — 사실 수집은 순수 SQL이 핵심."""

from __future__ import annotations

import time
from contextlib import contextmanager
from typing import Any, Iterator

import psycopg
from psycopg.rows import dict_row


def connect(db_url: str, retries: int = 30, delay: float = 2.0) -> psycopg.Connection:
    """DB가 뜰 때까지 재시도하며 연결한다 (compose 기동 순서 대비)."""
    last: Exception | None = None
    for _ in range(retries):
        try:
            return psycopg.connect(db_url, row_factory=dict_row, autocommit=True)
        except psycopg.OperationalError as e:  # noqa: PERF203
            last = e
            time.sleep(delay)
    raise RuntimeError(f"DB 연결 실패: {db_url}") from last


@contextmanager
def cursor(db_url: str) -> Iterator[psycopg.Cursor]:
    conn = connect(db_url)
    try:
        with conn.cursor() as cur:
            yield cur
    finally:
        conn.close()


def query(db_url: str, sql: str, params: tuple | dict | None = None) -> list[dict[str, Any]]:
    with cursor(db_url) as cur:
        cur.execute(sql, params)
        if cur.description is None:
            return []
        return cur.fetchall()


def one(db_url: str, sql: str, params: tuple | dict | None = None) -> dict[str, Any] | None:
    rows = query(db_url, sql, params)
    return rows[0] if rows else None

"""SP-G 실계측 MQTT 수집기 — 1차년도 크리티컬 패스(실계측 전환)의 어댑터.

시뮬레이터(simulator.py)와 같은 테이블(ng.measurements)에 source='spg' 로 적재한다.
브로커 정보가 없으면 안내 후 종료하므로, 코드는 미리 배포해 두고
게이트웨이가 준비되는 날 환경변수만 넣으면 전환된다. 시뮬과 병행 운전 가능
(site_id 를 다르게 주거나, 같은 사이트면 spg 가 우선하도록 UPSERT).

환경변수:
  SPG_MQTT_HOST / SPG_MQTT_PORT (기본 1883) / SPG_MQTT_TOPIC (기본 spg/+/telemetry)
  SPG_MQTT_USER / SPG_MQTT_PASS (선택)
  SPG_SITE_ID (기본 1)

페이로드(JSON) 규약 — 게이트웨이 팀과 합의한 최소 필드:
  {"ts": "2027-01-01T00:15:00+09:00",   # 없으면 수신 시각
   "generation_kw": 12.3, "consumption_kw": 20.1,
   "battery_soc_pct": 55.0, "battery_power_kw": -3.2,
   "grid_import_kw": 11.0, "grid_export_kw": 0.0,
   "temp_c": 21.5, "irradiance_wm2": 640}

실행: python -m ngwiki.ingest.mqtt_collector
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone

from ..config import load_config
from ..db import connect

log = logging.getLogger("ngwiki.spg")

UPSERT_SQL = """
INSERT INTO ng.measurements(site_id, ts, generation_kw, consumption_kw, battery_soc_pct,
  battery_power_kw, grid_import_kw, grid_export_kw, temp_c, irradiance_wm2, source)
VALUES (%(site_id)s, %(ts)s, %(generation_kw)s, %(consumption_kw)s, %(battery_soc_pct)s,
  %(battery_power_kw)s, %(grid_import_kw)s, %(grid_export_kw)s, %(temp_c)s, %(irradiance_wm2)s, 'spg')
ON CONFLICT (site_id, ts) DO UPDATE SET
  generation_kw=EXCLUDED.generation_kw, consumption_kw=EXCLUDED.consumption_kw,
  battery_soc_pct=EXCLUDED.battery_soc_pct, battery_power_kw=EXCLUDED.battery_power_kw,
  grid_import_kw=EXCLUDED.grid_import_kw, grid_export_kw=EXCLUDED.grid_export_kw,
  temp_c=EXCLUDED.temp_c, irradiance_wm2=EXCLUDED.irradiance_wm2,
  source='spg'  -- 실계측이 시뮬 값을 항상 이긴다
"""

NUM_FIELDS = ("generation_kw", "consumption_kw", "battery_soc_pct", "battery_power_kw",
              "grid_import_kw", "grid_export_kw", "temp_c", "irradiance_wm2")


def _parse(payload: bytes, site_id: int) -> dict | None:
    try:
        data = json.loads(payload)
    except json.JSONDecodeError:
        log.warning("JSON 아님: %r", payload[:100])
        return None
    row = {"site_id": site_id}
    ts = data.get("ts")
    try:
        row["ts"] = datetime.fromisoformat(ts) if ts else datetime.now(timezone.utc)
    except ValueError:
        row["ts"] = datetime.now(timezone.utc)
    for f in NUM_FIELDS:
        v = data.get(f)
        try:
            row[f] = float(v) if v is not None else (0.0 if f.endswith("_kw") else None)
        except (TypeError, ValueError):
            row[f] = 0.0 if f.endswith("_kw") else None
    return row


def run() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(message)s")
    host = os.environ.get("SPG_MQTT_HOST", "")
    if not host:
        log.info("SPG_MQTT_HOST 미설정 — SP-G 수집기는 대기 상태입니다. "
                 "게이트웨이 준비 시 SPG_MQTT_HOST/TOPIC 을 설정하고 재기동하세요.")
        return
    try:
        import paho.mqtt.client as mqtt
    except ImportError:
        log.error("paho-mqtt 미설치 — requirements.txt 반영 후 재빌드 필요")
        return

    port = int(os.environ.get("SPG_MQTT_PORT", "1883"))
    topic = os.environ.get("SPG_MQTT_TOPIC", "spg/+/telemetry")
    site_id = int(os.environ.get("SPG_SITE_ID", "1"))
    cfg = load_config()
    conn = connect(cfg.db_url)

    def on_connect(client, userdata, flags, reason_code, properties=None):  # noqa: ANN001
        log.info("MQTT 연결 %s:%s → subscribe %s (rc=%s)", host, port, topic, reason_code)
        client.subscribe(topic, qos=1)

    def on_message(client, userdata, msg):  # noqa: ANN001
        row = _parse(msg.payload, site_id)
        if not row:
            return
        try:
            with conn.cursor() as cur:
                cur.execute(UPSERT_SQL, row)
        except Exception:  # noqa: BLE001 — 수집 루프는 죽지 않는다
            log.exception("적재 실패: %s", msg.topic)

    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    user, pw = os.environ.get("SPG_MQTT_USER"), os.environ.get("SPG_MQTT_PASS")
    if user:
        client.username_pw_set(user, pw or "")
    client.on_connect = on_connect
    client.on_message = on_message
    client.connect(host, port, keepalive=60)
    client.loop_forever(retry_first_connection=True)


if __name__ == "__main__":
    run()

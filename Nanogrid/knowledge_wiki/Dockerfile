# 모든 파이썬 서비스(wiki-server / forecast-svc / ingest / insight-worker)가
# 이 이미지 하나를 공유하고 command 만 달리한다 — 빌드·배포 단순화.
FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY config.yaml .
COPY ngwiki ./ngwiki

ENV PYTHONUNBUFFERED=1
CMD ["uvicorn", "ngwiki.server.main:app", "--host", "0.0.0.0", "--port", "8720"]

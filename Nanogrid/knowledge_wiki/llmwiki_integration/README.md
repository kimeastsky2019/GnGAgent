# llmwiki 포털 통합 (기획서 결정사항 ③-(a))

llmwiki 를 **단일 포털 "NanoGrid AI System"** 으로 만든다. 기존 소스 위키(기관계 트리·검색·소스 브라우저)는 그대로 공존한다 (채널계 '내 계좌 조회' 샘플은 제외 — config.yaml layers/exclude).

## 메뉴 구조 — 사이드바 상단 모드 탭 2개로 전환

```
NanoGrid AI System
│
├─ [탭 1] 소스 분석 — "운영 소스 → 명세서 · 규제 준수"
│   ├─ 프로젝트 선택 (nanogrid_AI_management_system)
│   ├─ 검색 (계좌, TB_CUST, CustomerMapper …)
│   ├─ 소스 위키 트리 (기관계: 고객 정보 관리 — AI-Gov 판정 대상 업무)
│   ├─ AI-Gov 규제준수
│   │   └─ 📜 법률 분석·체크리스트 /ng/gov   (법률 업로드→AI 분석→근거 인용 체크리스트)
│   └─ 테이블 목록 · 소스 브라우저
│
└─ [탭 2] 데이터 지식화 — "데이터 → 지식베이스 · 위키"
    ├─ 나노그리드 운영
    │   ├─ ⚡ 실시간 모니터링   /ng/monitor
    │   │    ├─ 에너지 개요       (KPI 5종 + 24h 실측/예측 오버레이 + 최신 인사이트)
    │   │    ├─ EV 충전기         /ng/monitor/ev     (충전기 4기 상태·세션·금일 실적)
    │   │    └─ 이상 이벤트       /ng/monitor/events
    │   └─ 📈 시계열 예측 랩    /ng/forecast        (학습→예측→평가→최적모델, 실험 이력)
    └─ 지식 데이터베이스
        ├─ 🗄 지식 DB 구축      /ng/knowledge       (수집→예측→문서화 현황·데이터 품질)
        ├─ 🧠 지식과 통찰       /ng/insights        (인사이트 위키 + 검색, 세부: 일간/주간/이벤트 문서 트리)
        └─ ⚙ Wiki 관리자       /ng/admin           (LLM 공급자, 재생성, 내일 예측 발행)
```

탭 전환 시 대표 화면으로 이동(소스 분석→홈, 데이터 지식화→모니터링)하고, URL 직접 이동 시에도 라우트에 맞는 탭이 자동 활성화된다(`ngModeForPath`).

## 적용 방법 (llmwiki 레포에)

```bash
cd llmwiki
git apply llmwiki_changes.patch          # App.tsx·styles.css·app.py·config.yaml·package.json 수정분
cp llmwiki/server/ng_proxy.py <레포>/llmwiki/server/
cp web/src/NanoGrid.tsx      <레포>/web/src/
cp web/public/gng-logo.png   <레포>/web/public/    # GnG 로고 (브랜드 영역)
cd web && npm install                    # recharts 포함
```

## 다국어 (KO/EN)

나노그리드 화면 전체가 llmwiki 의 기존 KO/EN 토글(`useLang`)을 따른다 — 메뉴·페이지 제목·KPI·차트 범례·버튼·상태·AI-Gov 화면까지 이중 언어. 날짜/시간 포맷도 언어에 맞춰(en-US/ko-KR) 표시된다. 인사이트 문서 **본문**의 언어는 데이터이므로 `knowledge_wiki/config.yaml` 의 `insight.language` 로 결정된다(영문 문서를 원하면 en 으로 두고 재생성).

## 변경 요약

| 파일 | 내용 |
|---|---|
| `llmwiki/server/ng_proxy.py` (신규) | `/api/ng/*` → ngwiki wiki-server(기본 127.0.0.1:8720, env `NGWIKI_API`) 프록시. 웹은 llmwiki 서버 하나만 본다 |
| `llmwiki/server/app.py` | `app.include_router(ng_router, prefix="/api/ng")` 한 줄 (SPA 캐치올보다 먼저) |
| `web/src/NanoGrid.tsx` (신규) | NgSection(그룹형 사이드바+세부메뉴) + NgMonitor(에너지/EV/이벤트 서브탭) + NgForecast + NgKnowledgeDb + NgInsights + NgAdmin + NgGov + NgDocView |
| `web/src/App.tsx` | `/ng/*` 라우트 9종 + 사이드바에 NgSection 삽입 |
| `web/src/styles.css` | `.ng-*` 스타일 (EV 카드·체크리스트·서브탭 포함) |
| `web/package.json` | recharts 추가 |
| `config.yaml` | 프로젝트명 "NanoGrid AI System", 채널계 샘플 제외 |

## 실행 (전체 포털)

```bash
# 1. ngwiki 스택 (knowledge_wiki/) — DB·ingest·insight-worker·forecast-svc·wiki-server:8720
cd Nanogrid/knowledge_wiki && docker compose up -d --build

# 2. llmwiki 포털 서버 (8722) — NGWIKI_API 로 ngwiki 를 가리킴
cd llmwiki && NGWIKI_API=http://127.0.0.1:8720 uvicorn llmwiki.server.app:app --port 8722

# 3. 웹 (개발: 5173 / 운영: cd web && npm run build 후 8722 가 정적 서빙)
cd web && npm run dev
```

브라우저에서 http://localhost:5173 → 사이드바 "나노그리드".

검증 완료(2026-08-26 로컬): 모니터링 KPI·24h 예측 오버레이 차트, 인사이트 문서 렌더(일간 7·주간 1), 예측 랩 최적 모델 선택(hourly_profile MAPE 4.07%, 실험 이력 5건 축적).

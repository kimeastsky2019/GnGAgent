# NanoGrid Simulation Starter

NanoGrid 수요-공급 매칭 시뮬레이션 시스템

## 구성
- **docker-compose.yml**: TimescaleDB + FastAPI 백엔드 + Adminer + 프론트엔드
- **db/init.sql**: 스키마 및 하이퍼테이블 생성
- **backend/**: FastAPI 백엔드 API
- **frontend/**: React + Tailwind (Vite) 프론트엔드

## 빠른 시작

### 1. Docker Compose로 전체 스택 실행
```bash
docker compose up -d --build
```

서비스 접속:
- 백엔드 API: http://localhost:8000
- API 문서 (Swagger): http://localhost:8000/docs
- API 문서 (ReDoc): http://localhost:8000/redoc
- 프론트엔드: http://localhost:3000
- Adminer: http://localhost:8080 (System: PostgreSQL, Server: db, User: ngadmin, Pass: ngpass, DB: nanogrid)

### 2. 프론트엔드 개발 모드
```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

### 3. 기본 사이트 생성
```bash
# 백엔드 컨테이너에서 실행
docker exec -it ng_backend python -m backend.scripts.create_default_site
```

## API 문서

FastAPI는 자동으로 OpenAPI 문서를 생성합니다:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 환경 변수 설정

### 백엔드 환경 변수
`backend/.env` 파일 생성 (예시는 `backend/.env.example` 참고):
```env
DATABASE_URL=postgresql+psycopg://ngadmin:ngpass@localhost:5432/nanogrid
UVICORN_HOST=0.0.0.0
UVICORN_PORT=8000
APP_ENV=development
APP_SECRET=change-me-in-production
```

### 프론트엔드 환경 변수
`frontend/.env` 파일 생성 (예시는 `frontend/.env.example` 참고):
```env
VITE_API_BASE_URL=http://localhost:8000
```

## 주요 기능

### 백엔드 API
- **사이트 관리** (`/sites`): 사이트 생성, 조회
- **시뮬레이션 실행** (`/sim-runs`): 수요-공급 매칭 시뮬레이션 실행
- **결과 조회** (`/results`): 시뮬레이션 결과 및 KPI 조회
- **시계열 데이터** (`/timeseries`): 시뮬레이션 시계열 데이터 조회

### 프론트엔드
- **대시보드**: 프로젝트 개요
- **시뮬레이터**: 클라이언트 사이드 시뮬레이션 (CSV 업로드, 파라미터 설정, 결과 비교)
- **API 테스트**: 백엔드 API 통합 테스트

## 다음 단계
- [x] 백엔드 API 구현 완료
- [x] 프론트엔드 구조 정리
- [x] 환경 변수 설정
- [x] API 문서화
- [ ] 시계열 데이터 저장 및 조회 구현
- [ ] 큐(예: Redis + RQ/Celery) 연동 후 비동기 시뮬레이션 실행
- [ ] 프론트엔드 API 통합 완료

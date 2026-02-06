/**
 * 기획·설계 단계별 상세 구축요건 (Process / Activity / 기능명 / 상세 구축요건 / 설명)
 *
 * Phase별 그룹:
 *   planning     - request-form, project-create, planning-doc, model-doc
 *   review       - pre-review-request, pre-review-result, risk-assessment
 *   development  - dev-plan, risk-plan, risk-plan-approval, governance-approval, dev-request, dev-progress
 *   verification - pre-op-verification, verification-adequacy, third-party-verification, op-approval-request, deployment-approval, deployment
 *   operations   - improvement
 */

import type { FlowPhaseId } from "./flow";

export interface FlowFeatureDetail {
  /** 기능명 */
  featureName: string;
  /** 상세 구축요건 */
  requirement: string;
  /** 설명 */
  description: string;
  /** UI 렌더링 타입 (기본값: default - 텍스트박스+파일) */
  uiType?: 'default' | 'approval' | 'selection' | 'monitoring' | 'upload_only' | 'checklist' | 'dashboard_link';
  /** 하단 액션 버튼 목록 */
  actionButtons?: ('save' | 'approve' | 'reject' | 'confirm' | 'request_revision' | 'deploy' | 'handover' | 'request_approval' | 'apply')[];
  /** 플레이스홀더 */
  placeholder?: string;
  /** 선택 가능한 옵션 (selection 타입용) */
  options?: string[];
}

/** Phase별 요약 설명 */
export interface PhaseSummary {
  title: string;
  description: string;
  totalSteps: number;
  enabledSteps: number;
}

type StepRequirements = Record<string, FlowFeatureDetail[]>;

// ─── Phase 요약 (KO) ───────────────────────────────────

const PHASE_SUMMARIES_KO: Record<FlowPhaseId, PhaseSummary> = {
  planning: {
    title: "기획",
    description: "AI 서비스 요청서 작성부터 기획서, 모델설명서까지 서비스 도입의 기초를 수립합니다.",
    totalSteps: 4,
    enabledSteps: 1,
  },
  review: {
    title: "검토/평가",
    description: "사전검토 요청, 위험성 평가, 영향도/안전성 평가를 통해 AI 서비스의 리스크를 식별합니다.",
    totalSteps: 3,
    enabledSteps: 2,
  },
  development: {
    title: "개발",
    description: "개발 계획 수립, 위험 관리 계획, 거버넌스 승인을 거쳐 실제 개발을 진행합니다.",
    totalSteps: 7,
    enabledSteps: 2,
  },
  verification: {
    title: "검증/배포",
    description: "운영 전 검증, 제3자 평가, 배포 승인 등 운영 환경 이관 전 최종 검증을 수행합니다.",
    totalSteps: 7,
    enabledSteps: 0,
  },
  operations: {
    title: "운영/개선",
    description: "통합 대시보드를 통한 실시간 모니터링과 지속적 개선 관리를 수행합니다.",
    totalSteps: 2,
    enabledSteps: 1,
  },
};

const PHASE_SUMMARIES_EN: Record<FlowPhaseId, PhaseSummary> = {
  planning: {
    title: "Planning",
    description: "Establish the foundation for AI service adoption, from request forms to planning docs and model descriptions.",
    totalSteps: 4,
    enabledSteps: 1,
  },
  review: {
    title: "Review & Assessment",
    description: "Identify AI service risks through pre-review requests, risk assessments, and impact/safety evaluations.",
    totalSteps: 3,
    enabledSteps: 2,
  },
  development: {
    title: "Development",
    description: "Proceed with development after establishing development plans, risk management plans, and governance approvals.",
    totalSteps: 7,
    enabledSteps: 2,
  },
  verification: {
    title: "Verification & Deployment",
    description: "Perform final verification before operation including pre-op verification, third-party evaluation, and deployment approvals.",
    totalSteps: 7,
    enabledSteps: 0,
  },
  operations: {
    title: "Operations & Improvement",
    description: "Real-time monitoring via integrated dashboard and continuous improvement management.",
    totalSteps: 2,
    enabledSteps: 1,
  },
};

const KO: StepRequirements = {
  "request-form": [
    {
      featureName: "AI 서비스 기획서 요청",
      requirement: "AI 서비스 도입을 위한 기획서를 작성합니다. 서비스명, 목적, 대상 업무, 예상 효과 등을 입력하고 관련 자료를 첨부합니다.",
      description: "AI 서비스 도입의 첫 단계로 기획 의도와 범위를 정의합니다.",
      actionButtons: ["save", "confirm"],
    }
  ],
  "project-create": [
    {
      featureName: "프로젝트 목록 및 진행상태 (Project List & Status)",
      requirement: "각 서비스별 기획서, 모델설명서 등 하위 문서의 작성 여부와 진행 단계를 시각적으로 표시하고, 작업 가능한 단계로 바로 이동할 수 있는 직관적인 UI를 제공합니다.",
      description: "사용자가 전체 프로젝트의 현황을 파악하고 필요한 작업을 신속히 수행할 수 있도록 합니다."
    },
    {
      featureName: "검색 및 필터링 (Search & Filter)",
      requirement: "프로젝트 이름, 활성화 상태(Active/Inactive), 진행 단계(기획/개발/운영) 등을 기준으로 목록을 필터링하고 정렬하는 기능을 제공합니다.",
      description: "원하는 프로젝트를 빠르게 찾고 관리 효율성을 높입니다."
    }
  ],
  "planning-doc": [
    {
      featureName: "서비스 개요 (Service Overview)",
      requirement: "AI 서비스의 목적, 배경, 주요 기능을 작성합니다. (예: 에너지 효율 최적화를 위한 sLLM 기반 분석 서비스)",
      description: "기획서의 핵심인 서비스의 정의와 목표를 명확히 기술합니다."
    },
    {
      featureName: "업무 요건 (Business Requirements)",
      requirement: "해당 서비스가 해결하고자 하는 구체적인 업무 문제와 요구사항을 기술합니다. (예: 실시간 사용량 모니터링, 이상 감지 알림)",
      description: "AI가 실제 업무 프로세스에서 어떻게 활용될지 정의합니다."
    },
    {
      featureName: "데이터/기술 요건 (Data & Tech Specs)",
      requirement: "사용될 데이터의 종류(민감정보 포함 여부)와 예상 기술 스택을 기술하고, 관련 문서를 첨부합니다.",
      description: "기술적 구현 가능성과 데이터 거버넌스 검토를 위한 기초 자료입니다."
    }
  ],
  "model-doc": [
    {
      featureName: "AI 서비스 개요 (AI Service Overview)",
      requirement: "모델이 적용되는 AI 서비스의 전반적인 개요와 목적을 기술합니다.",
      description: "모델이 어떤 맥락에서 사용되는지 정의합니다."
    },
    {
      featureName: "학습 데이터 (Training Data)",
      requirement: "모델 학습에 사용된 데이터의 출처, 종류, 수량, 민감정보 포함 여부 등을 상세히 기술합니다.",
      description: "데이터의 투명성과 적합성을 확인하기 위함입니다."
    },
    {
      featureName: "알고리즘 (Algorithm)",
      requirement: "사용된 AI 모델의 알고리즘(예: Transformer, CNN 등)과 선정 사유를 기술합니다.",
      description: "모델의 기술적 메커니즘을 설명합니다."
    },
    {
      featureName: "서비스 프로세스 (Service Process)",
      requirement: "AI 모델이 실제 서비스 내에서 어떻게 동작하고 입출력이 처리되는지 흐름도를 포함하여 설명합니다.",
      description: "모델의 전체적인 동작 흐름을 파악하기 위함입니다."
    }
  ],
  "pre-review-request": [
    {
      featureName: "AI 서비스 기획서 사전검토 요청",
      requirement:
        "기획서 및 모델 설명서 작성이 모두 완료된 경우에만 요청 버튼이 활성화됩니다. AI 개발 부서(담당자)를 지정하여 검토를 요청하며, 시스템 알림과 이메일이 자동 발송됩니다.",
      description: "개발 부서에 기획 내용에 대한 사전 기술 검토를 공식 요청합니다."
    },
    {
      featureName: "검토 대상 지정 (Assignee)",
      requirement: "검토를 수행할 AI 개발 부서 또는 담당자를 검색하여 지정합니다.",
      description: "책임 소재를 명확히 하기 위해 검토 담당자를 지정합니다."
    }
  ],
  "risk-assessment": [
    {
      featureName: "위험 식별 및 완화 (Risk Identification & Mitigation)",
      requirement: "체크리스트를 통해 위험 요소를 선택하고 완화 방안을 입력합니다. 발생 가능성(Probability)과 영향도(Impact) 점수를 선택하면 시스템이 최종 위험 등급을 자동으로 산출합니다.",
      description: "정량적/정성적 평가를 통해 위험 수준을 객관적으로 도출합니다."
    },
    {
      featureName: "AI 컨설팅 및 검토 (AI Consulting)",
      requirement: "AI 에이전트가 완화 방안을 실시간으로 분석하여 수정/보완 텍스트를 제안하고, 관련 규제나 사례를 검색하여 근거를 제시합니다.",
      description: "AI를 활용해 위험 평가의 정확도와 전문성을 높입니다."
    },
    {
      featureName: "결과 확정 및 리포트 생성 (Report Generation)",
      requirement: "모든 항목(영향도 및 필요시 안전성 평가) 입력 후 저장 시, 평가가 확정되며 'AI 영향도 및 안전성 평가서'가 자동 생성되어 증적 관리 모듈에 저장됩니다.",
      description: "평가 결과를 공식 문서화하여 시스템에 증적을 남깁니다."
    },
    {
      featureName: "영향도 평가 (Impact Assessment)",
      requirement: "사회적·업무적 파급력 체크리스트 입력 시, AI 에이전트가 오류/모순을 수정 제안하고 근거(규제/사례)를 검색해 제시합니다. 결과에 따라 고영향 여부를 자동 판정합니다.",
      description: "AI의 지능형 가이드를 통해 영향도 평가의 객관성을 확보합니다."
    },
    {
      featureName: "안전성 평가 (Safety Assessment)",
      requirement: "영향도 평가 결과 '고영향 AI'인 경우에만 메뉴가 활성화됩니다. 모델 성능 테스트 결과, 가드레일 설정 증빙 등 필수 서류를 업로드하고 검토 항목을 작성합니다. 저장 시 '임시 저장'되며, 필수 항목 완료 시 '작성 완료'로 전환되고 '고영향 AI 안전성 평가서'가 자동 생성됩니다.",
      description: "고위험군 서비스에 대해 조건부로 심층 안전성 검증을 수행하고 증적을 자동 생성합니다."
    },
    {
      featureName: "위수탁 평가 및 AI 법률 검토 (AI Outsourcing & Legal Review)",
      requirement: "위수탁 계약서 및 점검 내역을 AI 에이전트가 분석하여 보안 요건 누락 여부를 진단하고 수정 의견을 제시합니다. 사용자가 개인정보보호법 등 법적 요구사항을 문의하면 실시간 검색을 통해 최신 법령 근거를 제공합니다.",
      description: "AI 에이전트를 통해 위수탁 계약의 법적/보안 리스크를 정밀하게 검토합니다."
    },
    {
      featureName: "위험 평가 결과 검토 (Risk Assessment Review)",
      requirement: "거버넌스 부서가 '나의 검토사항'에서 요청 건을 조회 및 상세 확인합니다. AI 에이전트가 완화 방안의 표준 부합성을 분석하여 추천 의견을 제시하며, 검토자는 항목별 의견(체크박스/텍스트)을 작성하고 승인/보완을 결정합니다. 결과 확정 시 최종 승인 이력이 업데이트됩니다.",
      description: "거버넌스 관점에서 위험 평가의 적정성을 검증하고 최종 승인합니다."
    },
    {
      featureName: "AI 영향 평가 결과 검토 (Impact Assessment Review)",
      requirement: "영향도 평가서를 조회하고 AI 에이전트와 함께 '고영향 AI' 분류의 적절성을 자동 체크합니다. 항목별 검토 의견을 작성하고 승인/보완 처리를 수행하며, 최종 결과는 평가서 이력으로 저장됩니다.",
      description: "영향도 등급 판정의 타당성을 최종 확인합니다."
    },
    {
      featureName: "AI 안전성 평가 결과 검토 (Safety Assessment Review)",
      requirement: "안전성 평가 결과서를 조회하여 AI 에이전트가 안전성 가이드라인 부합 여부를 체크합니다. 항목별 기술적 검토 의견을 작성하고 승인/보완을 결정하며, 승인된 결과는 위험 관리 및 운영 승인의 핵심 증적으로 활용됩니다.",
      description: "고영향 AI의 안전성 조치에 대한 기술적 적정성을 최종 검증합니다."
    }
  ],
  "pre-review-result": [
    {
      featureName: "항목별 및 종합 검토 (Detailed Review)",
      requirement: "기획서/평가서의 세부 항목별 의견과 최종 종합 의견(도입 적정성 등)을 작성합니다.",
      description: "구체적이고 종합적인 검토 피드백을 기록합니다."
    },
    {
      featureName: "승인/보완 의사결정 (Decision Making)",
      requirement: "승인 또는 보완요청을 선택하며, 보완 요청 시에는 대상 항목과 가이드를 필수로 입력해야 합니다.",
      description: "검토 결과를 명확히 확정합니다."
    },
    {
      featureName: "자동 통보 시스템 (Auto Notification)",
      requirement: "결과 확정 시 이메일, 대시보드(나의 요청사항), 실시간 팝업으로 기획자에게 즉시 알림을 발송합니다.",
      description: "검토 결과의 신속한 전파를 보장합니다."
    },
    {
      featureName: "AI 수정 가이드 (AI Revision Guide)",
      requirement: "보완 요청 확인 시, AI 에이전트가 검토 의견을 분석하여 수정 방향을 제안하고 근거 자료(사례/문헌)를 검색해 제공합니다.",
      description: "기획자의 신속하고 정확한 보완 이행을 지원합니다."
    },
    {
      featureName: "이력 자동 로그 (History Logging)",
      requirement: "통보 시점과 대상자 정보를 평가 이력 시스템에 자동 기록하여 증적을 관리합니다.",
      description: "절차적 투명성을 확보합니다."
    }
  ],
  "dev-plan": [
    {
      featureName: "기획 연동 및 상세 작성 (Auto-fill & Detail)",
      requirement: "승인된 기획서 및 검토 의견이 자동 연동(Auto-fill)되며, 이를 바탕으로 모델 개요, 상세 요건, 기술 스펙 등을 구체화하여 작성합니다.",
      description: "기획 단계의 데이터 연속성을 보장하고 구체적인 실행 계획을 수립합니다."
    },
    {
      featureName: "AI 타당성 분석 (AI Feasibility Analysis)",
      requirement: "작성된 계획을 AI 에이전트가 분석하여 일정 누락, 기술적 미비점을 식별하고 보완 의견을 제시합니다.",
      description: "개발 계획의 완성도와 실현 가능성을 AI가 사전 검증합니다."
    },
    {
      featureName: "증빙 첨부 및 완료 검증 (Docs & Validation)",
      requirement: "아키텍처 설계도, WBS 등을 업로드하고, 개발 범위/일정/인력 등 필수 항목이 모두 작성된 경우에만 '작성 완료' 처리되어 다음 단계(위험 관리)로 넘어갑니다.",
      description: "구체적 증빙과 필수 요건 충족 여부를 시스템이 통제합니다."
    }
  ],
  "risk-plan": [
    {
      featureName: "위험 관리 계획 수립 (Plan Establishment)",
      requirement: "위험 평가가 승인된 경우에만 활성화됩니다. 각 위험 항목별 이행 시나리오, 점검 주기, 관리 방법을 입력하고 매뉴얼/가이드를 첨부합니다. AI 에이전트가 통제 충분성을 분석하여 보완 의견을 제시하며, 작성 중 임시 저장이 가능합니다.",
      description: "승인된 위험에 대한 구체적 대응 계획을 수립하고 AI 검증을 거칩니다."
    },
    {
      featureName: "협의 요청 (Consultation Request)",
      requirement: "작성 완료된 계획에 대해 관련 부서 협의를 요청합니다. 요청 시 AI가 재검토를 수행하며, 요청자/대상/일시 정보가 시스템에 자동 기록됩니다.",
      description: "계획의 실효성 확보를 위해 유관 부서와의 협의를 공식화합니다."
    }
  ],
  "risk-plan-approval": [
    {
      featureName: "위험 관리 계획 승인 (Plan Approval)",
      requirement: "승인 대상 프로젝트를 선택하면 AI 에이전트가 계획의 통제력을 분석합니다. 저/중위험 AI의 경우 내부 승인 버튼이 활성화되며, 승인 시 정보가 문서에 자동 반영되고 담당자에게 알림이 발송됩니다.",
      description: "저·중위험 서비스의 위험 관리 계획을 신속하게 확정하고 전파합니다."
    }
  ],
  "governance-approval": [
    {
      featureName: "고위험 AI 사전 승인 안건 상신 (Submission)",
      requirement: "고위험 AI 중 위험 관리 계획 협의가 완료된 건에 대해 활성화됩니다. '안전 생성' 시 관련 문서(기획서/평가서/계획서)가 자동 연동되며, AI 에이전트가 통제 충분성을 분석하여 보완 의견을 제시합니다. 상신 시 협의체 및 이해관계자에게 알림이 발송됩니다.",
      description: "고위험 AI 서비스에 대한 거버넌스 협의체 심의를 공식 요청합니다."
    },
    {
      featureName: "사전 승인 (Pre-approval)",
      requirement: "상신된 안건을 조회하고 AI가 리스크 통제력을 최종 분석합니다. 협의체 위원별 의견과 의결 결과(승인/부결/조건부)를 입력하고, 회의록 등 공식 증적을 업로드합니다. 승인 확정 시 결과가 기획/개발 부서에 자동 통보됩니다.",
      description: "고위험 AI 서비스 도입 여부를 조직 차원에서 최종 의사결정하고 증적을 남깁니다."
    }
  ],
  "dev-request": [
    {
      featureName: "개발 의뢰서 작성 (Create Request)",
      requirement: "신규 AI 프로젝트에 대한 개발 의뢰서를 생성합니다. 서비스 명칭, 목적, 기대 효과, 주요 기능 요건 등을 상세히 입력하며, 관련 문서(프로세스 맵, 규격서 등)를 첨부합니다.",
      description: "개발 착수를 위한 구체적인 요구사항을 정의합니다."
    },
    {
      featureName: "AI 에이전트 검토 확인 (AI Review Check)",
      requirement: "AI 에이전트가 제안한 개선 사항을 확인하고 반영했음을 체크박스로 명시적으로 확인해야 합니다.",
      description: "AI 검토를 통해 요구사항의 완성도를 높입니다."
    },
    {
      featureName: "저장 및 상신 (Save & Submit)",
      requirement: "작성 중 임시 저장이 가능하며, 작성 완료 후 '상신' 버튼을 통해 개발 담당 부서로 의뢰를 전송하고 알림을 발송합니다.",
      description: "개발 의뢰 프로세스를 공식적으로 시작합니다."
    },
    {
      featureName: "안전성 확보 의무 적용 대상 최종 판단 (Final Safety Obligation Check)",
      requirement: "데이터 및 영향도를 기반으로 시스템이 의무 대상 여부를 자동 판정(초안)하고, AI 에이전트가 통제 충분성을 분석합니다. 검토자는 최종 의견을 작성하고 법률 검토서 등을 첨부하여 승인하며, 완료 시 '안전성 확보 의무 대상 판단 결과서'가 자동 생성됩니다.",
      description: "법적/기술적 기준에 따라 안전성 의무 여부를 확정하고 증적을 생성합니다."
    },
    {
      featureName: "안전성 요건 추가 및 확정 (Add Safety Requirements)",
      requirement: "의무 대상 시 검증/통제/모니터링 등 구체적 추가 요건을 입력하고 기술 문서(사양서, 설계도)를 첨부합니다. AI 에이전트가 요건 충족 여부를 분석하며, 수정 이력은 자동 추적됩니다. 최종 확정 시 안전성 요건이 개발 계획에 공식 반영됩니다.",
      description: "법적 의무 사항에 대응하는 기술적 안전성 요건을 개발 계획에 통합합니다."
    }
  ],
  "dev-progress": [
    {
      featureName: "개발환경 구축 및 학습데이터 관리 (Env & Data Mgmt)",
      requirement: "개발/시험 환경(Sandbox) 정보를 기록하고 데이터 출처/정제/라벨링 이력을 관리합니다. AI 에이전트가 환경/데이터의 요건 충족 여부를 분석하며, 데이터 변경 시 '모델 설명서'가 자동 연동되어 업데이트됩니다. 관련 문서(데이터 명세서, 비식별 보고서)를 첨부하고 저장하여 다음 단계를 준비합니다.",
      description: "안전하고 투명한 개발 환경과 고품질 학습 데이터를 확보합니다."
    },
    {
      featureName: "AI 서비스 개발 및 모델 갱신 (Development & Model Update)",
      requirement: "계획에 따라 개발을 수행하며, 변경 발생 시 AI 에이전트가 위험/안전성 요건 침해 여부를 분석합니다. 모델 설명서 갱신 팝업을 통해 변경 사유와 내역을 입력하고 증빙(성능리포트, 흐름도)을 첨부합니다. 완료 시 최신 모델 설명서가 이력으로 확정 저장됩니다.",
      description: "개발 중 변경사항을 실시간으로 관리하고 문서의 최신성을 유지합니다."
    },
    {
      featureName: "위험/영향 관리 계획 준수 점검 (Risk Compliance Check)",
      requirement: "확정된 위험 완화방안 리스트를 연동하여 실시간 점검(준수/미준수)을 수행합니다. AI 에이전트가 기술적 적용 충분성을 분석하며, 코드 리뷰/보안 리포트 등 증빙을 첨부합니다. 모든 점검 및 수정 이력은 감사 로그로 자동 기록됩니다.",
      description: "개발 과정에서 위험 완화 조치가 실제로 이행되었는지 기술적으로 검증합니다."
    },
    {
      featureName: "개발 요건 이행 점검 (Req Fulfillment Check)",
      requirement: "기능 요건 및 위험 조치 상세에 대한 최종 이행 여부를 체크합니다. AI 에이전트가 누락된 요건을 분석제안하며, 최종 테스트 결과서를 첨부하여 저장하면 'AI 개발 결과 이행 점검 보고서'가 자동 생성됩니다.",
      description: "계획 대비 실제 개발 결과의 정합성을 확인하고 공식 보고서를 생성합니다."
    }
  ],
  "pre-op-verification": [
    {
      featureName: "운영 전 검증 (Pre-Op Verification)",
      requirement: "테스트 시나리오(데이터/성능/안전성)를 등록하고 결과를 입력합니다. AI 에이전트가 검증 충분성을 분석하며, 결과 리포트 및 데이터셋을 첨부합니다. 확정 시 '운영 전 검증 결과서'가 자동 생성되고 검토 요청 알림이 발송됩니다.",
      description: "운영 환경 이관 전 AI 서비스의 성능과 안전성을 최종 기술 검증합니다."
    },
    {
      featureName: "검증 지원 및 협업 (Verification Support)",
      requirement: "기획 부서가 기술 검증 결과를 기획 의도와 비교 검토합니다. AI 에이전트가 정보 불일치를 분석하며, 현업 데이터를 첨부해 지원합니다. 양측 의견이 통합된 단일 결과서로 관리됩니다.",
      description: "기술 부서와 기획 부서 간 협업을 통해 검증 완성도를 높입니다."
    },
    {
      featureName: "AI 모니터링 계획 수립 및 작성",
      requirement:
        "AI 서비스 운영을 위한 성능 모니터링 지표, 위험 모니터링 계획, VoC 관리 및 서비스 중단 관리 방안을 포함한 모니터링 계획을 수립하고 시스템에 입력·저장한다.",
      description: "AI 서비스 운영 중 발생 가능한 위험과 성능 저하를 지속적으로 관리하기 위함",
      uiType: "monitoring",
      actionButtons: ["save"],
    },
    {
      featureName: "영향평가 수행 [권고]",
      requirement:
        "고영향 AI 서비스의 경우 필요 시 기존 영향평가 결과를 재검토하거나 재수행할 수 있도록 하며, 수행 결과를 시스템에 등록·관리한다.",
      description: "서비스 변경 또는 검증 결과 반영에 따른 영향도를 재확인하기 위함",
    },
  ],
  "verification-adequacy": [
    {
      featureName: "검증 결과 적절성 확인",
      requirement:
        "중위험 AI 서비스에 대해 AI 거버넌스 부서가 개발자 검증 결과의 적절성을 확인할 수 있도록 한다. 검증 결과 요약 및 상세 결과서를 연동하여 검토 이력을 기록한다.",
      description: "중위험 AI 서비스의 검증 결과에 대한 거버넌스 차원의 적정성을 확인하기 위함",
      uiType: "approval",
      actionButtons: ["approve", "request_revision"],
    },
  ],
  "third-party-verification": [
    {
      featureName: "제3자 평가·검증 요청",
      requirement:
        "고위험 AI 서비스의 경우 독립된 제3자 평가·검증을 수행할 수 있도록 제3자 목록을 관리하고, 선택된 제3자에게 데이터 및 AI 모델 검증 요청을 발송하도록 한다.",
      description: "고위험 AI 서비스에 대해 독립적인 외부 검증을 수행하기 위함",
      uiType: "selection",
      options: ["TTA (한국정보통신기술협회)", "KISA (한국인터넷진흥원)", "법무법인 A", "AI 안전성 연구소"],
      actionButtons: ["save", "confirm"],
    },
    {
      featureName: "제3자 평가·검증 수행",
      requirement:
        "독립된 제3자가 데이터 및 AI 모델 테스트 시나리오에 따라 평가·검증을 수행할 수 있도록 하며, 수행 결과를 시스템에 기록할 수 있도록 한다.",
      description: "제3자의 객관적인 검증 결과를 확보하기 위함",
      uiType: "upload_only",
      actionButtons: ["save"],
    },
    {
      featureName: "제3자 평가·검증 결과 확인",
      requirement:
        "제3자가 수행한 평가·검증 결과를 시스템에 등록하고, 결과 요약 및 검증 결과서를 첨부하여 관리할 수 있도록 한다.",
      description: "제3자 평가·검증 결과를 체계적으로 관리하고 이후 승인 절차에 활용하기 위함",
      uiType: "default",
      actionButtons: ["confirm"],
    },
    {
      featureName: "검증결과 확인 신청",
      requirement:
        "제3자 평가·검증이 완료된 고위험 AI 서비스에 대해 AI 거버넌스 협의체에 검증 결과 확인을 신청할 수 있도록 한다. 신청 이력 및 관련 문서를 연동 관리한다.",
      description: "고위험 AI 서비스의 검증 결과를 협의체 차원에서 공식적으로 검토하기 위함",
      actionButtons: ["apply"],
    },
    {
      featureName: "검증결과 확인",
      requirement:
        "AI 거버넌스 협의체를 개최하여 제3자 검증 결과를 최종 확인·승인하고, 승인 결과 및 회의 내용을 시스템에 기록·관리한다.",
      description: "고위험 AI 서비스 운영 전 검증 결과에 대한 최종 의사결정을 수행하기 위함",
      uiType: "approval",
      actionButtons: ["approve", "request_revision"],
    },
  ],
  "op-approval-request": [
    {
      featureName: "운영 승인 요청",
      requirement:
        "영향평가, 검증 결과 확인, 위험 완화 방안 점검 등 모든 선행 절차 완료 후 AI 거버넌스 부서에 운영 승인을 요청할 수 있도록 한다. 관련 문서와 결과를 연동하여 운영 승인 요청서를 생성하고 메일·알림을 발송한다.",
      description: "AI 서비스의 정식 운영을 위한 거버넌스 차원의 최종 승인 절차를 수행하기 위함",
      actionButtons: ["request_approval"],
    },
  ],
  "deployment-approval": [
    {
      featureName: "AI 위험 관리 계획 이행 확인",
      requirement:
        "AI 서비스 기획 부서가 제출한 운영 승인 요청 내역과 위험 완화 방안 이행 결과를 연동 문서 기반으로 최종 확인할 수 있도록 한다. AI 모델 설명서, 검증 결과서, 모니터링 계획서 등을 함께 검토하여 승인 또는 반려 처리를 수행한다.",
      description: "위험 관리 계획이 실제로 이행되었는지 운영 전 최종적으로 확인하기 위함",
      uiType: "checklist",
      actionButtons: ["save"],
    },
    {
      featureName: "AI 위험 관리 계획 이행 및 배포 승인",
      requirement:
        "위험 관리 계획 이행 내역 검토 결과 이상이 없는 경우 운영 부서에 서비스 배포를 요청하도록 한다. 운영 승인 결과는 서비스 기획 부서에 통보되며, 배포 요청 내역은 시스템에 기록·관리한다.",
      description: "위험 관리 계획 이행 완료 후 AI 서비스 배포를 공식 승인하기 위함",
      uiType: "approval",
      actionButtons: ["approve", "reject"],
    },
  ],
  "deployment": [
    {
      featureName: "AI 서비스 배포",
      requirement:
        "AI 운영 부서에서 승인된 AI 서비스를 운영 환경에 배포할 수 있도록 하며, 배포 일시·담당자·대상 프로그램 정보를 기록한다. 배포 결과에 따라 AI 서비스 모델 설명서를 최신 상태로 갱신한다.",
      description: "승인된 AI 서비스를 실제 운영 환경에 적용하기 위함",
      actionButtons: ["deploy"],
    },
    {
      featureName: "AI 서비스 운영",
      requirement:
        "배포 완료된 AI 서비스에 대해 정상적인 운영을 수행할 수 있도록 하며, 운영 상태는 시스템 상에서 관리된다.",
      description: "AI 서비스를 실제 업무에 활용하기 위한 운영 단계",
    },
    {
      featureName: "AI 서비스 인수인계",
      requirement:
        "서비스 배포 완료 시점에서 운영 부서로의 인수인계를 수행할 수 있도록 하며, 인수인계 완료 여부를 기록·관리한다.",
      description: "개발·기획 단계에서 운영 단계로의 책임 전환을 명확히 하기 위함",
      actionButtons: ["handover"],
    },
  ],
  "improvement": [
    {
      featureName: "AI 위험 모니터링",
      requirement:
        "운영 중인 AI 서비스에 대해 성능, 위험 지표, VOC, 서비스 중단 사례, 운영 변경 사항 등을 지속적으로 수집·모니터링할 수 있도록 한다. 수집된 결과는 모니터링 보고서로 관리한다.",
      description: "운영 중 발생 가능한 위험 요소를 지속적으로 감시하기 위함",
    },
    {
      featureName: "AI 위험 모니터링 결과 점검",
      requirement:
        "정기적으로 AI 서비스 모니터링 보고서를 검토하고, 위험 징후 또는 문제 여부를 점검·승인한다. 점검 결과는 결재 이력과 함께 기록한다.",
      description: "모니터링 결과에 대한 거버넌스 차원의 관리·통제를 수행하기 위함",
    },
    {
      featureName: "AI 서비스 개선계획 수립",
      requirement:
        "모니터링 결과 및 점검 결과를 바탕으로 개선이 필요한 사항에 대해 개선 계획을 수립하고 문서화한다.",
      description: "운영 중 발견된 문제를 체계적으로 개선하기 위한 계획을 수립하기 위함",
    },
    {
      featureName: "AI 서비스 개선",
      requirement:
        "수립된 개선 계획에 따라 AI 서비스 개선을 수행하고, 개선 결과를 기록·관리한다. 필요 시 관련 문서를 갱신한다.",
      description: "AI 서비스의 안전성·성능·신뢰성을 지속적으로 향상시키기 위함",
    },
  ],
};

const EN: StepRequirements = {
  "request-form": [
    {
      featureName: "AI Service Request Form",
      requirement: "Create a planning request for AI service adoption. Input service name, purpose, target tasks, expected effects, and attach related materials.",
      description: "Define the planning intent and scope as the first step of AI service adoption.",
      actionButtons: ["save", "confirm"],
    }
  ],
  "model-doc": [
    {
      featureName: "AI Service Overview",
      requirement: "Describe the general overview and purpose of the AI service where the model is applied.",
      description: "Define the context in which the model is used."
    },
    {
      featureName: "Training Data",
      requirement: "Describe in detail the source, type, quantity, and inclusion of sensitive information of the data used for model training.",
      description: "To verify the transparency and suitability of the data."
    },
    {
      featureName: "Algorithm",
      requirement: "Describe the AI model algorithm used (e.g., Transformer, CNN) and the reason for selection.",
      description: "Explain the technical mechanism of the model."
    },
    {
      featureName: "Service Process",
      requirement: "Explain how the AI model operates within the actual service and how inputs/outputs are processed, including a flowchart.",
      description: "To understand the overall operational flow of the model."
    }
  ],
  "pre-review-request": [
    {
      featureName: "Pre-review Request",
      requirement: "Active only when planning/model docs are complete. Request review from AI dev team.",
      description: "Formal request for technical pre-review."
    },
    {
      featureName: "Assign Evaluator",
      requirement: "Search and assign the AI development team/person responsible for review.",
      description: "To clarify responsibility for the review."
    }
  ],
  "project-create": [
    {
      featureName: "Project List & Status Dashboard",
      requirement: "Visually display the existence and progress status of sub-documents (planning, model desc) for each service. Provide direct access buttons to actionable steps.",
      description: "To allow users to grasp the overall project status and quickly perform necessary tasks."
    },
    {
      featureName: "Search & Filtering",
      requirement: "Provide filtering and sorting capabilities based on project name, active status, and progress stage (Planning/Dev/Ops).",
      description: "To improve management efficiency by quickly locating desired projects."
    }
  ],
  "planning-doc": [
    {
      featureName: "Service Overview",
      requirement: "Describe the purpose, background, and main features of the AI service.",
      description: "Define the core service goals and scope."
    },
    {
      featureName: "Business Requirements",
      requirement: "Describe the specific business problems to handle. (e.g., real-time monitoring)",
      description: "Define how AI will be used in actual business processes."
    },
    {
      featureName: "Data & Tech Specs",
      requirement: "Describe data types (PII included?) and expected tech stack. Attach related docs.",
      description: "Basic info for technical feasibility and governance review."
    }
  ],
  "risk-assessment": [
    {
      featureName: "Risk Identification & Mitigation",
      requirement: "Select risk items via checklist and input mitigation plans. System calculates risk level automatically based on selected probability and impact scores.",
      description: "Derive objective risk levels through quantitative/qualitative assessment."
    },
    {
      featureName: "AI Consulting",
      requirement: "AI agent analyzes mitigation plans in real-time, suggests refinements, and provides searching evidence (regulations/cases).",
      description: "Improve assessment accuracy and expertise using AI."
    },
    {
      featureName: "Report Generation",
      requirement: "Upon completion and saving, the assessment is finalized, and an 'AI Impact & Safety Assessment Report' is automatically generated and stored in the evidence management module.",
      description: "Formally document the results and store them as system evidence."
    },
    {
      featureName: "Impact Assessment",
      requirement: "Evaluate impact via checklist. AI agent suggests corrections for errors and searches/summarizes objective evidence (regulations/cases). Auto-determines High-Impact status.",
      description: "Secure objectivity of impact assessment through AI intelligent guidance."
    },
    {
      featureName: "Safety Assessment",
      requirement: "Menu activates only for 'High-Impact AI'. Upload required docs (performance tests, guardrails). Supports draft saving; generates 'High-Impact AI Safety Assessment Report' automatically upon completion of mandatory items.",
      description: "Conditionally perform in-depth safety verification and auto-generate evidence for high-risk services."
    },
    {
      featureName: "Outsourcing & Legal Review",
      requirement: "AI agent analyzes outsourcing contracts for missing security requirements and suggests corrections. Provides real-time legal evidence (e.g., privacy laws) via search upon user inquiry.",
      description: "Precise review of legal/security risks in outsourcing contracts using AI."
    },
    {
      featureName: "Risk Assessment Review",
      requirement: "Governance dept reviews requests via 'My Review Items'. AI agent analyzes mitigation plans against standards to suggest recommendations. Reviewer inputs itemized comments (checkbox/text) and decides Approve/Revision. Finalizes approval history upon saving.",
      description: "Verify appropriateness of risk assessment from governance perspective and finalize approval."
    },
    {
      featureName: "Impact Assessment Review",
      requirement: "Review Impact Assessment Report. AI agent checks appropriateness of 'High-Impact' classification. Input itemized comments, decide Approve/Revision, and save history.",
      description: "Final verification of impact rating validity."
    },
    {
      featureName: "Safety Assessment Review",
      requirement: "Review Safety Assessment Report. AI agent analyses compliance with safety guidelines. Input technical review comments, decide Approve/Revision. Approved results serve as key evidence for future approvals.",
      description: "Final technical verification of safety measures for High-Impact AI."
    }
  ],
  "pre-review-result": [
    {
      featureName: "Detailed Review",
      requirement: "Input specific comments for each plan/assessment item and a final comprehensive opinion on adoption appropriateness.",
      description: "Record concrete and holistic review feedback."
    },
    {
      featureName: "Decision Making",
      requirement: "Select 'Approve' or 'Request Revision'. Mandatory guidance input is enforced for revision requests.",
      description: "Clearly finalize the review result."
    },
    {
      featureName: "Auto Notification",
      requirement: "Immediately notify the planner via email, dashboard (My Requests), and real-time popup upon confirmation.",
      description: "Ensure rapid dissemination of review results."
    },
    {
      featureName: "AI Revision Guide",
      requirement: "Upon accessing revision, AI agent analyzes comments to suggest actionable changes and searches for references.",
      description: "Support quick and accurate revision by the planner."
    },
    {
      featureName: "History Logging",
      requirement: "Automatically log notification time and recipients in the assessment history system.",
      description: "Ensure procedural transparency."
    }
  ],
  "dev-plan": [
    {
      featureName: "Auto-fill & Detailed Planning",
      requirement: "Auto-fill data from approved planning docs and review comments. Detail the model overview, requirements, and tech specs based on them.",
      description: "Ensure data continuity and establish a concrete execution plan."
    },
    {
      featureName: "AI Feasibility Analysis",
      requirement: "AI agent analyzes the plan for missing schedules or technical gaps and suggests improvements.",
      description: "AI pre-validates the completeness and feasibility of the development plan."
    },
    {
      featureName: "Docs Attachment & Validation",
      requirement: "Upload Architecture/WBS. Completion status is granted only when all mandatory fields (Scope, Schedule, Personnel) are filled, allowing transition to Risk Management.",
      description: "System controls verification of specific evidence and mandatory requirements."
    }
  ],
  "risk-plan": [
    {
      featureName: "Plan Establishment",
      requirement: "Active only if Risk Assessment is approved. Input mitigation scenarios, cycles, and methods per risk. Attach manuals/guides. AI Agent analyzes control sufficiency. Supports draft saving.",
      description: "Establish concrete response plans for approved risks with AI verification."
    },
    {
      featureName: "Consultation Request",
      requirement: "Request consultation from relevant departments. AI re-reviews upon request. Automatically logs requester, target, and timestamp.",
      description: "Formalize consultation to ensure plan effectiveness."
    }
  ],
  "risk-plan-approval": [
    {
      featureName: "Plan Approval",
      requirement: "Select project to approve. AI Agent analyzes control sufficiency. For Low/Medium risks, internal approval is enabled. Approval info is auto-reflected in docs and notifications sent.",
      description: "Quickly finalize and disseminate risk management plans for Low/Medium risk services."
    }
  ],
  "governance-approval": [
    {
      featureName: "Governance Submission",
      requirement: "Active for 'High-Risk' projects with completed consultation. Auto-generates agenda with linked docs. AI Agent analyzes control sufficiency. Sends notifications upon submission.",
      description: "Formally request review by the governance committee for High-Risk AI."
    },
    {
      featureName: "Pre-approval",
      requirement: "Review submitted items. AI Agent performs final risk control analysis. Input committee comments/decisions and upload minutes. Final outcome is notified to planning/dev departments.",
      description: "Final organizational decision-making and evidence recording for High-Risk AI."
    }
  ],
  "dev-request": [
    {
      featureName: "Create Request",
      requirement: "Create a new development request. Input details (Service Name, Purpose, Effects, Requirements) and attach documents (Process Map, Specs).",
      description: "Define concrete requirements for starting development."
    },
    {
      featureName: "AI Review Check",
      requirement: "Explicitly confirm via checkbox that AI Agent suggestions have been reviewed and reflected.",
      description: "Enhance requirement completeness through AI review."
    },
    {
      featureName: "Save & Submit",
      requirement: "Support draft saving. Upon completion, submit to the development department via 'Submit' button and send notifications.",
      description: "Officially initiate the development request process."
    },
    {
      featureName: "Final Safety Obligation Check",
      requirement: "System auto-judges obligation status based on data/impact. AI Agent analyzes control sufficiency. Reviewer inputs final opinion, attaches legal docs, and approves. 'Safety Obligation Judgment Report' is auto-generated upon completion.",
      description: "Confirm safety obligations based on legal/technical standards and generate evidence."
    },
    {
      featureName: "Add Safety Requirements",
      requirement: "Input specific verification/control/monitoring requirements and attach technical docs. AI Agent analyzes compliance with obligations. System tracks all changes. Finalize to officially reflect requisites in the development plan.",
      description: "Integrate technical safety requirements corresponding to legal obligations into the development plan."
    }
  ],
  "dev-progress": [
    {
      featureName: "Env & Data Management",
      requirement: "Record Sandbox specs (GPU/Framework) and manage data source/cleaning history. AI Agent validates compliance with safety/performance goals. Auto-updates 'Model Document' upon data changes. Attach Data Sheets/PII reports and save to trigger the next phase.",
      description: "Secure a safe development environment and high-quality training data."
    },
    {
      featureName: "Development & Model Update",
      requirement: "Execute development per plan. AI Agent checks if changes violate risk/safety requirements. Update Model Doc via popup with reasons and technical details. Attach new reports/specs. Finalize updated doc into history upon completion.",
      description: "Manage changes in real-time and maintain up-to-date documentation."
    },
    {
      featureName: "Risk Compliance Check",
      requirement: "Real-time checklist (Comply/Non-comply) linked to mitigation plans. AI Agent analyzes technical sufficiency. Attach evidence (Code review/Security reports). Audit logs track all history.",
      description: "Verify technical implementation of risk mitigation measures during development."
    },
    {
      featureName: "Req Fulfillment Check",
      requirement: "Final checklist for functional/risk requirements. AI Agent identifies omissions. Attach final test reports. Auto-generates 'Development Fulfillment Report' upon saving.",
      description: "Confirm alignment between planned requirements and actual results, generating an official report."
    }
  ],
  "pre-op-verification": [
    {
      featureName: "Pre-Op Verification",
      requirement: "Register test scenarios (data/performance/safety). AI Agent analyzes coverage sufficiency. Attach reports/datasets. Confirmation generates 'Pre-Op Verification Report' and triggers notifications.",
      description: "Final technical verification of performance/safety before operation."
    },
    {
      featureName: "Verification Support",
      requirement: "Planning dept reviews results against business intent. AI Agent analyzes gaps. Attach field data. Manage as a single unified report merging both sides' inputs.",
      description: "Enhance verification completeness through cross-department collaboration."
    },
    {
      featureName: "AI monitoring plan establishment",
      requirement:
        "Establish and enter into the system a monitoring plan that includes performance monitoring indicators, risk monitoring plan, VoC management, and service suspension management for AI service operation.",
      description: "To continuously manage risks and performance degradation that may occur during AI service operation",
    },
    {
      featureName: "Impact assessment [recommended]",
      requirement:
        "For high-impact AI services, allow review or re-performance of existing impact assessment results when necessary, and register and manage results in the system.",
      description: "To reconfirm impact in light of service changes or verification results",
    },
  ],
  "verification-adequacy": [
    {
      featureName: "Verification result adequacy confirmation",
      requirement:
        "Allow the AI governance department to confirm the adequacy of developer verification results for medium-risk AI services. Link verification result summary and detailed report and record review history.",
      description: "To confirm the adequacy of verification results for medium-risk AI services from a governance perspective",
    },
  ],
  "third-party-verification": [
    {
      featureName: "Third-party evaluation/verification request",
      requirement:
        "For high-risk AI services, manage a list of independent third parties and allow sending data and AI model verification requests to the selected third party.",
      description: "To perform independent external verification for high-risk AI services",
    },
    {
      featureName: "Third-party evaluation/verification execution",
      requirement:
        "Allow independent third parties to perform evaluation and verification according to data and AI model test scenarios, and record results in the system.",
      description: "To obtain objective verification results from a third party",
    },
    {
      featureName: "Third-party verification result confirmation",
      requirement:
        "Allow registration of third-party evaluation/verification results in the system and management with result summary and verification report attached.",
      description: "To manage third-party verification results systematically and use them in subsequent approval procedures",
    },
    {
      featureName: "Verification result confirmation request",
      requirement:
        "Allow requesting the AI governance committee to confirm verification results for high-risk AI services that have completed third-party evaluation/verification. Manage request history and linked documents.",
      description: "To formally review verification results for high-risk AI services at the committee level",
    },
    {
      featureName: "Verification result confirmation",
      requirement:
        "Hold the AI governance committee to finally confirm and approve third-party verification results, and record and manage approval results and meeting content in the system.",
      description: "To make the final decision on pre-operation verification results for high-risk AI services",
    },
  ],
  "op-approval-request": [
    {
      featureName: "Operation approval request",
      requirement:
        "After all prior steps (impact assessment, verification result confirmation, risk mitigation check, etc.) are complete, allow requesting operation approval from the AI governance department. Generate an operation approval request by linking related documents and results, and send email and in-app notifications.",
      description: "To perform the final governance-level approval procedure for formal operation of the AI service",
    },
  ],
  "deployment-approval": [
    {
      featureName: "AI risk management plan compliance confirmation",
      requirement:
        "Allow final confirmation of the operation approval request submitted by the planning department and risk mitigation compliance results on a document-linked basis. Review AI model description, verification report, monitoring plan, etc., and perform approval or rejection.",
      description: "To finally confirm before operation that the risk management plan has been implemented",
    },
    {
      featureName: "Risk management compliance and deployment approval",
      requirement:
        "When review of risk management compliance shows no issues, request the operations department to deploy the service. Notify the planning department of the approval result and record and manage deployment requests in the system.",
      description: "To formally approve AI service deployment after risk management plan compliance is complete",
    },
  ],
  "deployment": [
    {
      featureName: "AI service deployment",
      requirement:
        "Allow the AI operations department to deploy approved AI services to the production environment; record deployment time, responsible party, and target program. Update the AI service model description to the latest state based on deployment results.",
      description: "To apply approved AI services to the actual operating environment",
    },
    {
      featureName: "AI service operation",
      requirement:
        "Allow normal operation of deployed AI services, with operational status managed in the system.",
      description: "Operation phase for using the AI service in actual business",
    },
    {
      featureName: "AI service handover",
      requirement:
        "Allow handover to the operations department upon deployment completion, and record and manage handover completion status.",
      description: "To clearly transfer responsibility from development/planning to operation",
    },
  ],
  "improvement": [
    {
      featureName: "AI risk monitoring",
      requirement:
        "Allow continuous collection and monitoring of performance, risk indicators, VoC, service suspension cases, and operational changes for operating AI services. Manage collected results as monitoring reports.",
      description: "To continuously monitor risk factors that may occur during operation",
    },
    {
      featureName: "AI risk monitoring result review",
      requirement:
        "Periodically review AI service monitoring reports and check and approve for risk indicators or issues. Record review results together with approval history.",
      description: "To perform governance-level management and control of monitoring results",
    },
    {
      featureName: "AI service improvement plan",
      requirement:
        "Establish and document improvement plans for items that need improvement based on monitoring and review results.",
      description: "To establish a plan for systematically improving issues found during operation",
    },
    {
      featureName: "AI service improvement",
      requirement:
        "Perform AI service improvement according to the established plan, and record and manage improvement results. Update related documents as needed.",
      description: "To continuously improve the safety, performance, and reliability of the AI service",
    },
  ],
};

export const FLOW_REQUIREMENTS_KO = KO;
export const FLOW_REQUIREMENTS_EN = EN;

export function getFlowRequirements(
  stepId: string,
  locale: string
): FlowFeatureDetail[] {
  const lang = locale.startsWith("ko") ? KO : EN;
  return lang[stepId] ?? [];
}

/** Phase별 요약 정보 반환 */
export function getPhaseSummary(
  phaseId: FlowPhaseId,
  locale: string
): PhaseSummary {
  const summaries = locale.startsWith("ko") ? PHASE_SUMMARIES_KO : PHASE_SUMMARIES_EN;
  return summaries[phaseId];
}

/** 전체 Phase 요약 목록 반환 */
export function getAllPhaseSummaries(
  locale: string
): Record<FlowPhaseId, PhaseSummary> {
  return locale.startsWith("ko") ? PHASE_SUMMARIES_KO : PHASE_SUMMARIES_EN;
}

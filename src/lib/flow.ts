/**
 * AI 서비스 거버넌스 플로우 - 계층화된 Phase/Step 구조
 *
 * 기존 31개 flat step을 5개 Phase로 계층 분류:
 *   Phase 1: 기획 (Planning)            - 서비스 요청 ~ 모델설명서
 *   Phase 2: 검토/평가 (Review)          - 사전검토 ~ 위험성 평가
 *   Phase 3: 개발 (Development)          - 개발계획 ~ 개발 진행
 *   Phase 4: 검증/배포 (Verification)    - 운영 전 검증 ~ 배포
 *   Phase 5: 운영/개선 (Operations)      - 대시보드 ~ 개선 관리
 */

// ─── Phase 정의 ────────────────────────────────────────

export const FLOW_PHASE_IDS = [
  "planning",
  "review",
  "development",
  "verification",
  "operations",
] as const;

export type FlowPhaseId = (typeof FLOW_PHASE_IDS)[number];

export interface FlowPhase {
  id: FlowPhaseId;
  /** i18n 키 */
  titleKey: string;
  descriptionKey: string;
  /** 이 Phase에 속하는 step id 목록 (순서대로) */
  stepIds: FlowStepId[];
  /** 테마 색상 (tailwind class prefix) */
  color: string;
  /** lucide 아이콘 이름 */
  icon: string;
}

// ─── Step 정의 ─────────────────────────────────────────

export const FLOW_STEP_IDS = [
  // Phase 1: 기획
  "request-form",
  "project-create",
  "planning-doc",
  "model-doc",
  // Phase 2: 검토/평가
  "pre-review-request",
  "pre-review-result",
  "risk-assessment",
  // Phase 3: 개발
  "dev-plan",
  "risk-plan",
  "risk-level-judge",
  "risk-plan-approval",
  "governance-approval",
  "dev-request",
  "dev-progress",
  // Phase 4: 검증/배포
  "pre-op-verification",
  "verification-branch",
  "verification-adequacy",
  "third-party-verification",
  "op-approval-request",
  "deployment-approval",
  "deployment",
  // Phase 5: 운영/개선
  "dashboard",
  "improvement",
] as const;

export type FlowStepId = (typeof FLOW_STEP_IDS)[number];

export interface FlowStepBranch {
  key: string;
  path: string;
  labelKey: string;
}

export interface FlowStepDef {
  id: FlowStepId;
  path: string;
  titleKey: string;
  descriptionKey: string;
  /** 소속 Phase */
  phaseId: FlowPhaseId;
  /** 현재 활성 step인지 (false면 UI에서 비활성/잠김) */
  enabled: boolean;
  /** 다음 단계 path (단일). 분기 단계면 nextBranch 사용 */
  nextPath?: string;
  /** 분기 선택지 (위험등급 판단 등) */
  nextBranch?: FlowStepBranch[];
  /** 이전 단계 path (선형일 때) */
  prevPath?: string;
  /** 분기 단계에서만: 이 단계로 올 수 있는 이전 path들 */
  prevPaths?: string[];
}

// ─── Phase 메타데이터 ──────────────────────────────────

export const FLOW_PHASES: Record<FlowPhaseId, FlowPhase> = {
  planning: {
    id: "planning",
    titleKey: "phase.planning.title",
    descriptionKey: "phase.planning.description",
    stepIds: ["request-form", "project-create", "planning-doc", "model-doc"],
    color: "blue",
    icon: "FileEdit",
  },
  review: {
    id: "review",
    titleKey: "phase.review.title",
    descriptionKey: "phase.review.description",
    stepIds: ["pre-review-request", "pre-review-result", "risk-assessment"],
    color: "amber",
    icon: "ShieldCheck",
  },
  development: {
    id: "development",
    titleKey: "phase.development.title",
    descriptionKey: "phase.development.description",
    stepIds: [
      "dev-plan",
      "risk-plan",
      "risk-level-judge",
      "risk-plan-approval",
      "governance-approval",
      "dev-request",
      "dev-progress",
    ],
    color: "violet",
    icon: "Code2",
  },
  verification: {
    id: "verification",
    titleKey: "phase.verification.title",
    descriptionKey: "phase.verification.description",
    stepIds: [
      "pre-op-verification",
      "verification-branch",
      "verification-adequacy",
      "third-party-verification",
      "op-approval-request",
      "deployment-approval",
      "deployment",
    ],
    color: "emerald",
    icon: "CheckSquare",
  },
  operations: {
    id: "operations",
    titleKey: "phase.operations.title",
    descriptionKey: "phase.operations.description",
    stepIds: ["dashboard", "improvement"],
    color: "rose",
    icon: "Activity",
  },
};

// ─── Step 상세 정의 ────────────────────────────────────

/**
 * 활성(enabled) step: 현재 데모에서 실제 사용하는 단계
 * 비활성 step: 정의는 되어있으나 잠금 표시 (향후 확장)
 */
export const FLOW_STEPS: Record<string, FlowStepDef> = {
  // ── Phase 1: 기획 ──
  "request-form": {
    id: "request-form",
    path: "/flow/request-form",
    titleKey: "flow.request_form.title",
    descriptionKey: "flow.request_form.description",
    phaseId: "planning",
    enabled: true,
    nextPath: "/flow/pre-review-request",
    prevPath: "/",
  },
  "project-create": {
    id: "project-create",
    path: "/flow/project-create",
    titleKey: "flow.project_create.title",
    descriptionKey: "flow.project_create.description",
    phaseId: "planning",
    enabled: false,
    nextPath: "/flow/planning-doc",
    prevPath: "/flow/request-form",
  },
  "planning-doc": {
    id: "planning-doc",
    path: "/flow/planning-doc",
    titleKey: "flow.planning_doc.title",
    descriptionKey: "flow.planning_doc.description",
    phaseId: "planning",
    enabled: false,
    nextPath: "/flow/model-doc",
    prevPath: "/flow/project-create",
  },
  "model-doc": {
    id: "model-doc",
    path: "/flow/model-doc",
    titleKey: "flow.model_doc.title",
    descriptionKey: "flow.model_doc.description",
    phaseId: "planning",
    enabled: false,
    nextPath: "/flow/pre-review-request",
    prevPath: "/flow/planning-doc",
  },

  // ── Phase 2: 검토/평가 ──
  "pre-review-request": {
    id: "pre-review-request",
    path: "/flow/pre-review-request",
    titleKey: "flow.pre_review_request.title",
    descriptionKey: "flow.pre_review_request.description",
    phaseId: "review",
    enabled: true,
    nextPath: "/flow/risk-assessment",
    prevPath: "/flow/request-form",
  },
  "pre-review-result": {
    id: "pre-review-result",
    path: "/flow/pre-review-result",
    titleKey: "flow.pre_review_result.title",
    descriptionKey: "flow.pre_review_result.description",
    phaseId: "review",
    enabled: false,
    nextBranch: [
      { key: "revision", path: "/flow/planning-doc", labelKey: "flow.revision_return" },
      { key: "approved", path: "/flow/risk-assessment", labelKey: "flow.pre_review_approved_btn" },
    ],
    prevPath: "/flow/pre-review-request",
  },
  "risk-assessment": {
    id: "risk-assessment",
    path: "/flow/risk-assessment",
    titleKey: "flow.risk_assessment.title",
    descriptionKey: "flow.risk_assessment.description",
    phaseId: "review",
    enabled: true,
    nextPath: "/flow/dev-plan",
    prevPath: "/flow/pre-review-request",
  },

  // ── Phase 3: 개발 ──
  "dev-plan": {
    id: "dev-plan",
    path: "/flow/dev-plan",
    titleKey: "flow.dev_plan.title",
    descriptionKey: "flow.dev_plan.description",
    phaseId: "development",
    enabled: true,
    nextPath: "/flow/risk-plan",
    prevPath: "/flow/risk-assessment",
  },
  "risk-plan": {
    id: "risk-plan",
    path: "/flow/risk-plan",
    titleKey: "flow.risk_plan.title",
    descriptionKey: "flow.risk_plan.description",
    phaseId: "development",
    enabled: true,
    nextPath: "/dashboard",
    prevPath: "/flow/dev-plan",
  },
  "risk-level-judge": {
    id: "risk-level-judge",
    path: "/flow/risk-level-judge",
    titleKey: "flow.risk_level_judge.title",
    descriptionKey: "flow.risk_level_judge.description",
    phaseId: "development",
    enabled: false,
    nextBranch: [
      { key: "low_medium", path: "/flow/risk-plan-approval", labelKey: "flow.risk_level.low_medium" },
      { key: "high", path: "/flow/governance-approval", labelKey: "flow.risk_level.high" },
    ],
    prevPath: "/flow/risk-plan",
  },
  "risk-plan-approval": {
    id: "risk-plan-approval",
    path: "/flow/risk-plan-approval",
    titleKey: "flow.risk_plan_approval.title",
    descriptionKey: "flow.risk_plan_approval.description",
    phaseId: "development",
    enabled: false,
    nextPath: "/flow/dev-request",
    prevPath: "/flow/risk-level-judge",
  },
  "governance-approval": {
    id: "governance-approval",
    path: "/flow/governance-approval",
    titleKey: "flow.governance_approval.title",
    descriptionKey: "flow.governance_approval.description",
    phaseId: "development",
    enabled: false,
    nextPath: "/flow/dev-request",
    prevPath: "/flow/risk-level-judge",
  },
  "dev-request": {
    id: "dev-request",
    path: "/flow/dev-request",
    titleKey: "flow.dev_request.title",
    descriptionKey: "flow.dev_request.description",
    phaseId: "development",
    enabled: false,
    nextPath: "/flow/dev-progress",
    prevPaths: ["/flow/risk-plan-approval", "/flow/governance-approval"],
  },
  "dev-progress": {
    id: "dev-progress",
    path: "/flow/dev-progress",
    titleKey: "flow.dev_progress.title",
    descriptionKey: "flow.dev_progress.description",
    phaseId: "development",
    enabled: false,
    nextPath: "/flow/pre-op-verification",
    prevPath: "/flow/dev-request",
  },

  // ── Phase 4: 검증/배포 ──
  "pre-op-verification": {
    id: "pre-op-verification",
    path: "/flow/pre-op-verification",
    titleKey: "flow.pre_op_verification.title",
    descriptionKey: "flow.pre_op_verification.description",
    phaseId: "verification",
    enabled: false,
    nextPath: "/flow/verification-branch",
    prevPath: "/flow/dev-progress",
  },
  "verification-branch": {
    id: "verification-branch",
    path: "/flow/verification-branch",
    titleKey: "flow.verification_branch.title",
    descriptionKey: "flow.verification_branch.description",
    phaseId: "verification",
    enabled: false,
    nextBranch: [
      { key: "medium", path: "/flow/verification-adequacy", labelKey: "flow.risk_level.medium" },
      { key: "high", path: "/flow/third-party-verification", labelKey: "flow.risk_level.high" },
    ],
    prevPath: "/flow/pre-op-verification",
  },
  "verification-adequacy": {
    id: "verification-adequacy",
    path: "/flow/verification-adequacy",
    titleKey: "flow.verification_adequacy.title",
    descriptionKey: "flow.verification_adequacy.description",
    phaseId: "verification",
    enabled: false,
    nextPath: "/flow/op-approval-request",
    prevPath: "/flow/verification-branch",
  },
  "third-party-verification": {
    id: "third-party-verification",
    path: "/flow/third-party-verification",
    titleKey: "flow.third_party_verification.title",
    descriptionKey: "flow.third_party_verification.description",
    phaseId: "verification",
    enabled: false,
    nextPath: "/flow/op-approval-request",
    prevPath: "/flow/verification-branch",
  },
  "op-approval-request": {
    id: "op-approval-request",
    path: "/flow/op-approval-request",
    titleKey: "flow.op_approval_request.title",
    descriptionKey: "flow.op_approval_request.description",
    phaseId: "verification",
    enabled: false,
    nextPath: "/flow/deployment-approval",
    prevPaths: ["/flow/verification-adequacy", "/flow/third-party-verification"],
  },
  "deployment-approval": {
    id: "deployment-approval",
    path: "/flow/deployment-approval",
    titleKey: "flow.deployment_approval.title",
    descriptionKey: "flow.deployment_approval.description",
    phaseId: "verification",
    enabled: false,
    nextPath: "/flow/deployment",
    prevPath: "/flow/op-approval-request",
  },
  "deployment": {
    id: "deployment",
    path: "/flow/deployment",
    titleKey: "flow.deployment.title",
    descriptionKey: "flow.deployment.description",
    phaseId: "verification",
    enabled: false,
    nextPath: "/dashboard",
    prevPath: "/flow/deployment-approval",
  },

  // ── Phase 5: 운영/개선 ──
  "dashboard": {
    id: "dashboard",
    path: "/dashboard",
    titleKey: "flow.dashboard.title",
    descriptionKey: "flow.dashboard.description",
    phaseId: "operations",
    enabled: true,
    nextPath: undefined,
    prevPath: "/flow/risk-plan",
  },
  "improvement": {
    id: "improvement",
    path: "/flow/improvement",
    titleKey: "flow.improvement.title",
    descriptionKey: "flow.improvement.description",
    phaseId: "operations",
    enabled: false,
    nextPath: "/dashboard",
    prevPath: "/dashboard",
  },
};

// ─── 유틸리티 함수 ─────────────────────────────────────

/** path로 step 정의 찾기 */
export function getFlowStepByPath(path: string): FlowStepDef | undefined {
  return Object.values(FLOW_STEPS).find((s) => s.path === path || path.startsWith(s.path + "/"));
}

/** stepId로 step 정의 찾기 */
export function getFlowStepById(stepId: string): FlowStepDef | undefined {
  return FLOW_STEPS[stepId];
}

/** 이전 단계 path 계산 (분기 합류 지점 고려) */
export function getPrevPath(step: FlowStepDef): string | undefined {
  if (step.prevPath) return step.prevPath;
  if (step.prevPaths && step.prevPaths.length) return step.prevPaths[0];
  return undefined;
}

/** stepId로 소속 Phase 찾기 */
export function getPhaseByStepId(stepId: string): FlowPhase | undefined {
  const step = FLOW_STEPS[stepId];
  if (!step) return undefined;
  return FLOW_PHASES[step.phaseId];
}

/** Phase에 속한 활성 step만 반환 */
export function getEnabledStepsInPhase(phaseId: FlowPhaseId): FlowStepDef[] {
  const phase = FLOW_PHASES[phaseId];
  if (!phase) return [];
  return phase.stepIds
    .map((id) => FLOW_STEPS[id])
    .filter((s): s is FlowStepDef => !!s && s.enabled);
}

/** 전체 활성 step만 반환 (Phase 순서 유지) */
export function getEnabledSteps(): FlowStepDef[] {
  return FLOW_PHASE_IDS.flatMap((phaseId) => getEnabledStepsInPhase(phaseId));
}

/** 현재 step이 속한 Phase 내에서의 인덱스 (활성 step 기준) */
export function getStepIndexInPhase(stepId: string): number {
  const step = FLOW_STEPS[stepId];
  if (!step) return -1;
  const enabledSteps = getEnabledStepsInPhase(step.phaseId);
  return enabledSteps.findIndex((s) => s.id === stepId);
}

/** 현재 Phase의 인덱스 (0-based) */
export function getPhaseIndex(phaseId: FlowPhaseId): number {
  return FLOW_PHASE_IDS.indexOf(phaseId);
}

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getFlowStepById, getPrevPath, FLOW_STEPS, getPhaseByStepId, getEnabledSteps, getStepIndexInPhase, getEnabledStepsInPhase } from "@/lib/flow";
import { getFlowRequirements, getPhaseSummary } from "@/lib/flowRequirements";
import { ROUTE_PATHS } from "@/lib";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, GitBranch, ListChecks, Brain, Sparkles, ShieldCheck, Zap, Bot, MessageSquare, BookOpen, Wand2, Search, Save, Paperclip, FileText, Upload, CheckCircle2, XCircle, AlertTriangle, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { JourneyStepper } from "@/components/flow/JourneyStepper";
import { ScenarioSummaryCard } from "@/components/flow/ScenarioSummaryCard";

// Generated Abstract Illustrations
import imgPlanning from "@/assets/flow_planning.png";
import imgRisk from "@/assets/flow_risk.png";
import imgDev from "@/assets/flow_dev.png";
import imgApproval from "@/assets/flow_approval.png";

// Helper to get image based on step ID
const getStepImage = (stepId: string) => {
  if (stepId.includes("planning") || stepId.includes("project") || stepId.includes("model")) return imgPlanning;
  if (stepId.includes("risk") || stepId.includes("analysis")) return imgRisk;
  if (stepId.includes("dev") || stepId.includes("progress")) return imgDev;
  if (stepId.includes("approval") || stepId.includes("verification") || stepId.includes("review")) return imgApproval;
  return imgPlanning; // default
};

export default function FlowStepPage() {
  const { stepId } = useParams<{ stepId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // State for checkboxes, consultation, and user inputs
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [userInputs, setUserInputs] = useState<Record<string, {
    comment: string,
    regulation: string,
    files?: File[],
    selectedOption?: string,
    monitoring?: { indicator: string, threshold: string, period: string },
    approvalMsg?: string
  }>>({});
  const [isLocked, setIsLocked] = useState(false);
  const [isConsulting, setIsConsulting] = useState(false);
  const [consultResult, setConsultResult] = useState<any>(null);
  const [processingState, setProcessingState] = useState<Record<string, string>>({}); // 'generating' | 'searching'
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);

  const requirements = stepId ? getFlowRequirements(stepId, i18n.language) : [];
  const step = stepId ? getFlowStepById(stepId) : undefined;

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Reset state on step change or load from localStorage
  useEffect(() => {
    if (!stepId) return;

    // Load selected scenario context
    const storedScenarioId = localStorage.getItem("selected_scenario");
    setSelectedScenarioId(storedScenarioId);

    // Load saved data
    const savedData = localStorage.getItem(`flow_step_${stepId}`);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setCheckedItems(parsed.checkedItems || {});
        setUserInputs(parsed.userInputs || {});
        setIsLocked(parsed.isLocked || false);
        // Note: Files cannot be restored from localStorage directly,  
        // implementation would need a real backend for file persistence.
        // For now, we accept they are lost on refresh in this simplified demo.
      } catch (e) {
        console.error("Failed to load saved flow data", e);
      }
    } else {
      setCheckedItems({});
      setUserInputs({});
    }

    setConsultResult(null);
    setIsConsulting(false);
    setProcessingState({});
  }, [stepId]);

  // dashboard redirect
  useEffect(() => {
    if (stepId === "dashboard") {
      navigate(ROUTE_PATHS.DASHBOARD, { replace: true });
    }
  }, [stepId, navigate]);

  if (!stepId || !step) {
    navigate(ROUTE_PATHS.FLOW_REQUEST_FORM, { replace: true });
    return null;
  }

  if (stepId === "dashboard") return null;

  const prevPath = getPrevPath(step);
  const hasBranch = step.nextBranch && step.nextBranch.length > 0;
  const nextPath = !hasBranch ? step.nextPath : undefined;

  const handlePrev = () => {
    if (prevPath) navigate(prevPath);
    else navigate(ROUTE_PATHS.HOME);
  };

  const handleBackToDemo = () => {
    navigate(ROUTE_PATHS.DEMO);
  };

  const handleNext = (path: string) => {
    // 입력 여부와 관계없이 항상 다음 단계로 이동
    navigate(path);
  };
  // ... rest of logic ...

  const handleSave = () => {
    // Save provided data to localStorage
    const dataToSave = {
      checkedItems,
      userInputs: Object.keys(userInputs).reduce((acc, key) => {
        // Exclude files from localStorage save
        const { files, ...rest } = userInputs[key];
        acc[key] = rest;
        return acc;
      }, {} as any),
      isLocked
    };
    localStorage.setItem(`flow_step_${stepId}`, JSON.stringify(dataToSave));
    toast.success(i18n.language.startsWith('ko') ? "임시 저장되었습니다." : "Draft saved successfully.");
  };

  const enabledSteps = getEnabledSteps();
  const enabledIndex = enabledSteps.findIndex((s) => s.id === stepId);
  const totalEnabled = enabledSteps.filter((s) => s.id !== "dashboard").length;
  const progress = totalEnabled > 0 ? Math.round((enabledIndex / totalEnabled) * 100) : 0;
  const currentPhase = getPhaseByStepId(stepId);
  const phaseSummary = currentPhase ? getPhaseSummary(currentPhase.id, i18n.language) : null;
  const stepInPhaseIndex = getStepIndexInPhase(stepId);
  const phaseEnabledSteps = currentPhase ? getEnabledStepsInPhase(currentPhase.id) : [];

  const handleCheck = (id: string, checked: boolean) => {
    setCheckedItems(prev => ({ ...prev, [id]: checked }));
  };

  const handleInputChange = (id: string, field: 'comment' | 'regulation', value: string) => {
    setUserInputs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const handleMonitoringChange = (id: string, field: 'indicator' | 'threshold' | 'period', value: string) => {
    setUserInputs(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        monitoring: {
          ...(prev[id]?.monitoring || { indicator: '', threshold: '', period: '' }),
          [field]: value
        }
      }
    }));
  };

  const handleSelectionChange = (id: string, value: string) => {
    setUserInputs(prev => ({
      ...prev,
      [id]: { ...prev[id], selectedOption: value }
    }));
  };

  const handleAction = (id: string, action: string) => {
    console.log(`Action: ${action} for ${id}`);

    // System notification simulation
    if (['approve', 'confirm', 'deploy', 'request_approval'].includes(action)) {
      toast.success(i18n.language.startsWith('ko')
        ? "담당자에게 시스템 알림이 발송되었습니다."
        : "System notification sent to the person in charge.");
    }

    if (action === 'request_revision' || action === 'reject') {
      toast.warning(i18n.language.startsWith('ko')
        ? "보완 요청 알림이 발송되었습니다."
        : "Revision request notification sent.");
    }

    if (action === 'save') {
      toast.info(i18n.language.startsWith('ko') ? "저장되었습니다." : "Saved.");
    }

    // Locking logic
    if (['apply', 'confirm', 'approve', 'deploy', 'request_approval'].includes(action)) {
      setIsLocked(true);
      // Determine lock message
      const msg = i18n.language.startsWith('ko')
        ? "제출이 완료되어 수정이 제한됩니다."
        : "Submission completed. Editing is locked.";
      toast.info(msg);

      // Save lock state immediately
      const savedData = localStorage.getItem(`flow_step_${stepId}`);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        parsed.isLocked = true;
        localStorage.setItem(`flow_step_${stepId}`, JSON.stringify(parsed));
      }
    }
  };

  const handleFileUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setUserInputs(prev => ({
        ...prev,
        [id]: {
          ...prev[id],
          files: [...(prev[id]?.files || []), ...newFiles]
        }
      }));
      toast.success(i18n.language.startsWith('ko') ? "파일이 첨부되었습니다." : "File attached.");
    }
  };

  const triggerFileUpload = (id: string) => {
    if (!isLocked) {
      fileInputRefs.current[id]?.click();
    }
  };

  const handleAutoWrite = (id: string, featureName: string) => {
    setProcessingState(prev => ({ ...prev, [id]: 'generating' }));
    setTimeout(() => {
      const mockComment = i18n.language.startsWith('ko')
        ? `[AI 자동생성] '${featureName}'에 대한 초기 기획안은 안정성을 최우선으로 고려해야 합니다.\n\n1. 목적: 효율적인 에너지 관리\n2. 주요 기능: 실시간 모니터링 및 예측`
        : `[AI Auto] Initial draft for '${featureName}' should prioritize stability.\n\n1. Purpose: Efficient energy management\n2. Key Features: Real-time monitoring and prediction`;

      handleInputChange(id, 'comment', mockComment);
      setProcessingState(prev => ({ ...prev, [id]: '' }));
    }, 1500);
  };

  const handleSearchRegulation = (id: string, featureName: string) => {
    setProcessingState(prev => ({ ...prev, [id]: 'searching' }));
    setTimeout(() => {
      const mockReg = i18n.language.startsWith('ko')
        ? "ISO/IEC 42001 (AI Management System)"
        : "ISO/IEC 42001 (AI Management System)";
      handleInputChange(id, 'regulation', mockReg);
      setProcessingState(prev => ({ ...prev, [id]: '' }));
    }, 1500);
  };

  const handleConsult = () => {
    setIsConsulting(true);
    setConsultResult(null);

    // Collect first non-empty comment or use default
    const firstInputId = Object.keys(userInputs).find(k => userInputs[k]?.comment);
    const userInputComment = firstInputId ? userInputs[firstInputId].comment : (i18n.language.startsWith('ko') ? "기본 분석 모드" : "Default Analysis Mode");

    // Collect first non-empty regulation or use default
    const firstRegId = Object.keys(userInputs).find(k => userInputs[k]?.regulation);
    const userInputReg = firstRegId ? userInputs[firstRegId].regulation : (i18n.language.startsWith('ko') ? "EU AI Act" : "EU AI Act");

    // Simulate sLLM processing time
    setTimeout(() => {
      setIsConsulting(false);
      setConsultResult({
        planning: t("flow_consult.mock_planning").replace('{comment}', userInputComment.substring(0, 20) + (userInputComment.length > 20 ? "..." : "")),
        development: t("flow_consult.mock_dev").replace('{regulation}', userInputReg),
        operation: t("flow_consult.mock_op"),
        intro: t("flow_consult.mock_intro")
      });
    }, 2500);
  };

  return (
    <Layout>
      <div className="max-w-[1600px] mx-auto space-y-8 pb-20 px-4 md:px-8">
        {/* Journey Stepper */}
        <JourneyStepper currentFlowStepId={stepId} />

        {/* Redesigned Hero Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[2.5rem] overflow-hidden border border-white/20 shadow-2xl bg-white min-h-[320px] flex items-center justify-center text-center"
        >
          {/* Background Image */}
          <img
            src="/assets/flow_hero_bg.png"
            className="absolute inset-0 w-full h-full object-cover opacity-90"
            alt="Background"
          />
          <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />

          {/* Centered Content */}
          <div className="relative z-10 flex flex-col items-center gap-5 max-w-4xl px-4">
            {/* Phase Breadcrumb */}
            {phaseSummary && (
              <div className="flex items-center gap-2 text-sm font-bold tracking-wide text-foreground/70">
                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
                  {phaseSummary.title}
                </span>
                {phaseEnabledSteps.length > 1 && (
                  <>
                    <span className="text-foreground/30">/</span>
                    <span className="text-xs text-foreground/50">
                      {i18n.language.startsWith('ko')
                        ? `${stepInPhaseIndex + 1} / ${phaseEnabledSteps.length}`
                        : `Step ${stepInPhaseIndex + 1} of ${phaseEnabledSteps.length}`}
                    </span>
                  </>
                )}
              </div>
            )}

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-tight">
              {t(step.titleKey)}
            </h1>

            <p className="text-xl md:text-2xl font-bold text-foreground/90 leading-relaxed break-keep">
              {t(step.descriptionKey)}
            </p>
          </div>

          {/* Action Buttons (Absolute Right) */}
          <div className="absolute bottom-6 right-6 hidden xl:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToDemo}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Demo View
            </Button>
          </div>

          {/* Mobile Actions (Visible only on small screens) */}
          <div className="xl:hidden absolute top-4 right-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToDemo}
            >
              <Layout className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        {/* Action Bar (Below Header for better usability in this centered layout) */}
        <div className="flex justify-end gap-3 pb-2">
          <Button
            variant="outline"
            size="lg"
            onClick={handleSave}
            disabled={isLocked}
            className="gap-2 rounded-full border-primary/20 hover:bg-primary/5"
          >
            <Save className="w-4 h-4" />
            {i18n.language.startsWith('ko') ? "임시 저장" : "Save Draft"}
          </Button>

          {(nextPath || hasBranch) && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleNext(nextPath || step.nextBranch![0].path)}
              className="gap-2 rounded-full border-primary/50 text-primary hover:bg-primary/10"
            >
              {i18n.language.startsWith('ko') ? "다음 단계" : "Next Step"}
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          <Button
            size="lg"
            onClick={handleConsult}
            disabled={isConsulting || isLocked}
            className="rounded-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg border-0"
          >
            {isConsulting ? (
              <>
                <Brain className="w-5 h-5 mr-2 animate-pulse" />
                {t("flow_consult.btn_consulting")}
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                {t("flow_consult.btn_consult")}
              </>
            )}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* Main Content: Requirements Checklist */}
          <motion.div
            className="xl:col-span-8 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {requirements.length > 0 ? (
              <div className="grid gap-6">
                {requirements.map((feat, idx) => {
                  const id = `req-${idx}`;
                  const isChecked = !!checkedItems[id];
                  const isGenerating = processingState[id] === 'generating';
                  const isSearching = processingState[id] === 'searching';
                  const attachedFiles = userInputs[id]?.files || [];

                  return (
                    <motion.div
                      key={idx}
                      layout
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: idx * 0.1, duration: 0.4 }}
                      className={cn(
                        "group relative rounded-[2rem] border bg-card/60 backdrop-blur-sm p-1 shadow-sm transition-all duration-300 overflow-hidden",
                        isChecked
                          ? "border-green-500/30 bg-green-50/10 shadow-lg shadow-green-500/5 ring-1 ring-green-500/10"
                          : "hover:border-purple-500/30 hover:shadow-lg hover:shadow-purple-500/5 hover:-translate-y-1"
                      )}
                    >
                      {/* Inner Card Container */}
                      <div className="bg-background/80 rounded-[1.8rem] p-6 h-full">

                        {/* Requirement Header */}
                        <div className="flex items-start gap-5 mb-6">
                          <div className={cn(
                            "mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300",
                            isChecked
                              ? "bg-green-500 border-green-500 text-white shadow-md shadow-green-500/20"
                              : "border-muted-foreground/30 text-muted-foreground/30 bg-secondary/50"
                          )}>
                            <Checkbox
                              id={id}
                              checked={isChecked}
                              onCheckedChange={(c) => handleCheck(id, c as boolean)}
                              className="opacity-0 absolute w-8 h-8 cursor-pointer" // Invisible overlay for click area
                              disabled={isLocked}
                            />
                            {isChecked && <CheckCircle2 className="w-5 h-5" />}
                          </div>

                          <div className="space-y-1.5 flex-1">
                            <label
                              htmlFor={id}
                              className={cn(
                                "text-xl font-bold cursor-pointer transition-colors block leading-tight",
                                isChecked ? "text-green-700 dark:text-green-400" : "text-foreground group-hover:text-purple-600"
                              )}
                            >
                              {feat.featureName}
                            </label>
                            <p className="text-sm text-muted-foreground font-medium">{feat.description}</p>

                            {/* Requirement Guide Box */}
                            <div className="relative mt-3 p-4 rounded-xl bg-gradient-to-br from-secondary/50 to-background border border-border/40 text-sm text-foreground/80 leading-relaxed">
                              <div className="absolute -left-1 top-4 w-1 h-6 bg-purple-400/50 rounded-r-full" />
                              <span className="font-bold text-purple-600/80 mr-2 text-xs uppercase tracking-wide">Requirement</span>
                              {feat.requirement}
                            </div>
                          </div>
                        </div>


                        {/* Dynamic Content Based on UI Type */}
                        <div className="border-t border-border/40 pt-4 space-y-4">

                          {/* 1. Monitoring Input */}
                          {feat.uiType === 'monitoring' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 bg-secondary/20 p-4 rounded-xl">
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">{t("flow.monitoring.indicator") || "Indicator"}</label>
                                <Input
                                  placeholder="e.g. Accuracy, Latency"
                                  value={userInputs[id]?.monitoring?.indicator || ""}
                                  onChange={(e) => handleMonitoringChange(id, 'indicator', e.target.value)}
                                  className="bg-background"
                                  disabled={isLocked}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">{t("flow.monitoring.threshold") || "Threshold"}</label>
                                <Input
                                  placeholder="e.g. < 200ms, > 95%"
                                  value={userInputs[id]?.monitoring?.threshold || ""}
                                  onChange={(e) => handleMonitoringChange(id, 'threshold', e.target.value)}
                                  className="bg-background"
                                  disabled={isLocked}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground">{t("flow.monitoring.period") || "Period"}</label>
                                <Input
                                  placeholder="e.g. Daily, Real-time"
                                  value={userInputs[id]?.monitoring?.period || ""}
                                  onChange={(e) => handleMonitoringChange(id, 'period', e.target.value)}
                                  className="bg-background"
                                  disabled={isLocked}
                                />
                              </div>
                            </div>
                          )}

                          {/* 2. Selection Input */}
                          {feat.uiType === 'selection' && feat.options && (
                            <div className="mb-4">
                              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Select Option</label>
                              <Select onValueChange={(val) => handleSelectionChange(id, val)} value={userInputs[id]?.selectedOption} disabled={isLocked}>
                                <SelectTrigger className="w-full md:w-[300px]">
                                  <SelectValue placeholder="Select target..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {feat.options.map((opt, oIdx) => (
                                    <SelectItem key={oIdx} value={opt}>{opt}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                          {/* Standard Inputs (Comment & Regulation) - Skip if upload_only */}
                          {feat.uiType !== 'upload_only' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Comment Section */}
                              <div className="space-y-2.5 md:col-span-2">
                                {/* Header & Tools */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
                                    <span>{t("flow.input.comment_label") || "Details / Review"}</span>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                                      onClick={() => triggerFileUpload(id)}
                                      disabled={isLocked}
                                    >
                                      <Paperclip className="w-3.5 h-3.5 mr-1.5" />
                                      {i18n.language.startsWith('ko') ? "파일 첨부" : "Attach File"}
                                    </Button>
                                    <input
                                      type="file"
                                      className="hidden"
                                      ref={el => fileInputRefs.current[id] = el}
                                      onChange={(e) => handleFileUpload(id, e)}
                                      multiple
                                      disabled={isLocked}
                                    />
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 px-2 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                      onClick={() => handleAutoWrite(id, feat.featureName)}
                                      disabled={isGenerating || isLocked}
                                    >
                                      <Wand2 className={cn("w-3 h-3 mr-1.5", isGenerating && "animate-spin")} />
                                      {isGenerating ? t("flow_consult.generating") : t("flow_consult.btn_auto_write")}
                                    </Button>
                                  </div>
                                </div>
                                <Textarea
                                  placeholder={feat.placeholder || (i18n.language.startsWith('ko') ? "여기에 내용을 작성하세요..." : "Write details here...")}
                                  className="min-h-[120px] text-sm resize-y bg-background/50 focus:bg-background border-border/60 focus:border-purple-500/50 shadow-inner rounded-xl transition-all"
                                  value={userInputs[id]?.comment || ""}
                                  onChange={(e) => handleInputChange(id, 'comment', e.target.value)}
                                  disabled={isLocked}
                                />
                              </div>

                              {/* Regulation Section */}
                              <div className="space-y-2.5 md:col-span-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>{t("flow.input.regulation_label")}</span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 px-2 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                    onClick={() => handleSearchRegulation(id, feat.featureName)}
                                    disabled={isSearching}
                                  >
                                    <Search className={cn("w-3 h-3 mr-1.5", isSearching && "animate-pulse")} />
                                    {isSearching ? t("flow_consult.searching") : t("flow_consult.btn_search_reg")}
                                  </Button>
                                </div>
                                <div className="relative group/input">
                                  <Input
                                    placeholder={t("flow.input.regulation_placeholder")}
                                    className="h-10 text-sm bg-background/50 focus:bg-background border-border/60 focus:border-indigo-500/50 shadow-inner rounded-xl pr-9 transition-all"
                                    value={userInputs[id]?.regulation || ""}
                                    onChange={(e) => handleInputChange(id, 'regulation', e.target.value)}
                                  />
                                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground opacity-50 group-focus-within/input:opacity-100 transition-opacity">
                                    <ShieldCheck className="w-4 h-4" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Upload Only View */}
                          {feat.uiType === 'upload_only' && (
                            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer" onClick={() => triggerFileUpload(id)}>
                              <Upload className="w-10 h-10 text-muted-foreground mb-3" />
                              <p className="text-sm font-medium text-foreground">{i18n.language.startsWith('ko') ? "여기를 클릭하여 파일 업로드" : "Click here to upload files"}</p>
                              <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, JPG supported</p>
                              <input
                                type="file"
                                className="hidden"
                                ref={el => fileInputRefs.current[id] = el}
                                onChange={(e) => handleFileUpload(id, e)}
                                multiple
                              />
                            </div>
                          )}

                          {/* Attached Files List (Common) */}
                          {attachedFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2 p-2 bg-secondary/30 rounded-lg">
                              {attachedFiles.map((file, fIdx) => (
                                <div key={fIdx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background text-xs text-foreground border shadow-sm">
                                  <FileText className="w-3 h-3 text-purple-500" />
                                  <span className="max-w-[150px] truncate">{file.name}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Action Buttons */}
                          {feat.actionButtons && feat.actionButtons.length > 0 && (
                            <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-border/30">
                              {feat.actionButtons.map(action => {
                                let btnLabel = action;
                                let btnClass = "";
                                let Icon = CheckCircle2;

                                if (action === 'approve') {
                                  btnLabel = i18n.language.startsWith('ko') ? "승인" : "Approve";
                                  btnClass = "bg-green-600 hover:bg-green-700 text-white";
                                } else if (action === 'reject') {
                                  btnLabel = i18n.language.startsWith('ko') ? "반려" : "Reject";
                                  btnClass = "bg-red-600 hover:bg-red-700 text-white";
                                  Icon = XCircle;
                                } else if (action === 'request_revision') {
                                  btnLabel = i18n.language.startsWith('ko') ? "보완 요청" : "Request Revision";
                                  btnClass = "bg-amber-500 hover:bg-amber-600 text-white";
                                  Icon = AlertTriangle;
                                } else if (action === 'confirm') {
                                  btnLabel = i18n.language.startsWith('ko') ? "확정" : "Confirm";
                                  btnClass = "bg-blue-600 hover:bg-blue-700 text-white";
                                } else if (action === 'save') {
                                  btnLabel = i18n.language.startsWith('ko') ? "저장" : "Save";
                                  btnClass = "bg-secondary text-secondary-foreground hover:bg-secondary/80";
                                  Icon = Save;
                                } else if (action === 'deploy') {
                                  btnLabel = i18n.language.startsWith('ko') ? "배포" : "Deploy";
                                  btnClass = "bg-indigo-600 hover:bg-indigo-700 text-white";
                                  Icon = Send;
                                }

                                return (
                                  <Button key={action} size="sm" className={btnClass} onClick={() => handleAction(id, action)}>
                                    <Icon className="w-4 h-4 mr-2" />
                                    {btnLabel}
                                  </Button>
                                )
                              })}
                            </div>
                          )}

                        </div>

                        {/* Card Footer Decoration */}
                      </div>
                    </motion.div>
                  );
                })}


              </div>
            ) : (
              <div className="min-h-[200px] rounded-2xl bg-muted/30 border-2 border-dashed border-border flex items-center justify-center p-8 text-center text-muted-foreground">
                <p>{t("flow.step_placeholder")}</p>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-8 border-t">
              <Button
                variant="outline"
                size="lg"
                onClick={handlePrev}
                disabled={!prevPath}
                className="gap-2 rounded-full px-6 hover:bg-secondary/80"
              >
                <ChevronLeft className="w-4 h-4" />
                {t("flow.btn_prev")}
              </Button>

              {hasBranch ? (
                <div className="flex flex-wrap gap-3 justify-end">
                  {step.nextBranch!.map((branch) => (
                    <Button
                      key={branch.key}
                      size="lg"
                      onClick={() => handleNext(branch.path)}
                      className="gap-2 rounded-full px-6 bg-primary/90 hover:bg-primary"
                    >
                      <GitBranch className="w-4 h-4" />
                      {t(branch.labelKey)}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ))}
                </div>
              ) : nextPath ? (
                <Button
                  size="lg"
                  onClick={() => handleNext(nextPath)}
                  className="gap-2 rounded-full px-6 bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20"
                >
                  {t("flow.btn_next")}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : null}
            </div>
          </motion.div>

          {/* Sidebar: sLLM Consultant Result */}
          <div className="xl:col-span-4 sticky top-6">
            {selectedScenarioId && <ScenarioSummaryCard scenarioId={selectedScenarioId} />}
            <AnimatePresence mode="wait">
              {consultResult ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="border-0 shadow-2xl overflow-hidden bg-background/60 backdrop-blur-xl ring-1 ring-border/50">
                    <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-indigo-500/5 pointer-events-none" />
                    <CardHeader className="bg-gradient-to-r from-purple-100/50 to-indigo-100/50 dark:from-purple-900/20 dark:to-indigo-900/20 pb-6 border-b border-purple-500/10 relative">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/30">
                          <Bot className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-indigo-700 dark:from-purple-300 dark:to-indigo-300">
                            {t("flow_consult.report_title")}
                          </CardTitle>
                          <p className="text-xs font-medium text-muted-foreground mt-0.5">GnG International AI Analysis</p>
                        </div>
                      </div>
                      <CardDescription className="text-foreground/70 mt-3 text-sm leading-relaxed">
                        {t("flow_consult.report_desc")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6 relative">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5 text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                          <div className="p-1 rounded bg-green-100 dark:bg-green-900/30">
                            <Brain className="w-3.5 h-3.5" />
                          </div>
                          {t("flow_consult.sec_planning")}
                        </div>
                        <p className="text-sm text-foreground/80 bg-card/50 p-4 rounded-xl border border-border/50 text-justify leading-relaxed shadow-sm">
                          {consultResult.planning}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5 text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                          <div className="p-1 rounded bg-blue-100 dark:bg-blue-900/30">
                            <Zap className="w-3.5 h-3.5" />
                          </div>
                          {t("flow_consult.sec_dev")}
                        </div>
                        <p className="text-sm text-foreground/80 bg-card/50 p-4 rounded-xl border border-border/50 text-justify leading-relaxed shadow-sm">
                          {consultResult.development}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5 text-sm font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                          <div className="p-1 rounded bg-amber-100 dark:bg-amber-900/30">
                            <ShieldCheck className="w-3.5 h-3.5" />
                          </div>
                          {t("flow_consult.sec_op")}
                        </div>
                        <p className="text-sm text-foreground/80 bg-card/50 p-4 rounded-xl border border-border/50 text-justify leading-relaxed shadow-sm">
                          {consultResult.operation}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-border/50 mt-2">
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="w-4 h-4 text-purple-600" />
                          <span className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase">{t("flow_consult.sec_intro")}</span>
                        </div>
                        <p className="text-sm text-muted-foreground italic pl-6 border-l-2 border-purple-200 dark:border-purple-800">
                          "{consultResult.intro}"
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="border-2 border-dashed h-full min-h-[500px] flex items-center justify-center bg-muted/10 backdrop-blur-sm">
                    <div className="text-center p-8 space-y-6 max-w-[280px]">
                      <div className="relative mx-auto w-24 h-24">
                        <div className="absolute inset-0 bg-purple-500/20 rounded-full animate-ping" />
                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-white dark:from-purple-900 dark:to-gray-900 flex items-center justify-center shadow-lg border border-purple-200 dark:border-purple-700">
                          <Bot className="w-10 h-10 text-purple-600 dark:text-purple-300" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-2">{t("flow_consult.placeholder_title")}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {t("flow_consult.placeholder_desc")}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground/80">
                        <div className="bg-background/80 p-2 rounded-lg border flex flex-col items-center gap-1">
                          <Wand2 className="w-4 h-4 text-purple-500" />
                          <span>Auto Write</span>
                        </div>
                        <div className="bg-background/80 p-2 rounded-lg border flex flex-col items-center gap-1">
                          <Search className="w-4 h-4 text-indigo-500" />
                          <span>Reg Search</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div >
    </Layout >
  );
}

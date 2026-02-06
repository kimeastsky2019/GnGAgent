import React from 'react';
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CheckCircle2, FileEdit, ShieldCheck, Code2, CheckSquare, Activity, Lock } from "lucide-react";
import { FLOW_PHASE_IDS, FLOW_PHASES, getPhaseByStepId, getEnabledStepsInPhase } from "@/lib/flow";
import { getPhaseSummary } from "@/lib/flowRequirements";
import type { FlowPhaseId } from "@/lib/flow";

interface JourneyStepperProps {
    currentFlowStepId: string;
}

const PHASE_ICONS: Record<FlowPhaseId, React.ElementType> = {
    planning: FileEdit,
    review: ShieldCheck,
    development: Code2,
    verification: CheckSquare,
    operations: Activity,
};

const PHASE_COLORS: Record<FlowPhaseId, { active: string; completed: string; ring: string }> = {
    planning: { active: "border-blue-500 text-blue-600", completed: "bg-blue-500 border-blue-500 text-white", ring: "shadow-blue-500/30" },
    review: { active: "border-amber-500 text-amber-600", completed: "bg-amber-500 border-amber-500 text-white", ring: "shadow-amber-500/30" },
    development: { active: "border-violet-500 text-violet-600", completed: "bg-violet-500 border-violet-500 text-white", ring: "shadow-violet-500/30" },
    verification: { active: "border-emerald-500 text-emerald-600", completed: "bg-emerald-500 border-emerald-500 text-white", ring: "shadow-emerald-500/30" },
    operations: { active: "border-rose-500 text-rose-600", completed: "bg-rose-500 border-rose-500 text-white", ring: "shadow-rose-500/30" },
};

export function JourneyStepper({ currentFlowStepId }: JourneyStepperProps) {
    const { i18n } = useTranslation();
    const currentPhase = getPhaseByStepId(currentFlowStepId);
    const currentPhaseIndex = currentPhase ? FLOW_PHASE_IDS.indexOf(currentPhase.id) : 0;

    return (
        <div className="w-full py-6 mb-4">
            <div className="relative flex items-center justify-between max-w-4xl mx-auto px-4">
                {/* Connection Line */}
                <div className="absolute left-8 right-8 top-6 h-1 bg-secondary -z-10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 via-violet-500 to-rose-500 transition-all duration-700 ease-out"
                        style={{ width: `${(currentPhaseIndex / (FLOW_PHASE_IDS.length - 1)) * 100}%` }}
                    />
                </div>

                {FLOW_PHASE_IDS.map((phaseId, index) => {
                    const phase = FLOW_PHASES[phaseId];
                    const isCompleted = index < currentPhaseIndex;
                    const isCurrent = index === currentPhaseIndex;
                    const enabledCount = getEnabledStepsInPhase(phaseId).length;
                    const summary = getPhaseSummary(phaseId, i18n.language);
                    const Icon = PHASE_ICONS[phaseId];
                    const colors = PHASE_COLORS[phaseId];
                    const hasEnabledSteps = enabledCount > 0;

                    return (
                        <div key={phaseId} className="relative flex flex-col items-center group">
                            <div className={cn(
                                "w-12 h-12 rounded-full flex items-center justify-center border-[3px] transition-all duration-500 z-10 bg-background",
                                isCompleted ? cn(colors.completed, "shadow-lg", colors.ring) :
                                    isCurrent ? cn(colors.active, "shadow-xl scale-110", colors.ring) :
                                        "border-secondary text-muted-foreground/40"
                            )}>
                                {isCompleted ? (
                                    <CheckCircle2 className="w-6 h-6" />
                                ) : !hasEnabledSteps && !isCurrent ? (
                                    <Lock className="w-4 h-4" />
                                ) : (
                                    <Icon className="w-5 h-5" />
                                )}
                            </div>

                            {/* Label - always visible for current, hover for others */}
                            <div className={cn(
                                "absolute top-[3.5rem] w-28 text-center transition-all duration-300",
                                isCurrent
                                    ? "opacity-100 translate-y-0"
                                    : "opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
                            )}>
                                <span className={cn(
                                    "text-xs font-bold block leading-tight",
                                    isCurrent ? "text-foreground" :
                                        isCompleted ? "text-foreground/70" : "text-muted-foreground"
                                )}>
                                    {summary.title}
                                </span>
                                <span className="text-[10px] text-muted-foreground/60 block mt-0.5">
                                    {enabledCount}/{phase.stepIds.length}
                                </span>
                            </div>

                            {/* Current phase always shows label */}
                            {isCurrent && (
                                <div className="absolute top-[3.5rem] w-28 text-center">
                                    <span className="text-xs font-bold block text-foreground leading-tight">
                                        {summary.title}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                                        {enabledCount}/{phase.stepIds.length}
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

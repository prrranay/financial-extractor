"use client";

import React from "react";
import { Loader2, CheckCircle2, Circle } from "lucide-react";

interface LoadingProgressProps {
  currentStepIndex: number;
  steps: string[];
}

const STEP_4_SUB_STEPS = [
  "Initializing PDF layout engine...",
  "Generating chart data models...",
  "Drawing Page 1: Investment Recommendation...",
  "Drawing Page 2: Growth Charts & Financial Trends...",
  "Drawing Page 3: Financial & Valuation Tables...",
  "Drawing Page 4: Analyst Disclosures & Grievances...",
  "Compressing final report elements...",
  "Finalizing document compilation...",
];

export function LoadingProgress({
  currentStepIndex,
  steps,
}: LoadingProgressProps) {
  const [subStepIndex, setSubStepIndex] = React.useState(0);

  React.useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined = undefined;
    if (currentStepIndex === 3) {
      setSubStepIndex(0);
      interval = setInterval(() => {
        setSubStepIndex((prev) => {
          if (prev < STEP_4_SUB_STEPS.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 3000);
    } else {
      setSubStepIndex(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentStepIndex]);

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-8 animate-in fade-in duration-500">
      {/* Premium Loader Ring */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-20 w-20 rounded-full border-4 border-indigo-500/10" />
        <Loader2 className="h-16 w-16 text-indigo-400 animate-spin" />
      </div>

      <div className="text-center space-y-2 max-w-sm">
        <h3 className="text-lg font-bold text-white tracking-wide">
          Generating Equity Report
        </h3>
        <p className="text-sm text-indigo-400 font-medium animate-pulse">
          {steps[currentStepIndex]}
        </p>
      </div>

      {/* Progress Checklist */}
      <div className="w-full max-w-xs bg-slate-900/50 rounded-xl p-4 border border-slate-800/80 space-y-3">
        {steps.map((step, idx) => {
          const isCompleted = idx < currentStepIndex;
          const isActive = idx === currentStepIndex;

          return (
            <div key={step} className="flex flex-col">
              <div
                className={`flex items-center space-x-3 text-xs transition-colors duration-300 ${
                  isCompleted
                    ? "text-emerald-400 font-medium"
                    : isActive
                    ? "text-indigo-400 font-semibold"
                    : "text-slate-600"
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 animate-in zoom-in duration-300" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 shrink-0 text-indigo-400 animate-spin" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0" />
                )}
                <span className="truncate">{step}</span>
              </div>

              {/* Sub-steps for step 4 (idx === 3) when active */}
              {isActive && idx === 3 && (
                <div className="mt-2 pl-7 space-y-1.5 border-l border-slate-800 ml-2 animate-in fade-in slide-in-from-top duration-300">
                  <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-normal">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                    </span>
                    <span
                      key={subStepIndex}
                      className="animate-in fade-in slide-in-from-left-1 duration-300 truncate"
                    >
                      {STEP_4_SUB_STEPS[subStepIndex]}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

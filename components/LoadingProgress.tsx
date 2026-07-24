"use client";

import React from "react";
import { Loader2, CheckCircle2, Circle } from "lucide-react";

interface LoadingProgressProps {
  currentStepIndex: number;
  steps: string[];
}

export function LoadingProgress({
  currentStepIndex,
  steps,
}: LoadingProgressProps) {
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
            <div
              key={step}
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
          );
        })}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import { Check, Download, RotateCcw, FileText } from "lucide-react";
import { Button } from "./ui/button";

interface ReportSuccessProps {
  downloadUrl: string;
  companyName: string;
  onRestart: () => void;
}

export function ReportSuccess({
  downloadUrl,
  companyName,
  onRestart,
}: ReportSuccessProps) {
  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${companyName.replace(/[^a-zA-Z0-9]/g, "_")}_Research_Report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col items-center justify-center py-6 text-center space-y-6 animate-in fade-in zoom-in duration-500">
      {/* Success Stamp */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-16 w-16 bg-emerald-500/10 rounded-full animate-ping duration-1000" />
        <div className="h-16 w-16 bg-emerald-500/15 rounded-full flex items-center justify-center text-emerald-400 border border-emerald-500/25">
          <Check className="h-8 w-8 stroke-[3]" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-bold text-white tracking-wide">
          Report Generated Successfully
        </h3>
        <p className="text-sm text-slate-400 max-w-sm">
          A professional 4-page equity research report for{" "}
          <span className="font-semibold text-slate-200">{companyName}</span> is ready for download.
        </p>
      </div>

      {/* Report Info Card */}
      <div className="w-full max-w-xs bg-slate-900/40 rounded-xl p-4 border border-slate-800/80 flex items-center space-x-4">
        <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/15">
          <FileText className="h-6 w-6" />
        </div>
        <div className="text-left space-y-0.5">
          <p className="text-xs font-semibold text-slate-300 max-w-[170px] truncate">
            {companyName.replace(/[^a-zA-Z0-9]/g, "_")}_Research_Report.pdf
          </p>
          <p className="text-[10px] text-slate-500">Equity Valuation PDF</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col w-full max-w-xs space-y-3 pt-2">
        <Button
          onClick={handleDownload}
          className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-semibold py-6 shadow-lg shadow-indigo-500/15 hover:shadow-indigo-500/25 transition-all duration-300 rounded-xl cursor-pointer"
        >
          <Download className="h-4.5 w-4.5 mr-2 shrink-0" />
          Download PDF Report
        </Button>

        <Button
          variant="outline"
          onClick={onRestart}
          className="w-full border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-white py-6 transition-all duration-300 rounded-xl cursor-pointer"
        >
          <RotateCcw className="h-4 w-4 mr-2 shrink-0" />
          Analyze Another Company
        </Button>
      </div>
    </div>
  );
}

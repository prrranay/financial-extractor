"use client";

import React, { useRef, useState } from "react";
import { UploadCloud, FileText, AlertCircle, X } from "lucide-react";

interface DropZoneProps {
  selectedFile: File | undefined;
  onFileSelect: (file: File) => void;
  onClearFile: (e: React.MouseEvent) => void;
  error?: { message?: string };
}

export function DropZone({
  selectedFile,
  onFileSelect,
  onClearFile,
  error,
}: DropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const triggerInputClick = () => {
    fileInputRef.current?.click();
  };

  // Helper to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-300">Financial Document</label>
      
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={selectedFile ? undefined : triggerInputClick}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
          selectedFile
            ? "border-emerald-500/50 bg-emerald-950/10 cursor-default"
            : isDragActive
            ? "border-indigo-400 bg-indigo-950/20 scale-[1.01]"
            : "border-slate-800 bg-slate-900/40 hover:bg-slate-900/60 hover:border-slate-700 cursor-pointer"
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf,.txt,.csv"
          className="hidden"
        />

        {selectedFile ? (
          <div className="flex flex-col items-center justify-center space-y-3 animate-in fade-in zoom-in duration-300">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <FileText className="h-6 w-6" />
            </div>
            
            <div className="space-y-1">
              <p className="text-sm font-semibold text-emerald-400 max-w-xs truncate mx-auto">
                {selectedFile.name}
              </p>
              <p className="text-xs text-slate-500">
                {formatFileSize(selectedFile.size)} • PDF/TXT/CSV Document
              </p>
            </div>

            <button
              type="button"
              onClick={onClearFile}
              className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-800 hover:text-white rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
              <span>Remove File</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-indigo-500/5 flex items-center justify-center text-indigo-400 border border-indigo-500/10">
              <UploadCloud className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-200">
                Drag and drop your file here, or{" "}
                <span className="text-indigo-400 hover:text-indigo-300 font-semibold underline decoration-2 underline-offset-2">
                  browse
                </span>
              </p>
              <p className="text-xs text-slate-500">
                Supports PDF, TXT, or CSV (max 10MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {error?.message && (
        <p className="text-xs text-red-400 flex items-center space-x-1 mt-1">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{error.message}</span>
        </p>
      )}
    </div>
  );
}

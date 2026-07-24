"use client";

import React, { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Trash2, 
  Download, 
  RefreshCw 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

// Valid file extensions
const ALLOWED_EXTENSIONS = ["pdf", "txt", "csv"];

// Schema validation
const formSchema = z.object({
  companyName: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters." })
    .max(100, { message: "Company name is too long." }),
  file: z
    .custom<File>((val) => val instanceof File, { message: "Please select a file." })
    .refine((file) => {
      if (!file) return false;
      const extension = file.name.split(".").pop()?.toLowerCase();
      return ALLOWED_EXTENSIONS.includes(extension || "");
    }, { message: "Only PDF, TXT, and CSV files are allowed." }),
});

type FormValues = z.infer<typeof formSchema>;

export default function UploadPage() {
  const [status, setStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [progressMessage, setProgressMessage] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("");
  const [apiError, setApiError] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      companyName: "",
      file: undefined,
    },
  });

  const selectedFile = watch("file");

  // Handle Drag Over
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  // Handle Drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setValue("file", e.dataTransfer.files[0], { shouldValidate: true });
    }
  };

  // Handle File Input Change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setValue("file", e.target.files[0], { shouldValidate: true });
    }
  };

  // Trigger File Input Click
  const onUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Clear Selected File
  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue("file", undefined as unknown as File, { shouldValidate: true });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Form Submission
  const onSubmit = async (data: FormValues) => {
    setStatus("generating");
    setApiError("");

    // Simulate progress message updates to match processing steps
    const progressSteps = [
      { message: "Uploading document...", delay: 0 },
      { message: "Parsing document structure & content...", delay: 800 },
      { message: "Running LLM to extract financial metrics...", delay: 1800 },
      { message: "Formatting data and creating visual PDF...", delay: 2800 },
    ];

    progressSteps.forEach((step) => {
      setTimeout(() => {
        setProgressMessage(step.message);
      }, step.delay);
    });

    try {
      const formData = new FormData();
      formData.append("companyName", data.companyName);
      formData.append("file", data.file);

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to generate report.");
      }

      // Allow final step message to be visible briefly before success transition
      setTimeout(() => {
        setDownloadUrl(result.downloadUrl);
        setStatus("success");
      }, 3500);

    } catch (error) {
      console.error(error);
      const errMsg = error instanceof Error ? error.message : "An unexpected error occurred during generation.";
      setApiError(errMsg);
      setStatus("error");
    }
  };

  // Restart Form Flow
  const handleRestart = () => {
    reset();
    setStatus("idle");
    setDownloadUrl("");
    setApiError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-zinc-950 font-sans text-zinc-100 flex flex-col justify-between">
      {/* Background Decorative Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-zinc-950 to-zinc-950 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="z-10 w-full max-w-7xl mx-auto px-6 py-6 border-b border-zinc-900 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            F
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Financial Extractor
          </span>
        </div>
        <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">
          AI-Powered Analyzer
        </div>
      </header>

      {/* Main Container */}
      <main className="z-10 flex-grow flex items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {status === "idle" && (
            <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl shadow-2xl shadow-indigo-950/10 transition-all duration-300">
              <CardHeader className="space-y-1.5">
                <CardTitle className="text-2xl font-semibold tracking-tight text-zinc-100">
                  Analyze Financials
                </CardTitle>
                <CardDescription className="text-zinc-400">
                  Upload a PDF, TXT, or CSV file of financial data to extract metrics and compile a structured report.
                </CardDescription>
              </CardHeader>
              
              <form onSubmit={handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                  {/* Company Name Input */}
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-zinc-300 text-sm font-medium">
                      Company Name
                    </Label>
                    <Input
                      id="companyName"
                      placeholder="e.g. Acme Corporation"
                      className="bg-zinc-950/60 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-lg transition-colors"
                      {...register("companyName")}
                    />
                    {errors.companyName && (
                      <p className="text-xs text-rose-500 flex items-center mt-1">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" />
                        {errors.companyName.message}
                      </p>
                    )}
                  </div>

                  {/* File Upload Zone */}
                  <div className="space-y-2">
                    <Label className="text-zinc-300 text-sm font-medium">Document Upload</Label>
                    <div
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                      onClick={onUploadClick}
                      className={`relative cursor-pointer group flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                        isDragActive
                          ? "border-indigo-500 bg-indigo-500/5 shadow-indigo-500/5"
                          : selectedFile
                          ? "border-zinc-700 bg-zinc-900/20"
                          : "border-zinc-800 bg-zinc-950/40 hover:border-zinc-700 hover:bg-zinc-900/10"
                      }`}
                    >
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.txt,.csv"
                      />

                      {!selectedFile ? (
                        <>
                          <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 group-hover:border-zinc-700 group-hover:scale-105 transition-all duration-300 mb-4">
                            <UploadCloud className="w-6 h-6 text-zinc-400 group-hover:text-indigo-400 transition-colors" />
                          </div>
                          <p className="text-zinc-300 text-sm font-medium mb-1">
                            Click to upload or drag & drop
                          </p>
                          <p className="text-zinc-500 text-xs">
                            PDF, TXT, or CSV files up to 20MB
                          </p>
                        </>
                      ) : (
                        <div className="w-full flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                          <div className="flex items-center space-x-3 text-left">
                            <div className="p-2 rounded bg-indigo-950/40 border border-indigo-900 text-indigo-400">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="max-w-[280px] sm:max-w-[340px]">
                              <p className="text-zinc-200 text-sm font-medium truncate">
                                {selectedFile.name}
                              </p>
                              <p className="text-zinc-500 text-xs">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleClearFile}
                            className="text-zinc-500 hover:text-rose-500 hover:bg-rose-950/20 transition-all rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    {errors.file && (
                      <p className="text-xs text-rose-500 flex items-center mt-1">
                        <AlertCircle className="w-3.5 h-3.5 mr-1" />
                        {errors.file.message}
                      </p>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-zinc-100 font-medium py-5 rounded-lg shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                  >
                    Generate Report
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}

          {/* Loading / Generating State */}
          {status === "generating" && (
            <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl shadow-2xl p-8 flex flex-col items-center justify-center text-center py-16">
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full blur-xl bg-indigo-500/25 animate-pulse" />
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin relative" />
              </div>
              <h3 className="text-zinc-200 text-lg font-semibold mb-2">Analyzing Data</h3>
              <p className="text-zinc-400 text-sm max-w-sm h-6 transition-all duration-300 font-medium">
                {progressMessage}
              </p>
            </Card>
          )}

          {/* Success / Complete State */}
          {status === "success" && (
            <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl shadow-2xl p-8 flex flex-col items-center justify-center text-center py-12 transition-all">
              <div className="p-3.5 rounded-full bg-emerald-950/40 border border-emerald-900 text-emerald-400 mb-5 shadow-lg shadow-emerald-500/10">
                <CheckCircle className="w-8 h-8 animate-bounce" />
              </div>
              <h3 className="text-zinc-100 text-2xl font-bold tracking-tight mb-2">Report Ready!</h3>
              <p className="text-zinc-400 text-sm max-w-md mb-8">
                The financial analysis for <strong className="text-zinc-200">{watch("companyName")}</strong> was successfully completed. Click below to download your generated PDF report.
              </p>

              <div className="w-full flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => window.open(downloadUrl, "_blank")}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium py-5 rounded-lg shadow-lg shadow-emerald-600/10 hover:shadow-emerald-600/20 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={handleRestart}
                  variant="outline"
                  className="border-zinc-800 hover:border-zinc-700 bg-zinc-950/30 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 font-medium py-5 rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Analyze Another
                </Button>
              </div>
            </Card>
          )}

          {/* Error State */}
          {status === "error" && (
            <Card className="border-zinc-800 bg-zinc-900/40 backdrop-blur-xl shadow-2xl p-8 flex flex-col items-center justify-center text-center py-12">
              <div className="p-3 rounded-full bg-rose-950/40 border border-rose-900 text-rose-400 mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-zinc-200 text-lg font-semibold mb-2">Generation Failed</h3>
              <p className="text-zinc-400 text-sm max-w-md mb-8">
                {apiError || "We ran into an issue parsing your file or generating the report. Please try again."}
              </p>
              <Button
                onClick={handleRestart}
                className="bg-indigo-600 hover:bg-indigo-500 text-zinc-100 font-medium px-6 py-2 rounded-lg transition-colors"
              >
                Try Again
              </Button>
            </Card>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="z-10 w-full max-w-7xl mx-auto px-6 py-4 border-t border-zinc-900/50 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-600 gap-2">
        <p>© 2026 Financial Extractor App. All rights reserved.</p>
        <p>Built with Next.js 15, TailwindCSS, & shadcn/ui</p>
      </footer>
    </div>
  );
}

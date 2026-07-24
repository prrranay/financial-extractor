"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { AlertCircle, BarChart3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { DropZone } from "@/components/DropZone";
import { LoadingProgress } from "@/components/LoadingProgress";
import { ReportSuccess } from "@/components/ReportSuccess";

const ALLOWED_EXTENSIONS = ["pdf", "txt", "csv"];

const formSchema = z.object({
  companyName: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters." })
    .max(100, { message: "Company name is too long." }),
  file: z
    .custom<File>((val) => val instanceof File, { message: "Please select a file." })
    .refine(
      (file) => {
        if (!file) return false;
        const extension = file.name.split(".").pop()?.toLowerCase();
        return ALLOWED_EXTENSIONS.includes(extension || "");
      },
      { message: "Only PDF, TXT, and CSV files are allowed." }
    ),
});

type FormValues = z.infer<typeof formSchema>;

const progressSteps = [
  "Reading uploaded document...",
  "Extracting financial numbers using Gemini...",
  "Generating investment thesis & key growth drivers...",
  "Formatting charts & building 4-page PDF layout...",
];

export default function UploadPage() {
  const [status, setStatus] = useState<"idle" | "generating" | "success" | "error">("idle");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [apiError, setApiError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      companyName: "",
      file: undefined,
    },
  });

  const selectedFile = watch("file");

  const handleFileSelect = (file: File) => {
    setValue("file", file, { shouldValidate: true });
  };

  const handleClearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    setValue("file", undefined as unknown as File, { shouldValidate: true });
  };

  const onSubmit = async (data: FormValues) => {
    setStatus("generating");
    setCurrentStepIndex(0);
    setApiError("");
    setCompanyName(data.companyName);

    toast.add({
      title: "Analysis Started",
      description: `Processing report for ${data.companyName}...`,
      type: "info",
    });

    // Simulate loader steps transition
    const stepIntervals = [1200, 3200, 6000];
    stepIntervals.forEach((delay, idx) => {
      setTimeout(() => {
        setCurrentStepIndex(idx + 1);
      }, delay);
    });

    try {
      const formData = new FormData();
      formData.append("companyName", data.companyName);
      formData.append("file", data.file);

      const response = await fetch("/api/generate", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMsg = "Failed to generate report.";
        try {
          const errRes = await response.json();
          errorMsg = errRes.error || errorMsg;
        } catch {}
        throw new Error(errorMsg);
      }

      const pdfBlob = await response.blob();
      const localUrl = window.URL.createObjectURL(pdfBlob);

      // Gracefully switch to success page
      setTimeout(() => {
        setDownloadUrl(localUrl);
        setStatus("success");
        toast.add({
          title: "Analysis Complete",
          description: `The report for ${data.companyName} is ready!`,
          type: "success",
        });
      }, 7500);

    } catch (error) {
      console.error(error);
      const errMsg = error instanceof Error ? error.message : "An unexpected error occurred.";
      setApiError(errMsg);
      setStatus("error");
      toast.add({
        title: "Generation Failed",
        description: errMsg,
        type: "error",
      });
    }
  };

  const handleRestart = () => {
    reset();
    setStatus("idle");
    setDownloadUrl("");
    setApiError("");
    setCompanyName("");
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Background Decorative Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl opacity-25 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-25 pointer-events-none" />

      {/* Header */}
      <header className="z-10 w-full max-w-7xl mx-auto px-6 py-6 border-b border-slate-900/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-500/10">
            <BarChart3 className="h-4.5 w-4.5" />
          </div>
          <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Financial Extractor
          </span>
        </div>
        <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
          AI-Powered Analyzer
        </div>
      </header>

      {/* Main Content Area */}
      <main className="z-10 flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-lg bg-slate-950/40 border-slate-900/80 backdrop-blur-xl shadow-2xl relative overflow-hidden rounded-2xl">
          {/* Glassmorphic border glow */}
          <div className="absolute inset-0 border border-slate-800/20 rounded-2xl pointer-events-none" />

          {status === "generating" ? (
            <CardContent className="pt-6">
              <LoadingProgress currentStepIndex={currentStepIndex} steps={progressSteps} />
            </CardContent>
          ) : status === "success" ? (
            <CardContent className="pt-6">
              <ReportSuccess downloadUrl={downloadUrl} companyName={companyName} onRestart={handleRestart} />
            </CardContent>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)}>
              <CardHeader className="space-y-1.5 pb-5">
                <CardTitle className="text-2xl font-bold tracking-tight text-white text-center">
                  Analyze Company Financials
                </CardTitle>
                <CardDescription className="text-slate-400 text-center text-sm">
                  Upload a PDF, TXT, or CSV statement to compile a professional equity report.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Error Banner */}
                {status === "error" && (
                  <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl text-xs text-red-400 flex items-start space-x-2.5 animate-in slide-in-from-top duration-300">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">Analysis Failed</p>
                      <p className="text-slate-400 leading-normal">{apiError}</p>
                    </div>
                  </div>
                )}

                {/* Company Name Input */}
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="text-sm font-medium text-slate-300">
                    Company Name
                  </Label>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Enter company name (e.g. Zomato Ltd)"
                    {...register("companyName")}
                    className="bg-slate-950/60 border-slate-800/80 focus:border-indigo-500/80 hover:border-slate-700/80 text-white rounded-xl py-5 transition-colors placeholder:text-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  {errors.companyName?.message && (
                    <p className="text-xs text-red-400 flex items-center space-x-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{errors.companyName.message}</span>
                    </p>
                  )}
                </div>

                {/* File Upload Zone */}
                <DropZone
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  onClearFile={handleClearFile}
                  error={errors.file}
                />
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  type="submit"
                  disabled={!isValid}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-6 shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 transition-all duration-300 rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Generate Equity Report
                </Button>
              </CardFooter>
            </form>
          )}
        </Card>
      </main>

      {/* Footer */}
      <footer className="z-10 w-full max-w-7xl mx-auto px-6 py-6 border-t border-slate-900/60 text-center text-xs text-slate-600">
        © {new Date().getFullYear()} Financial Extractor. Powered by Gemini Flash. All rights reserved.
      </footer>
    </div>
  );
}

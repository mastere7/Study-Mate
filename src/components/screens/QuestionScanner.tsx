import React, { useState } from "react";
import {
  ScanLine,
  Camera,
  Upload,
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  BrainCircuit,
  Lightbulb,
} from "lucide-react";
import { apiService } from "../../services/api";

export const QuestionScanner: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setOcrResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScanAndSolve = async () => {
    if (!selectedImage || isScanning) return;
    setIsScanning(true);

    try {
      // Extract base64 part
      const base64Data = selectedImage.split(",")[1];
      const mimeType = selectedImage.split(";")[0].split(":")[1] || "image/jpeg";

      const resText = await apiService.scanAndSolveQuestion(base64Data, mimeType);
      setOcrResult(resText);
    } catch (e) {
      console.error(e);
      setOcrResult("Scanning failed. Please make sure the image is clear and try again.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleCopyResult = () => {
    if (ocrResult) {
      navigator.clipboard.writeText(ocrResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          <span>Question Scanner & Step-by-Step Solver</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Upload or snapshot any printed textbook question or handwritten math problem for instant AI OCR & step-by-step solutions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Box: Image Upload / Camera Dropzone */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-500" />
            <span>Problem Image</span>
          </h3>

          <div className="min-h-[260px] rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/40 relative overflow-hidden">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt="Uploaded Question"
                className="w-full h-full object-contain rounded-xl max-h-72"
              />
            ) : (
              <div className="text-center space-y-2">
                <ScanLine className="w-12 h-12 text-indigo-400 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select or take a picture of your question
                </p>
                <p className="text-[11px] text-slate-400">
                  Supports JPEG, PNG, WEBP math & science notes
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs cursor-pointer border border-indigo-200 dark:border-indigo-800 transition-all">
              <Camera className="w-4 h-4" />
              <span>Take Photo</span>
              <input type="file" accept="image/*" capture="environment" onChange={handleImageChange} className="hidden" />
            </label>

            <label className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer border border-slate-200 dark:border-slate-700 transition-all">
              <Upload className="w-4 h-4" />
              <span>{selectedImage ? "Choose File" : "Upload File"}</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          </div>

          <button
            onClick={handleScanAndSolve}
            disabled={!selectedImage || isScanning}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-purple-500/20 transition-all cursor-pointer"
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing & Solving OCR...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Scan & Solve Problem</span>
              </>
            )}
          </button>
        </div>

        {/* Right Box: AI Solution Breakdown */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>AI OCR Solution & Step-by-Step</span>
              </h3>
              {ocrResult && (
                <button
                  onClick={handleCopyResult}
                  className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy Solution"}</span>
                </button>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap min-h-[260px] max-h-96 overflow-y-auto border border-slate-100 dark:border-slate-800">
              {ocrResult ? (
                ocrResult
              ) : (
                <div className="text-center py-16 text-slate-400 space-y-2">
                  <Lightbulb className="w-8 h-8 text-amber-400 mx-auto" />
                  <p>Upload a question photo and tap "Scan & Solve" to view the step-by-step reasoning.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

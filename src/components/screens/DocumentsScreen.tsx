import React, { useState } from "react";
import {
  FolderKanban,
  FileText,
  UploadCloud,
  Sparkles,
  HelpCircle,
  FileUp,
  FileCode,
  CheckCircle,
  Send,
  Download,
  Trash2,
  BookOpen,
} from "lucide-react";
import { DocumentItem } from "../../types";
import { apiService } from "../../services/api";

interface DocumentsScreenProps {
  documents: DocumentItem[];
  onSaveDocuments: (docs: DocumentItem[]) => void;
  onGenerateQuizFromText: (title: string, text: string) => void;
}

export const DocumentsScreen: React.FC<DocumentsScreenProps> = ({
  documents,
  onSaveDocuments,
  onGenerateQuizFromText,
}) => {
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(
    documents.length > 0 ? documents[0] : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [docQaInput, setDocQaInput] = useState("");
  const [docQaHistory, setDocQaHistory] = useState<{ q: string; a: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // File Upload Handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Analyze with Gemini backend
      const analysisResult = await apiService.analyzeDocument(file, undefined, file.name, "summary");

      const newDoc: DocumentItem = {
        id: `doc_${Date.now()}`,
        userId: "u_student_1",
        title: file.name.replace(/\.[^/.]+$/, ""),
        fileName: file.name,
        fileType: file.name.split(".").pop() || "pdf",
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        uploadDate: new Date().toISOString().split("T")[0],
        summary: analysisResult.summary,
        keyPoints: [
          "Core themes identified automatically by Gemini AI",
          "Includes key formulas & structural definitions",
        ],
        extractedText: analysisResult.summary,
      };

      const updated = [newDoc, ...documents];
      onSaveDocuments(updated);
      setSelectedDoc(newDoc);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDocQaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docQaInput.trim() || !selectedDoc || isAnalyzing) return;

    const question = docQaInput;
    setDocQaInput("");
    setIsAnalyzing(true);

    try {
      const res = await apiService.analyzeDocument(
        undefined,
        selectedDoc.extractedText || selectedDoc.summary,
        selectedDoc.fileName,
        "qa",
        question
      );

      setDocQaHistory((prev) => [...prev, { q: question, a: res.summary }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteDoc = (id: string) => {
    const updated = documents.filter((d) => d.id !== id);
    onSaveDocuments(updated);
    if (selectedDoc?.id === id) {
      setSelectedDoc(updated.length > 0 ? updated[0] : null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 p-6 rounded-3xl text-white border border-indigo-500/30 shadow-lg">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
              Central File Uploader & AI Summarizer
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-indigo-400" />
            <span>PDF, Word & Image File Upload Hub</span>
          </h2>
          <p className="text-xs text-indigo-200/90 mt-1 max-w-xl">
            Upload PDF textbooks, Microsoft Word (.docx/.doc) files, problem images, or study notes to generate instant executive AI summaries and study guides.
          </p>
        </div>

        {/* Upload Trigger Button */}
        <label className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-lg shadow-indigo-600/30 transition-all shrink-0">
          <UploadCloud className="w-4 h-4" />
          <span>{isUploading ? "Uploading & Summarizing..." : "Upload File Now"}</span>
          <input
            type="file"
            accept=".pdf,.docx,.doc,.pptx,.txt,image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: File Dropzone & Document Library */}
        <div className="space-y-4">
          {/* File Upload Dropzone Box */}
          <div className="rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-6 text-center bg-white dark:bg-slate-900 hover:border-indigo-500 transition-all">
            <UploadCloud className="w-10 h-10 text-indigo-500 mx-auto mb-2 animate-bounce" />
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Upload PDF or Word Document
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              Supports <strong>PDF (.pdf)</strong>, <strong>Word (.docx, .doc)</strong>, PPTX, TXT, and images up to 25MB
            </p>
            <label className="mt-3 inline-block px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold text-xs cursor-pointer">
              Browse Files
              <input
                type="file"
                accept=".pdf,.docx,.doc,.pptx,.txt,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Document List */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 px-1">
              Your Document Library ({documents.length})
            </h3>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {documents.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  No documents uploaded yet. Upload a PDF or Word document to get instant AI summaries!
                </p>
              ) : (
                documents.map((doc) => {
                  const isSelected = selectedDoc?.id === doc.id;
                  const fileExt = (doc.fileName.split(".").pop() || "doc").toLowerCase();
                  const isWord = fileExt === "docx" || fileExt === "doc";
                  const isPdf = fileExt === "pdf";

                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-700"
                          : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate pr-2">
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isPdf
                              ? "bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400"
                              : isWord
                              ? "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400"
                              : "bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                          }`}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {doc.title}
                            </h4>
                            <span
                              className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                                isPdf
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                                  : isWord
                                  ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                                  : "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              }`}
                            >
                              {fileExt}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            {doc.fileSize} • {doc.uploadDate}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDoc(doc.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Document Analysis & AI Document Tutor Q&A */}
        <div className="lg:col-span-2 space-y-6">
          {selectedDoc ? (
            <div className="space-y-6">
              {/* Document Overview & AI Actions */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Active Document
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {selectedDoc.fileName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onGenerateQuizFromText(
                          selectedDoc.title,
                          selectedDoc.extractedText || selectedDoc.summary || ""
                        )
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-200 dark:border-amber-800"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Generate Quiz</span>
                    </button>
                  </div>
                </div>

                {/* AI Executive Summary */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                      AI Executive Summary & Key Concepts
                    </h4>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap border border-slate-100 dark:border-slate-800 max-h-72 overflow-y-auto">
                    {selectedDoc.summary || "Summary will appear here after upload analysis."}
                  </div>
                </div>
              </div>

              {/* Document Q&A Tutor Chat */}
              <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    Ask Questions About This Document
                  </h3>
                </div>

                {/* Q&A Thread */}
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {docQaHistory.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">
                      Ask any question about formulas, definitions, or specific sections in "{selectedDoc.fileName}".
                    </p>
                  ) : (
                    docQaHistory.map((item, idx) => (
                      <div key={idx} className="space-y-2 text-xs">
                        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-950 dark:text-indigo-200 font-medium">
                          <span className="font-bold">Q:</span> {item.q}
                        </div>
                        <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">AI Tutor:</span> {item.a}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Ask Form */}
                <form onSubmit={handleDocQaSubmit} className="flex gap-2">
                  <input
                    type="text"
                    value={docQaInput}
                    onChange={(e) => setDocQaInput(e.target.value)}
                    placeholder="e.g., What are the main equations on page 3?"
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!docQaInput.trim() || isAnalyzing}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isAnalyzing ? "Analyzing..." : "Ask"}</span>
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
              <FolderKanban className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-700 dark:text-slate-300">No document selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload a document or select one from your library to view AI summaries and ask questions.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from "react";
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit,
  Sparkles,
  HelpCircle,
  Layers,
  Image as ImageIcon,
  Tag,
  Check,
  X,
  BookOpen,
  UploadCloud,
  Download,
  FileDown,
} from "lucide-react";
import { Note, Subject } from "../../types";
import { apiService } from "../../services/api";
import { exportService } from "../../services/exportService";
import { storageService } from "../../services/storage";

interface NotesScreenProps {
  notes: Note[];
  subjects: Subject[];
  onSaveNotes: (updatedNotes: Note[]) => void;
  onGenerateQuizFromText: (title: string, text: string) => void;
  onGenerateFlashcardsFromText: (title: string, text: string) => void;
}

export const NotesScreen: React.FC<NotesScreenProps> = ({
  notes,
  subjects,
  onSaveNotes,
  onGenerateQuizFromText,
  onGenerateFlashcardsFromText,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("all");
  const [editingNote, setEditingNote] = useState<Partial<Note> | null>(null);
  const [isAiEnhancing, setIsAiEnhancing] = useState(false);

  // Note Summarization state
  const [summarizingNote, setSummarizingNote] = useState<Note | null>(null);
  const [activeSummaryText, setActiveSummaryText] = useState<string>("");
  const [isSummarizingLoading, setIsSummarizingLoading] = useState<boolean>(false);
  const [isDocUploading, setIsDocUploading] = useState<boolean>(false);

  // Export & Menu state
  const [showGlobalExportMenu, setShowGlobalExportMenu] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowGlobalExportMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExportAllMarkdown = () => {
    exportService.exportAllNotesToMarkdown(sortedNotes, subjects, "Study Notes Compilation");
    setShowGlobalExportMenu(false);
  };

  const handleExportAllPDF = () => {
    exportService.exportAllNotesToPDF(sortedNotes, subjects, "Study Notes Compilation");
    setShowGlobalExportMenu(false);
  };

  const handleExportSingleMD = (note: Note) => {
    const subName = subjects.find((s) => s.id === note.subjectId)?.name;
    exportService.exportNoteToMarkdown(note, subName);
  };

  const handleExportSinglePDF = (note: Note) => {
    const subName = subjects.find((s) => s.id === note.subjectId)?.name;
    exportService.exportNoteToPDF(note, subName);
  };

  // Upload PDF or Word document directly into a Summarized Note
  const handleUploadDocToNote = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsDocUploading(true);
    try {
      const res = await apiService.analyzeDocument(file, undefined, file.name, "summary");
      const cleanTitle = file.name.replace(/\.[^/.]+$/, "");

      const newNote: Note = {
        id: `note_doc_${Date.now()}`,
        userId: "u_student_1",
        subjectId: subjects[0]?.id || "",
        title: `Summary: ${cleanTitle}`,
        content: `Document Name: ${file.name}\n\nExecutive Summary:\n${res.summary}`,
        summary: res.summary,
        isPinned: true,
        tags: ["PDF/Word Document", "AI Summary"],
        createdDate: new Date().toISOString().split("T")[0],
        updatedDate: new Date().toISOString().split("T")[0],
      };

      onSaveNotes([newNote, ...notes]);
      storageService.addActivity({
        type: "note_created",
        title: `Uploaded Note: ${newNote.title}`,
        description: `Imported document "${file.name}" with AI summary`,
      });
      alert(`Successfully analyzed and created a summarized note for "${file.name}"!`);
    } catch (err: any) {
      console.error(err);
      alert("Failed to analyze uploaded document.");
    } finally {
      setIsDocUploading(false);
    }
  };

  // Filter notes based on subject and search query
  const filteredNotes = notes.filter((note) => {
    const matchesSubject = selectedSubjectId === "all" || note.subjectId === selectedSubjectId;
    const matchesSearch =
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSubject && matchesSearch;
  });

  // Sort pinned notes to top
  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (a.isPinned === b.isPinned) {
      return new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime();
    }
    return a.isPinned ? -1 : 1;
  });

  const handleCreateNew = () => {
    setEditingNote({
      id: `n_${Date.now()}`,
      userId: "u_student_1",
      subjectId: subjects.length > 0 ? subjects[0].id : "",
      title: "",
      content: "",
      isPinned: false,
      tags: ["Exam Prep"],
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    });
  };

  const handleSaveModal = () => {
    if (!editingNote || !editingNote.title?.trim()) return;

    const existingIdx = notes.findIndex((n) => n.id === editingNote.id);
    let updated: Note[];

    const finalNote: Note = {
      id: editingNote.id || `n_${Date.now()}`,
      userId: editingNote.userId || "u_student_1",
      subjectId: editingNote.subjectId || (subjects[0] ? subjects[0].id : ""),
      title: editingNote.title.trim(),
      content: editingNote.content || "",
      isPinned: !!editingNote.isPinned,
      tags: editingNote.tags || [],
      imageAttachment: editingNote.imageAttachment,
      createdDate: editingNote.createdDate || new Date().toISOString(),
      updatedDate: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      updated = [...notes];
      updated[existingIdx] = finalNote;
      storageService.addActivity({
        type: "note_updated",
        title: `Updated Note: ${finalNote.title}`,
        description: "Modified study note content",
      });
    } else {
      updated = [finalNote, ...notes];
      storageService.addActivity({
        type: "note_created",
        title: `Created Note: ${finalNote.title}`,
        description: "Added new study note",
      });
    }

    onSaveNotes(updated);
    setEditingNote(null);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    onSaveNotes(updated);
  };

  const handleTogglePin = (id: string) => {
    const updated = notes.map((n) => (n.id === id ? { ...n, isPinned: !n.isPinned } : n));
    onSaveNotes(updated);
  };

  const handleAiEnhance = async () => {
    if (!editingNote || !editingNote.content) return;
    setIsAiEnhancing(true);
    try {
      const enhancedText = await apiService.askAITutor({
        prompt: `Format, clean up, and enhance the following study note with clear headers, bullet points, key takeaways, and definitions:\n\n${editingNote.content}`,
        mode: "summary",
      });
      setEditingNote({ ...editingNote, content: enhancedText });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiEnhancing(false);
    }
  };

  const handleOpenSummarizer = async (note: Note) => {
    setSummarizingNote(note);
    if (note.summary) {
      setActiveSummaryText(note.summary);
      setIsSummarizingLoading(false);
    } else {
      setIsSummarizingLoading(true);
      setActiveSummaryText("");
      try {
        const summaryRes = await apiService.askAITutor({
          prompt: `Summarize the following study note titled "${note.title}". Provide an executive summary, 3-5 bulleted key takeaways, and essential exam review points:\n\n${note.content}`,
          mode: "summary",
        });
        setActiveSummaryText(summaryRes);
      } catch (err) {
        setActiveSummaryText("Failed to generate summary. Please check your network connection.");
      } finally {
        setIsSummarizingLoading(false);
      }
    }
  };

  const handleSaveSummaryToNote = () => {
    if (!summarizingNote || !activeSummaryText) return;
    const updated = notes.map((n) =>
      n.id === summarizingNote.id ? { ...n, summary: activeSummaryText } : n
    );
    onSaveNotes(updated);
    setSummarizingNote(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingNote((prev) => (prev ? { ...prev, imageAttachment: reader.result as string } : null));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Smart Notes System</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Organize notes by subject, attach diagrams, and generate instant AI study tools
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export All Notes Button */}
          <div className="relative" ref={exportRef}>
            <button
              onClick={() => setShowGlobalExportMenu(!showGlobalExportMenu)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 font-bold text-xs sm:text-sm transition-all shadow-xs"
              title="Export Notes for Offline Study"
            >
              <Download className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Export Notes</span>
            </button>

            {showGlobalExportMenu && (
              <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 space-y-1">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-[11px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Export Options
                  </span>
                </div>
                <button
                  onClick={handleExportAllPDF}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-indigo-500" />
                  <div>
                    <p className="font-bold">All Notes as PDF (.pdf)</p>
                    <p className="text-[10px] text-slate-400 font-normal">Formatted printable PDF document</p>
                  </div>
                </button>
                <button
                  onClick={handleExportAllMarkdown}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-left cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="font-bold">All Notes as Markdown (.md)</p>
                    <p className="text-[10px] text-slate-400 font-normal">Formatted study digest file</p>
                  </div>
                </button>
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold text-xs sm:text-sm cursor-pointer transition-all">
            <UploadCloud className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>{isDocUploading ? "Analyzing File..." : "Summarize PDF / Word"}</span>
            <input
              type="file"
              accept=".pdf,.docx,.doc,.pptx,.txt"
              onChange={handleUploadDocToNote}
              disabled={isDocUploading}
              className="hidden"
            />
          </label>

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Smart Note</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, content, or tags..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
        </div>

        {/* Subject Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pr-1">
          <button
            onClick={() => setSelectedSubjectId("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedSubjectId === "all"
                ? "bg-indigo-600 text-white"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}
          >
            All Notes ({notes.length})
          </button>
          {subjects.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubjectId(sub.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedSubjectId === sub.id
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {sortedNotes.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="font-bold text-slate-700 dark:text-slate-300">No notes found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first smart note or adjust your search filter to organize your study topics.
            </p>
            <button
              onClick={handleCreateNew}
              className="mt-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              + Create Note
            </button>
          </div>
        ) : (
          sortedNotes.map((note) => {
            const subject = subjects.find((s) => s.id === note.subjectId);
            return (
              <div
                key={note.id}
                className={`group relative flex flex-col justify-between p-5 rounded-3xl bg-white dark:bg-slate-900 border transition-all hover:shadow-lg ${
                  note.isPinned
                    ? "border-amber-300 dark:border-amber-800/80 shadow-amber-500/5"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="space-y-3">
                  {/* Top Bar: Subject Badge & Pin */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        subject?.color || "bg-indigo-500 text-white"
                      }`}
                    >
                      {subject?.name || "General"}
                    </span>
                    <button
                      onClick={() => handleTogglePin(note.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        note.isPinned
                          ? "text-amber-500 bg-amber-50 dark:bg-amber-950/60"
                          : "text-slate-400 hover:text-slate-600"
                      }`}
                      title={note.isPinned ? "Unpin note" : "Pin note"}
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Title & Content */}
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 line-clamp-1">
                      {note.title}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 line-clamp-4 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>

                  {/* Summary preview badge if saved */}
                  {note.summary && (
                    <div className="p-2.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 space-y-1 text-xs">
                      <span className="font-bold text-[10px] text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> AI Summary Preview
                      </span>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2 italic">
                        {note.summary}
                      </p>
                    </div>
                  )}

                  {/* Image attachment preview */}
                  {note.imageAttachment && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-36">
                      <img
                        src={note.imageAttachment}
                        alt="Attachment"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Tags */}
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {note.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer: AI Tools, Export & Edit/Delete */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenSummarizer(note)}
                      className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-[10px] font-bold flex items-center gap-1"
                      title="AI Summarize Note"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Summarize</span>
                    </button>

                    <button
                      onClick={() => onGenerateQuizFromText(note.title, note.content)}
                      className="p-1.5 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 text-[10px] font-bold flex items-center gap-1"
                      title="Generate AI Quiz"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Quiz</span>
                    </button>

                    <button
                      onClick={() => onGenerateFlashcardsFromText(note.title, note.content)}
                      className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-[10px] font-bold flex items-center gap-1"
                      title="Generate Flashcards"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Cards</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Export PDF Button */}
                    <button
                      onClick={() => handleExportSinglePDF(note)}
                      className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                      title="Export as PDF / Print"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                    </button>

                    {/* Export Markdown Button */}
                    <button
                      onClick={() => handleExportSingleMD(note)}
                      className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                      title="Export as Markdown (.md)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setEditingNote(note)}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                      title="Edit note"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit / Create Note Modal */}
      {editingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-slate-900 dark:text-slate-100">
                {editingNote.id ? "Edit Smart Note" : "Create New Smart Note"}
              </h3>
              <button
                onClick={() => setEditingNote(null)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Subject Category
                  </label>
                  <select
                    value={editingNote.subjectId}
                    onChange={(e) => setEditingNote({ ...editingNote, subjectId: e.target.value })}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 outline-none"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editingNote.tags ? editingNote.tags.join(", ") : ""}
                    onChange={(e) =>
                      setEditingNote({
                        ...editingNote,
                        tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                      })
                    }
                    placeholder="Exam, TCP, Formulas"
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Note Title
                </label>
                <input
                  type="text"
                  value={editingNote.title || ""}
                  onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                  placeholder="e.g., Organic Chemistry Reaction Mechanisms"
                  className="mt-1 w-full px-4 py-2.5 text-sm font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Note Content (Markdown supported)
                  </label>
                  <button
                    type="button"
                    onClick={handleAiEnhance}
                    disabled={isAiEnhancing || !editingNote.content}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-bold transition-all disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAiEnhancing ? "Enhancing..." : "AI Formatting & Enhancement"}</span>
                  </button>
                </div>
                <textarea
                  rows={8}
                  value={editingNote.content || ""}
                  onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                  placeholder="Type or paste your study notes here..."
                  className="w-full p-4 text-xs sm:text-sm rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none leading-relaxed"
                />
              </div>

              {/* Attach Image */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Attach Image / Diagram
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {editingNote.imageAttachment && (
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Image attached!
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingNote(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={!editingNote.title?.trim()}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-indigo-500/20"
              >
                Save Smart Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Note Summarizer Modal */}
      {summarizingNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-indigo-500/30 p-6 sm:p-8 shadow-2xl space-y-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-slate-100">
                    AI Executive Summary
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Note: <span className="font-semibold">{summarizingNote.title}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSummarizingNote(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content area */}
            {isSummarizingLoading ? (
              <div className="py-12 text-center space-y-4">
                <Sparkles className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Synthesizing key insights & takeaways from your note...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
                  {activeSummaryText}
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Instant AI distillation for active recall
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(activeSummaryText);
                        alert("Summary copied to clipboard!");
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveSummaryToNote}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Attach Summary to Note</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

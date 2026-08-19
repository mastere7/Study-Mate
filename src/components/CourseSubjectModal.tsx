import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Edit3,
  BookOpen,
  Check,
  Sparkles,
  AlertTriangle,
  GraduationCap,
  Layers,
  ArrowRight,
  RotateCcw,
  Palette,
  Smile,
  Hash,
  User,
  Info,
  CheckCircle2,
  Calendar,
  ListTodo,
  Copy,
  Eye,
  Share2,
} from "lucide-react";
import { Subject, Assignment } from "../types";
import { storageService } from "../services/storage";

interface CourseSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  assignments?: Assignment[];
  onSaveSubjects: (subjects: Subject[]) => void;
  activeSubjectFilter?: string | null;
  onSelectSubjectFilter?: (subjectId: string | null) => void;
  currentUserId?: string;
}

export const COLOR_PALETTE = [
  { label: "Indigo", value: "bg-indigo-600 text-white", border: "border-indigo-500", bgLight: "bg-indigo-50 dark:bg-indigo-950/60" },
  { label: "Violet", value: "bg-violet-600 text-white", border: "border-violet-500", bgLight: "bg-violet-50 dark:bg-violet-950/60" },
  { label: "Purple", value: "bg-purple-600 text-white", border: "border-purple-500", bgLight: "bg-purple-50 dark:bg-purple-950/60" },
  { label: "Fuchsia", value: "bg-fuchsia-600 text-white", border: "border-fuchsia-500", bgLight: "bg-fuchsia-50 dark:bg-fuchsia-950/60" },
  { label: "Rose", value: "bg-rose-600 text-white", border: "border-rose-500", bgLight: "bg-rose-50 dark:bg-rose-950/60" },
  { label: "Amber", value: "bg-amber-600 text-white", border: "border-amber-500", bgLight: "bg-amber-50 dark:bg-amber-950/60" },
  { label: "Emerald", value: "bg-emerald-600 text-white", border: "border-emerald-500", bgLight: "bg-emerald-50 dark:bg-emerald-950/60" },
  { label: "Teal", value: "bg-teal-600 text-white", border: "border-teal-500", bgLight: "bg-teal-50 dark:bg-teal-950/60" },
  { label: "Cyan", value: "bg-cyan-600 text-white", border: "border-cyan-500", bgLight: "bg-cyan-50 dark:bg-cyan-950/60" },
  { label: "Blue", value: "bg-blue-600 text-white", border: "border-blue-500", bgLight: "bg-blue-50 dark:bg-blue-950/60" },
  { label: "Orange", value: "bg-orange-600 text-white", border: "border-orange-500", bgLight: "bg-orange-50 dark:bg-orange-950/60" },
  { label: "Slate", value: "bg-slate-700 text-white", border: "border-slate-500", bgLight: "bg-slate-100 dark:bg-slate-800" },
];

export const POPULAR_EMOJIS = [
  "📚", "🧬", "💻", "📐", "🧪", "🎨", "🏛️", "🌍", "💡", "📊",
  "⚡", "📖", "🎯", "🧠", "💼", "🎵", "✍️", "🔬", "🩺", "⚖️",
  "🚀", "🪐", "🔢", "🗣️", "🛠️", "🌿", "📈", "🛡️", "🔥", "✨"
];

export const STARTER_TRACKS = [
  {
    id: "cs_tech",
    title: "Computer Science & Tech",
    icon: "💻",
    description: "Data structures, algorithms, systems, and software engineering",
    courses: [
      { name: "Data Structures & Algorithms", code: "CS 201", color: "bg-indigo-600 text-white", icon: "💻", description: "Trees, graphs, asymptotic analysis, and sorting" },
      { name: "Computer Systems & Architecture", code: "CS 210", color: "bg-cyan-600 text-white", icon: "⚡", description: "Memory hierarchy, assembly, and operating systems" },
      { name: "Database Systems", code: "CS 330", color: "bg-violet-600 text-white", icon: "📊", description: "Relational modeling, indexing, and SQL queries" },
      { name: "Artificial Intelligence & ML", code: "CS 480", color: "bg-rose-600 text-white", icon: "🧠", description: "Neural networks, optimization, and generative models" },
    ],
  },
  {
    id: "pre_med",
    title: "Pre-Med & Health Sciences",
    icon: "🧬",
    description: "Biology, chemistry, human anatomy, and clinical preparation",
    courses: [
      { name: "Cell & Molecular Biology", code: "BIO 110", color: "bg-emerald-600 text-white", icon: "🧬", description: "Cell signaling, genetics, and metabolic cycles" },
      { name: "Organic Chemistry II", code: "CHEM 220", color: "bg-amber-600 text-white", icon: "🧪", description: "Reaction mechanisms, stereochemistry, and synthesis" },
      { name: "Human Anatomy & Physiology", code: "ANAT 201", color: "bg-rose-600 text-white", icon: "🩺", description: "Cardiovascular, musculoskeletal, and nervous systems" },
      { name: "Biochemistry", code: "BIOC 300", color: "bg-teal-600 text-white", icon: "🔬", description: "Enzyme kinetics, protein structures, and metabolism" },
    ],
  },
  {
    id: "math_eng",
    title: "Engineering & Mathematics",
    icon: "📐",
    description: "Calculus, physics, linear algebra, and differential equations",
    courses: [
      { name: "Calculus III: Multivariable", code: "MATH 240", color: "bg-blue-600 text-white", icon: "📐", description: "Vectors, partial derivatives, and multiple integrals" },
      { name: "Linear Algebra & Matrices", code: "MATH 250", color: "bg-indigo-600 text-white", icon: "🔢", description: "Vector spaces, eigenvalues, and transformations" },
      { name: "University Physics: Mechanics", code: "PHYS 150", color: "bg-orange-600 text-white", icon: "⚡", description: "Newtonian mechanics, energy, and thermodynamics" },
      { name: "Differential Equations", code: "MATH 310", color: "bg-purple-600 text-white", icon: "📈", description: "Ordinary and partial differential modeling" },
    ],
  },
  {
    id: "business_econ",
    title: "Business & Economics",
    icon: "💼",
    description: "Economics, corporate finance, marketing, and management",
    courses: [
      { name: "Microeconomic Theory", code: "ECON 201", color: "bg-emerald-600 text-white", icon: "📈", description: "Supply & demand, market elasticity, and consumer choice" },
      { name: "Financial Accounting", code: "ACCT 210", color: "bg-blue-600 text-white", icon: "📊", description: "Balance sheets, cash flow, and financial statements" },
      { name: "Corporate Finance", code: "FIN 320", color: "bg-amber-600 text-white", icon: "💼", description: "Valuation, capital budgeting, and risk management" },
      { name: "Marketing Strategy", code: "MKTG 300", color: "bg-fuchsia-600 text-white", icon: "🎯", description: "Consumer behavior, market research, and brand positioning" },
    ],
  },
  {
    id: "humanities_law",
    title: "Humanities & Social Sciences",
    icon: "🏛️",
    description: "History, psychology, constitutional law, and literature",
    courses: [
      { name: "World History: 1500 to Present", code: "HIST 120", color: "bg-amber-600 text-white", icon: "🏛️", description: "Global revolutions, modern nations, and world events" },
      { name: "Cognitive Psychology", code: "PSYC 210", color: "bg-violet-600 text-white", icon: "🧠", description: "Memory, perception, learning, and neuroscience" },
      { name: "Constitutional Law", code: "LAW 250", color: "bg-slate-700 text-white", icon: "⚖️", description: "Judicial review, civil liberties, and statutory analysis" },
      { name: "Philosophy & Critical Ethics", code: "PHIL 105", color: "bg-rose-600 text-white", icon: "💡", description: "Moral theories, logic, and epistemological debates" },
    ],
  },
  {
    id: "high_school_ap",
    title: "High School AP / IB Core",
    icon: "🎓",
    description: "Advanced placement high school curriculum subjects",
    courses: [
      { name: "AP Calculus AB/BC", code: "AP-CALC", color: "bg-blue-600 text-white", icon: "📐", description: "Limits, derivatives, integrals, and series" },
      { name: "AP Biology", code: "AP-BIO", color: "bg-emerald-600 text-white", icon: "🧬", description: "Genetics, evolution, cellular biology, and ecology" },
      { name: "AP US History", code: "AP-USH", color: "bg-amber-600 text-white", icon: "🏛️", description: "Colonial era, revolution, civil war, and modern US" },
      { name: "AP English Literature", code: "AP-LIT", color: "bg-purple-600 text-white", icon: "📖", description: "Literary analysis, essays, and rhetoric techniques" },
    ],
  },
];

export const CourseSubjectModal: React.FC<CourseSubjectModalProps> = ({
  isOpen,
  onClose,
  subjects,
  assignments,
  onSaveSubjects,
  activeSubjectFilter,
  onSelectSubjectFilter,
}) => {
  const [activeTab, setActiveTab] = useState<"list" | "add" | "presets">("list");
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [viewingCourseDetails, setViewingCourseDetails] = useState<Subject | null>(null);
  const [copiedCourseId, setCopiedCourseId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formColor, setFormColor] = useState(COLOR_PALETTE[0].value);
  const [formIcon, setFormIcon] = useState("📚");
  const [formDescription, setFormDescription] = useState("");
  const [formInstructor, setFormInstructor] = useState("");

  // Confirmation modal state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleCopyCourseCode = (subj: Subject, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const codeToCopy = subj.code || subj.name;
    navigator.clipboard.writeText(codeToCopy);
    setCopiedCourseId(subj.id);
    triggerToast(`Copied code "${codeToCopy}" to clipboard!`);
    setTimeout(() => setCopiedCourseId(null), 2500);
  };

  if (!isOpen) return null;

  const resetForm = () => {
    setFormName("");
    setFormCode("");
    setFormColor(COLOR_PALETTE[0].value);
    setFormIcon("📚");
    setFormDescription("");
    setFormInstructor("");
    setEditingSubjectId(null);
  };

  const handleStartAdd = () => {
    resetForm();
    setActiveTab("add");
  };

  const handleStartEdit = (subj: Subject) => {
    setEditingSubjectId(subj.id);
    setFormName(subj.name || "");
    setFormCode(subj.code || "");
    setFormColor(subj.color || COLOR_PALETTE[0].value);
    setFormIcon(subj.icon || "📚");
    setFormDescription(subj.description || "");
    setFormInstructor(subj.instructor || "");
    setActiveTab("add");
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingSubjectId) {
      // Update existing
      const updated = subjects.map((s) => {
        if (s.id === editingSubjectId) {
          return {
            ...s,
            name: formName.trim(),
            code: formCode.trim() || undefined,
            color: formColor,
            icon: formIcon,
            description: formDescription.trim() || undefined,
            instructor: formInstructor.trim() || undefined,
          };
        }
        return s;
      });
      onSaveSubjects(updated);
      storageService.addActivity({
        type: "goal_updated",
        title: `Updated Course: ${formName.trim()}`,
        description: formCode ? `Course code: ${formCode}` : `Course settings modified`,
      });
      triggerToast(`Course "${formName.trim()}" updated successfully!`);
    } else {
      // Create new
      const newSubject: Subject = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: formName.trim(),
        code: formCode.trim() || undefined,
        color: formColor,
        icon: formIcon,
        description: formDescription.trim() || undefined,
        instructor: formInstructor.trim() || undefined,
      };
      const updated = [...subjects, newSubject];
      onSaveSubjects(updated);
      storageService.addActivity({
        type: "deck_created",
        title: `Added New Course: ${newSubject.name}`,
        description: newSubject.code ? `Course code: ${newSubject.code}` : `Enrolled in new subject`,
      });
      triggerToast(`Added course "${newSubject.name}" to your subject list!`);
    }

    resetForm();
    setActiveTab("list");
  };

  const handleDeleteSubject = (id: string, name: string) => {
    const updated = subjects.filter((s) => s.id !== id);
    onSaveSubjects(updated);
    if (activeSubjectFilter === id && onSelectSubjectFilter) {
      onSelectSubjectFilter(null);
    }
    storageService.addActivity({
      type: "goal_updated",
      title: `Removed Course: ${name}`,
      description: `Course removed from enrolled subjects`,
    });
    triggerToast(`Course "${name}" removed.`);
  };

  const handleClearAllSubjects = () => {
    onSaveSubjects([]);
    storageService.clearSubjects();
    if (onSelectSubjectFilter) {
      onSelectSubjectFilter(null);
    }
    setShowClearConfirm(false);
    storageService.addActivity({
      type: "goal_updated",
      title: "Cleared All Courses",
      description: "Subject list reset to empty clean slate",
    });
    triggerToast("All course subjects have been removed.");
  };

  const handleApplyPreset = (preset: typeof STARTER_TRACKS[0], mode: "append" | "replace") => {
    const formatted: Subject[] = preset.courses.map((c, i) => ({
      id: `sub_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 5)}`,
      name: c.name,
      code: c.code,
      color: c.color,
      icon: c.icon,
      description: c.description,
    }));

    if (mode === "replace") {
      onSaveSubjects(formatted);
      triggerToast(`Set up ${formatted.length} courses from "${preset.title}"!`);
    } else {
      const updated = [...subjects, ...formatted];
      onSaveSubjects(updated);
      triggerToast(`Added ${formatted.length} courses from "${preset.title}"!`);
    }
    setActiveTab("list");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                  Course Subjects Manager
                </h2>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  subjects.length > 0
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}>
                  {subjects.length} {subjects.length === 1 ? "Course" : "Courses"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Set up, customize, and manage your enrolled classes and academic subjects
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-all cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast */}
        {successToast && (
          <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-2 flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successToast}</span>
            </div>
            <button onClick={() => setSuccessToast(null)} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-5 sm:px-6 pt-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 gap-2 flex-wrap">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => {
                resetForm();
                setActiveTab("list");
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "list"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>My Courses ({subjects.length})</span>
            </button>

            <button
              onClick={handleStartAdd}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "add"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{editingSubjectId ? "Edit Course" : "+ Add New Course"}</span>
            </button>

            <button
              onClick={() => setActiveTab("presets")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "presets"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Starter Presets</span>
            </button>
          </div>

          {subjects.length > 0 && activeTab === "list" && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-2.5 py-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="Remove all courses"
            >
              <Trash2 className="w-3 h-3" />
              <span>Remove All Courses</span>
            </button>
          )}
        </div>

        {/* Modal Body / Tab Contents */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {/* TAB 1: LIST COURSES */}
          {activeTab === "list" && (
            <div className="space-y-4">
              {subjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-10 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                      No Course Subjects Configured
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      You have a clean slate! Add your own custom classes (e.g. Calculus, Organic Chemistry, World History) to organize your notes, flashcards, study schedules, and AI tutor.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 flex-wrap justify-center">
                    <button
                      onClick={handleStartAdd}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Create Your First Course</span>
                    </button>

                    <button
                      onClick={() => setActiveTab("presets")}
                      className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Load Starter Academic Track</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
                    <span>Enrolled Subjects ({subjects.length})</span>
                    <span>Click pencil to edit, trash to delete</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {subjects.map((subj) => {
                      const isFiltered = activeSubjectFilter === subj.id;
                      const activeAssignments = assignments || storageService.getAssignments();
                      const subjAssignments = activeAssignments.filter((a) => a.subjectId === subj.id);
                      const totalTasks = subjAssignments.length;
                      const completedTasks = subjAssignments.filter((a) => a.status === "Completed").length;
                      const pendingTasks = totalTasks - completedTasks;
                      const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

                      const getStrokeColor = (colorStr?: string) => {
                        if (!colorStr) return "#6366f1";
                        if (colorStr.includes("emerald")) return "#10b981";
                        if (colorStr.includes("violet")) return "#8b5cf6";
                        if (colorStr.includes("purple")) return "#a855f7";
                        if (colorStr.includes("rose")) return "#f43f5e";
                        if (colorStr.includes("amber")) return "#f59e0b";
                        if (colorStr.includes("teal")) return "#14b8a6";
                        if (colorStr.includes("cyan")) return "#06b6d4";
                        if (colorStr.includes("blue")) return "#3b82f6";
                        if (colorStr.includes("orange")) return "#f97316";
                        if (colorStr.includes("fuchsia")) return "#d946ef";
                        if (colorStr.includes("slate")) return "#64748b";
                        return "#6366f1";
                      };

                      const ringColor = percent === 100 ? "#10b981" : getStrokeColor(subj.color);

                      return (
                        <div
                          key={subj.id}
                          className="group relative p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/90 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-all flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shadow-xs shrink-0 ${subj.color || "bg-indigo-600 text-white"}`}>
                                  {subj.icon || "📚"}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">
                                    {subj.name}
                                  </h4>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {subj.code ? (
                                      <button
                                        type="button"
                                        onClick={(e) => handleCopyCourseCode(subj, e)}
                                        className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200/90 dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-950/60 transition-all cursor-pointer"
                                        title="Click to copy course code"
                                      >
                                        <span>{subj.code}</span>
                                        {copiedCourseId === subj.id ? (
                                          <Check className="w-2.5 h-2.5 text-emerald-500" />
                                        ) : (
                                          <Copy className="w-2.5 h-2.5 opacity-60" />
                                        )}
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleStartEdit(subj)}
                                        className="text-[10px] text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                                      >
                                        + Set Code
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Visual Progress Ring & Action Icons */}
                              <div className="flex items-center gap-1 shrink-0">
                                <div
                                  className="relative w-8 h-8 shrink-0 flex items-center justify-center"
                                  title={`${percent}% tasks completed (${completedTasks}/${totalTasks})`}
                                >
                                  <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 36 36">
                                    <circle
                                      cx="18"
                                      cy="18"
                                      r="14"
                                      stroke="currentColor"
                                      strokeWidth="3.2"
                                      className="text-slate-200 dark:text-slate-700/80"
                                      fill="transparent"
                                    />
                                    <circle
                                      cx="18"
                                      cy="18"
                                      r="14"
                                      stroke={ringColor}
                                      strokeWidth="3.2"
                                      strokeDasharray={87.96}
                                      strokeDashoffset={totalTasks > 0 ? 87.96 - (percent / 100) * 87.96 : 87.96}
                                      strokeLinecap="round"
                                      fill="transparent"
                                      className="transition-all duration-500 ease-out"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className={`text-[8px] font-black leading-none ${
                                      percent === 100
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : totalTasks === 0
                                        ? "text-slate-400"
                                        : "text-slate-700 dark:text-slate-200"
                                    }`}>
                                      {totalTasks === 0 ? "0%" : `${percent}%`}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => setViewingCourseDetails(subj)}
                                    className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition-all cursor-pointer"
                                    title="View course code and details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStartEdit(subj)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-all cursor-pointer"
                                    title="Edit course"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSubject(subj.id, subj.name)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all cursor-pointer"
                                    title="Delete course"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {subj.description && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {subj.description}
                              </p>
                            )}

                            {subj.instructor && (
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                <User className="w-3 h-3 text-slate-400" />
                                <span className="truncate">{subj.instructor}</span>
                              </div>
                            )}

                            {/* Visual Progress Bar Section */}
                            <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                                  <CheckCircle2 className={`w-3.5 h-3.5 ${
                                    percent === 100
                                      ? "text-emerald-500"
                                      : totalTasks === 0
                                      ? "text-slate-400"
                                      : "text-indigo-500"
                                  }`} />
                                  <span>Task Progress</span>
                                </span>
                                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                                  {completedTasks} of {totalTasks} <span className="text-slate-400 text-[10px]">({percent}%)</span>
                                </span>
                              </div>

                              <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden relative">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    percent === 100
                                      ? "bg-emerald-500"
                                      : percent > 0
                                      ? "bg-indigo-600 dark:bg-indigo-500"
                                      : "bg-slate-300 dark:bg-slate-600"
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>

                              <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-400 font-medium">
                                  {totalTasks === 0
                                    ? "No tasks assigned"
                                    : pendingTasks === 0
                                    ? "All tasks completed! 🎉"
                                    : `${pendingTasks} remaining`}
                                </span>
                                <span className={`font-black text-[9px] px-1.5 py-0.2 rounded-md ${
                                  percent === 100
                                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                                    : percent > 0
                                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                                    : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                }`}>
                                  {percent === 100 ? "100% DONE" : totalTasks === 0 ? "NO TASKS" : `${percent}% DONE`}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer: Quick Actions */}
                          <div className="pt-2.5 mt-2 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between gap-2 text-xs flex-wrap">
                            <button
                              type="button"
                              onClick={() => setViewingCourseDetails(subj)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-600 dark:text-indigo-300 font-bold text-[11px] transition-all cursor-pointer"
                              title="View Course Code and Details"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Code</span>
                            </button>

                            {onSelectSubjectFilter && (
                              <button
                                type="button"
                                onClick={() => onSelectSubjectFilter(isFiltered ? null : subj.id)}
                                className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-all cursor-pointer ${
                                  isFiltered
                                    ? "bg-indigo-600 text-white shadow-xs"
                                    : "text-slate-500 hover:text-indigo-600 hover:bg-slate-200/80 dark:hover:bg-slate-700"
                                }`}
                              >
                                {isFiltered ? "Active Filter ✓" : "Filter by Course"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleStartAdd}
                      className="px-4 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Add Another Course</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ADD / EDIT COURSE FORM */}
          {activeTab === "add" && (
            <form onSubmit={handleSubmitForm} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{editingSubjectId ? "Edit Course Subject" : "Set Up New Course Subject"}</span>
                </h3>
                <span className="text-xs text-slate-400">* Required</span>
              </div>

              {/* Course Name & Code Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                    Course Name *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Organic Chemistry, Machine Learning, World History"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-semibold text-xs sm:text-sm focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                    Course Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="e.g. CHEM 220"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-semibold text-xs sm:text-sm focus:border-indigo-500 transition-all font-mono uppercase"
                  />
                </div>
              </div>

              {/* Color Swatch Picker */}
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1.5 text-xs flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Course Color Theme</span>
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
                  {COLOR_PALETTE.map((c) => {
                    const isSelected = formColor === c.value;
                    return (
                      <button
                        key={c.label}
                        type="button"
                        onClick={() => setFormColor(c.value)}
                        className={`h-8 rounded-xl ${c.value} flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                          isSelected ? "ring-3 ring-offset-2 ring-indigo-500 scale-105" : "hover:opacity-90 opacity-75"
                        }`}
                        title={c.label}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Emoji Icon Picker */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 dark:text-slate-300 text-xs flex items-center gap-1.5">
                    <Smile className="w-3.5 h-3.5 text-amber-500" />
                    <span>Course Icon / Emoji</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">Selected:</span>
                    <span className="text-base">{formIcon}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  {POPULAR_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormIcon(emoji)}
                      className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                        formIcon === emoji
                          ? "bg-white dark:bg-slate-700 ring-2 ring-indigo-500 scale-110 shadow-xs"
                          : "hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Instructor & Room Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                    Professor / Instructor (Optional)
                  </label>
                  <input
                    type="text"
                    value={formInstructor}
                    onChange={(e) => setFormInstructor(e.target.value)}
                    placeholder="e.g. Prof. Alan Turing"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-semibold text-xs focus:border-indigo-500 transition-all"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 text-xs">
                    Course Description / Focus (Optional)
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="e.g. Focus on algorithms, midterms, and lab projects"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-semibold text-xs focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Live Preview of Course Badge */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">Live Preview:</span>
                <div className="flex items-center gap-2">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${formColor}`}>
                    {formIcon}
                  </span>
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                      {formName || "Course Name"}
                    </p>
                    <p className="text-[10px] font-mono text-slate-400">
                      {formCode || "CODE 101"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setActiveTab("list");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingSubjectId ? "Save Changes" : "+ Add Course"}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: STARTER PRESETS */}
          {activeTab === "presets" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white">
                  1-Click Academic Track Presets
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Select a starter package to populate standard courses instantly. You can always edit or remove them afterwards!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STARTER_TRACKS.map((track) => (
                  <div
                    key={track.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-xl">{track.icon}</span>
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {track.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                        {track.description}
                      </p>

                      <div className="space-y-1.5">
                        {track.courses.map((c) => (
                          <div
                            key={c.name}
                            className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                          >
                            <div className="flex items-center gap-2">
                              <span>{c.icon}</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{c.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 shrink-0">{c.code}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => handleApplyPreset(track, "replace")}
                        className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all text-center cursor-pointer"
                        title="Replace all existing courses with this track"
                      >
                        Set as My Courses
                      </button>
                      <button
                        onClick={() => handleApplyPreset(track, "append")}
                        className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
                        title="Add these courses to existing list"
                      >
                        + Append
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Course Code & Full Details Modal Overlay */}
        {viewingCourseDetails && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-5 animate-in zoom-in-95">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md ${viewingCourseDetails.color || "bg-indigo-600 text-white"}`}>
                    {viewingCourseDetails.icon || "📚"}
                  </div>
                  <div>
                    <h4 className="font-black text-lg text-slate-900 dark:text-white leading-tight">
                      {viewingCourseDetails.name}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Course Code & Details</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingCourseDetails(null)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Course Code Box */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                    Official Course Code
                  </span>
                  <span className="text-[10px] text-slate-400">ID: {viewingCourseDetails.id}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xl sm:text-2xl font-mono font-black text-slate-900 dark:text-white tracking-wide">
                    {viewingCourseDetails.code || "NOT SET"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleCopyCourseCode(viewingCourseDetails, e)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    {copiedCourseId === viewingCourseDetails.id ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Description & Instructor */}
              <div className="space-y-2 text-xs">
                {viewingCourseDetails.instructor && (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                    <User className="w-4 h-4 text-slate-400 shrink-0" />
                    <span><strong className="text-slate-900 dark:text-white">Instructor:</strong> {viewingCourseDetails.instructor}</span>
                  </div>
                )}
                {viewingCourseDetails.description ? (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200/60 dark:border-slate-800 space-y-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Description & Syllabus:</span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{viewingCourseDetails.description}</p>
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No course description provided.</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const subj = viewingCourseDetails;
                    setViewingCourseDetails(null);
                    handleStartEdit(subj);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingCourseDetails(null)}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Clear All Confirmation Dialog Overlay */}
        {showClearConfirm && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-rose-500/40 shadow-2xl max-w-sm w-full space-y-4 text-center animate-in zoom-in-95">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Remove All {subjects.length} Courses?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This will remove all current course subjects from your list so you can start completely clean.
                </p>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearAllSubjects}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 cursor-pointer"
                >
                  Yes, Remove All
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

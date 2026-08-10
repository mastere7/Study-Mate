import React, { useState } from "react";
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar as CalendarIcon,
  Trash2,
  Edit,
  Tag,
  Kanban,
  Check,
  X,
} from "lucide-react";
import { Assignment, StudySchedule, Subject, TaskStatus, PriorityLevel } from "../../types";

interface StudyPlannerScreenProps {
  assignments: Assignment[];
  schedules: StudySchedule[];
  subjects: Subject[];
  onSaveAssignments: (updated: Assignment[]) => void;
  onSaveSchedules: (updated: StudySchedule[]) => void;
}

export const StudyPlannerScreen: React.FC<StudyPlannerScreenProps> = ({
  assignments,
  schedules,
  subjects,
  onSaveAssignments,
  onSaveSchedules,
}) => {
  const [activeTab, setActiveTab] = useState<"kanban" | "schedule">("kanban");

  // New Assignment Modal
  const [showAddAssModal, setShowAddAssModal] = useState(false);
  const [newAssTitle, setNewAssTitle] = useState("");
  const [newAssDesc, setNewAssDesc] = useState("");
  const [newAssSubjectId, setNewAssSubjectId] = useState(subjects[0]?.id || "");
  const [newAssPriority, setNewAssPriority] = useState<PriorityLevel>("Medium");
  const [newAssDueDate, setNewAssDueDate] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0]
  );

  // New Schedule Session Modal
  const [showAddSchModal, setShowAddSchModal] = useState(false);
  const [newSchTitle, setNewSchTitle] = useState("");
  const [newSchSubjectId, setNewSchSubjectId] = useState(subjects[0]?.id || "");
  const [newSchDate, setNewSchDate] = useState(new Date().toISOString().split("T")[0]);
  const [newSchStart, setNewSchStart] = useState("16:00");
  const [newSchEnd, setNewSchEnd] = useState("17:30");

  // Move assignment between Kanban columns
  const handleUpdateAssStatus = (id: string, newStatus: TaskStatus) => {
    const updated = assignments.map((a) => (a.id === id ? { ...a, status: newStatus } : a));
    onSaveAssignments(updated);
  };

  const handleDeleteAssignment = (id: string) => {
    const updated = assignments.filter((a) => a.id !== id);
    onSaveAssignments(updated);
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssTitle.trim()) return;

    const newAss: Assignment = {
      id: `a_${Date.now()}`,
      userId: "u_student_1",
      subjectId: newAssSubjectId,
      title: newAssTitle.trim(),
      description: newAssDesc.trim(),
      dueDate: newAssDueDate,
      priority: newAssPriority,
      status: "To Do",
    };

    onSaveAssignments([newAss, ...assignments]);
    setShowAddAssModal(false);
    setNewAssTitle("");
    setNewAssDesc("");
  };

  const handleCreateSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSchTitle.trim()) return;

    const newSch: StudySchedule = {
      id: `sch_${Date.now()}`,
      userId: "u_student_1",
      subjectId: newSchSubjectId,
      title: newSchTitle.trim(),
      date: newSchDate,
      startTime: newSchStart,
      endTime: newSchEnd,
      isCompleted: false,
      type: "session",
    };

    onSaveSchedules([newSch, ...schedules]);
    setShowAddSchModal(false);
    setNewSchTitle("");
  };

  const handleToggleScheduleComplete = (id: string) => {
    const updated = schedules.map((s) => (s.id === id ? { ...s, isCompleted: !s.isCompleted } : s));
    onSaveSchedules(updated);
  };

  const handleDeleteSchedule = (id: string) => {
    const updated = schedules.filter((s) => s.id !== id);
    onSaveSchedules(updated);
  };

  const columns: TaskStatus[] = ["To Do", "In Progress", "Completed"];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Study Planner & Schedules</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage course assignments, set study sessions, and plan weekly revisions
          </p>
        </div>

        {/* Tab Switcher & Modal Triggers */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab("kanban")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "kanban"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Assignments Board
            </button>
            <button
              onClick={() => setActiveTab("schedule")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === "schedule"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Study Sessions
            </button>
          </div>

          <button
            onClick={() =>
              activeTab === "kanban" ? setShowAddAssModal(true) : setShowAddSchModal(true)
            }
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>{activeTab === "kanban" ? "+ Assignment" : "+ Session"}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Kanban Assignments Board */}
      {activeTab === "kanban" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {columns.map((colStatus) => {
            const colItems = assignments.filter((a) => a.status === colStatus);
            return (
              <div
                key={colStatus}
                className="rounded-3xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-4 space-y-4 min-h-[500px]"
              >
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>{colStatus}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                      {colItems.length}
                    </span>
                  </h3>
                </div>

                <div className="space-y-3">
                  {colItems.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-10">No tasks here</p>
                  ) : (
                    colItems.map((item) => {
                      const subject = subjects.find((s) => s.id === item.subjectId);
                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                subject?.color || "bg-indigo-500 text-white"
                              }`}
                            >
                              {subject?.name || "General"}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                item.priority === "High"
                                  ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400"
                                  : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                              }`}
                            >
                              {item.priority} Priority
                            </span>
                          </div>

                          <div>
                            <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                              {item.title}
                            </h4>
                            {item.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <CalendarIcon className="w-3 h-3" /> Due {item.dueDate}
                            </span>

                            {/* Status mover buttons */}
                            <div className="flex items-center gap-1">
                              {colStatus !== "To Do" && (
                                <button
                                  onClick={() => handleUpdateAssStatus(item.id, "To Do")}
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600"
                                >
                                  To Do
                                </button>
                              )}
                              {colStatus !== "In Progress" && (
                                <button
                                  onClick={() => handleUpdateAssStatus(item.id, "In Progress")}
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600"
                                >
                                  In Progress
                                </button>
                              )}
                              {colStatus !== "Completed" && (
                                <button
                                  onClick={() => handleUpdateAssStatus(item.id, "Completed")}
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950 text-emerald-600"
                                >
                                  Done
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteAssignment(item.id)}
                                className="p-1 text-slate-400 hover:text-rose-500"
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
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: Study Sessions Schedule */}
      {activeTab === "schedule" && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
            Study Sessions Timeline
          </h3>

          <div className="space-y-3">
            {schedules.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-6">
                No study sessions scheduled. Add a session to keep your routine on track!
              </p>
            ) : (
              schedules.map((sch) => {
                const subject = subjects.find((s) => s.id === sch.subjectId);
                return (
                  <div
                    key={sch.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      sch.isCompleted
                        ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-slate-500"
                        : "bg-slate-50/50 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-900 dark:text-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleToggleScheduleComplete(sch.id)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                          sch.isCompleted
                            ? "bg-emerald-600 border-emerald-600 text-white"
                            : "border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {sch.isCompleted && <Check className="w-4 h-4" />}
                      </button>

                      <div>
                        <h4 className={`font-bold text-sm ${sch.isCompleted ? "line-through" : ""}`}>
                          {sch.title}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {subject?.name} • {sch.date} ({sch.startTime} - {sch.endTime})
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSchedule(sch.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {showAddAssModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleCreateAssignment}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Add Course Assignment
              </h3>
              <button
                type="button"
                onClick={() => setShowAddAssModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Assignment Title
                </label>
                <input
                  type="text"
                  required
                  value={newAssTitle}
                  onChange={(e) => setNewAssTitle(e.target.value)}
                  placeholder="e.g. Database Relational Algebra Problem Set"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Subject</label>
                <select
                  value={newAssSubjectId}
                  onChange={(e) => setNewAssSubjectId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none font-semibold"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Due Date</label>
                  <input
                    type="date"
                    value={newAssDueDate}
                    onChange={(e) => setNewAssDueDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Priority</label>
                  <select
                    value={newAssPriority}
                    onChange={(e) => setNewAssPriority(e.target.value as PriorityLevel)}
                    className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none font-semibold"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">
                  Description / Instructions
                </label>
                <textarea
                  rows={3}
                  value={newAssDesc}
                  onChange={(e) => setNewAssDesc(e.target.value)}
                  placeholder="Task instructions..."
                  className="mt-1 w-full p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddAssModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Save Assignment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Schedule Modal */}
      {showAddSchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <form
            onSubmit={handleCreateSchedule}
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Schedule Study Session
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSchModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Session Title</label>
                <input
                  type="text"
                  required
                  value={newSchTitle}
                  onChange={(e) => setNewSchTitle(e.target.value)}
                  placeholder="e.g. Computer Networks Routing Review"
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 outline-none font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Subject</label>
                <select
                  value={newSchSubjectId}
                  onChange={(e) => setNewSchSubjectId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none font-semibold"
                >
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Date</label>
                  <input
                    type="date"
                    value={newSchDate}
                    onChange={(e) => setNewSchDate(e.target.value)}
                    className="mt-1 w-full px-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Start Time</label>
                  <input
                    type="time"
                    value={newSchStart}
                    onChange={(e) => setNewSchStart(e.target.value)}
                    className="mt-1 w-full px-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">End Time</label>
                  <input
                    type="time"
                    value={newSchEnd}
                    onChange={(e) => setNewSchEnd(e.target.value)}
                    className="mt-1 w-full px-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddSchModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Save Session
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

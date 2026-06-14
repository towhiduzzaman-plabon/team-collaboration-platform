import React, { useState } from "react";
import { 
  Project, 
  Task, 
  User 
} from "../types";
import { 
  Plus, 
  Search, 
  Calendar, 
  AlertCircle, 
  CheckSquare, 
  ChevronRight, 
  ArrowLeftRight,
  Filter,
  UserCheck
} from "lucide-react";

interface KanbanViewProps {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (p: Project) => void;
  tasks: Task[];
  users: User[];
  onOpenCreateProject: () => void;
  onOpenCreateTask: () => void;
  onUpdateTaskStatus: (taskId: string, newStatus: "Todo" | "In Progress" | "Review" | "Done") => void;
  onOpenTaskDetails: (task: Task) => void;
}

export default function KanbanView({
  projects,
  activeProject,
  setActiveProject,
  tasks,
  users,
  onOpenCreateProject,
  onOpenCreateTask,
  onUpdateTaskStatus,
  onOpenTaskDetails
}: KanbanViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const columns: { id: "Todo" | "In Progress" | "Review" | "Done"; title: string; color: string; bg: string }[] = [
    { id: "Todo", title: "Todo Backlog", color: "text-slate-600 border-slate-300", bg: "bg-slate-100/50" },
    { id: "In Progress", title: "In Progress", color: "text-indigo-600 border-indigo-300", bg: "bg-indigo-50/20" },
    { id: "Review", title: "Under Review", color: "text-amber-600 border-amber-300", bg: "bg-amber-50/20" },
    { id: "Done", title: "Done Completed", color: "text-emerald-600 border-emerald-300", bg: "bg-emerald-50/20" }
  ];

  // Filtering on tasks
  const filteredTasks = tasks.filter((task) => {
    if (task.projectId !== activeProject?._id) return false;
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesPriority;
  });

  // User accessor helpers
  const getUserAvatar = (userId: string | null) => {
    if (!userId) return null;
    const found = users.find(u => u._id === userId);
    return found ? found.avatar : null;
  };

  const getUserName = (userId: string | null) => {
    if (!userId) return "Unassigned";
    const found = users.find(u => u._id === userId);
    return found ? found.name : "Unassigned";
  };

  const getPriorityBadgeColor = (p: string) => {
    switch (p) {
      case "Urgent": return "bg-rose-100 text-rose-700 border-rose-200";
      case "High": return "bg-orange-100 text-orange-700 border-orange-200";
      case "Medium": return "bg-sky-100 text-sky-700 border-sky-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: "Todo" | "In Progress" | "Review" | "Done") => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onUpdateTaskStatus(taskId, status);
    }
  };

  return (
    <div className="flex-1 overflow-x-auto p-4 sm:p-6 md:p-8 bg-slate-50 min-h-screen flex flex-col" id="kanban-view">
      {/* Kanban Navigation Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8 shrink-0" id="kanban-topbar">
        {/* Project Selector & Details */}
        <div id="project-combo-section">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase font-mono text-slate-400 font-bold bg-slate-200/60 px-2 py-0.5 rounded">Project Unit</span>
            <select
              value={activeProject?._id || ""}
              onChange={(e) => {
                const found = projects.find(p => p._id === e.target.value);
                if (found) setActiveProject(found);
              }}
              className="font-sans font-bold text-lg text-slate-800 bg-transparent border-b-2 border-indigo-500 focus:outline-none focus:border-indigo-700 cursor-pointer pr-4"
              id="projects-selector-dropdown"
            >
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            {activeProject && (
              <span className={`px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider border font-mono ${
                activeProject.status === "Completed" ? "bg-emerald-100 text-emerald-800 border-emerald-200" :
                activeProject.status === "Review" ? "bg-amber-100 text-amber-800 border-amber-200" :
                activeProject.status === "Active" ? "bg-indigo-100 text-indigo-800 border-indigo-200" :
                "bg-slate-100 text-slate-800 border-slate-200"
              }`}>
                {activeProject.status}
              </span>
            )}
          </div>
          {activeProject && (
            <p className="text-slate-500 text-xs mt-1 max-w-2xl">{activeProject.description}</p>
          )}
        </div>

        {/* Action button rows */}
        <div className="flex flex-wrap items-center gap-3" id="kanban-projects-actions">
          <button
            onClick={onOpenCreateProject}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-lg shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            id="btn-trigger-create-project"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
          <button
            onClick={onOpenCreateTask}
            className="px-4 py-2 ai-gradient hover:opacity-95 text-white font-semibold text-xs rounded-lg shadow-md shadow-indigo-500/15 transition flex items-center gap-1.5 cursor-pointer select-none"
            id="btn-trigger-create-task"
          >
            <Plus className="h-4 w-4" />
            <span>Add Card Task</span>
          </button>
        </div>
      </div>

      {/* Filter and Query Sub-header Row */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 gap-4 mb-6 flex flex-col md:flex-row shadow-sm justify-between items-stretch md:items-center shrink-0" id="kanban-filters-bar">
        {/* Search Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search cards, labels or descriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 hover:border-slate-300 focus:outline-none focus:border-indigo-500 rounded-lg text-xs transition"
            id="kanban-search-input"
          />
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-2" id="priority-filter-pane">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 whitespace-nowrap">Priority Filter:</span>
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            {["all", "Low", "Medium", "High", "Urgent"].map((p) => (
              <button
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase rounded-md transition cursor-pointer ${
                  priorityFilter === p
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban lanes system with horizontal responsive scrolling */}
      <div className="flex-1 overflow-x-auto pb-4 scrollbar-thin" id="kanban-lanes-scroller">
        <div className="flex gap-6 min-h-[450px] min-w-[900px] lg:min-w-0 lg:grid lg:grid-cols-4" id="kanban-columns-grid">
        {columns.map((col) => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);
          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`rounded-xl flex flex-col p-4 border border-slate-200/80 ${col.bg} min-h-full w-full flex-1 md:min-w-[200px]`}
              id={`kanban-col-lane-${col.id}`}
            >
              {/* Lane Header */}
              <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200/60" id={`lane-title-panel-${col.id}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    col.id === "Todo" ? "bg-slate-400" :
                    col.id === "In Progress" ? "bg-indigo-500" :
                    col.id === "Review" ? "bg-amber-500" :
                    "bg-emerald-500"
                  }`}></span>
                  <h3 className="font-sans font-bold text-slate-800 text-sm whitespace-nowrap">{col.title}</h3>
                </div>
                <span className="bg-white border text-slate-500 text-xxs px-2 py-0.5 rounded-full font-bold font-mono shadow-sm">
                  {colTasks.length}
                </span>
              </div>

              {/* Lane Task Body */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 max-h-[500px] scrollbar-thin" id={`kanban-cards-wrapper-${col.id}`}>
                {colTasks.length === 0 ? (
                  <div className="border border-dashed border-slate-200/80 rounded-lg py-12 px-4 text-center text-xs text-slate-400" id={`empty-column-box-${col.id}`}>
                    <ArrowLeftRight className="h-5 w-5 text-slate-300 mx-auto mb-2 shrink-0 animate-pulse" />
                    <span>Empty column. Drag/move items here.</span>
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const doneSubtasks = task.subtasks.filter(st => st.isDone).length;
                    return (
                      <div
                        key={task._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task._id)}
                        className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm hover:shadow-md transition duration-150 cursor-grab active:cursor-grabbing group border-b-2 hover:border-b-indigo-500"
                        id={`task-card-item-${task._id}`}
                      >
                        {/* Tags Card Row */}
                        <div className="flex flex-wrap gap-1.5 justify-between items-start mb-2.5">
                          <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border font-mono ${getPriorityBadgeColor(task.priority)}`}>
                            {task.priority}
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {task.labels.slice(0, 2).map((l, index) => (
                              <span key={index} className="bg-slate-50 text-slate-600 border border-slate-200/85 text-[10px] px-1.5 py-0.2 rounded font-sans font-semibold">
                                {l}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Title Title description */}
                        <h4 
                          onClick={() => onOpenTaskDetails(task)}
                          className="font-sans font-bold text-slate-800 text-xs tracking-tight group-hover:text-indigo-600 transition cursor-pointer line-clamp-2"
                        >
                          {task.title}
                        </h4>
                        <p className="text-slate-400 text-xxs mt-1 line-clamp-2 leading-relaxed">
                          {task.description || "No supplemental descriptions."}
                        </p>

                        {/* Checklists or Date attributes */}
                        <div className="flex flex-wrap items-center justify-between gap-2.5 mt-4 pt-3.5 border-t border-slate-100">
                          <div className="flex items-center gap-3 text-slate-400 text-[10px] font-medium">
                            {task.deadline && (
                              <span className="flex items-center gap-1 font-mono hover:text-indigo-600">
                                <Calendar className="h-3 w-3" />
                                <span>{task.deadline}</span>
                              </span>
                            )}
                            {task.subtasks.length > 0 && (
                              <span className="flex items-center gap-1 font-mono font-bold text-slate-500">
                                <CheckSquare className="h-3 w-3" />
                                <span>{doneSubtasks}/{task.subtasks.length}</span>
                              </span>
                            )}
                          </div>

                          {/* Avatar representation or Move controller buttons */}
                          <div className="flex items-center gap-1.5" id={`task-card-user-pane-${task._id}`}>
                            {task.assigneeId ? (
                              <div className="relative group/avatar" title={getUserName(task.assigneeId)}>
                                <img
                                  src={getUserAvatar(task.assigneeId) || ""}
                                  alt="Assigned User"
                                  className="w-5.5 h-5.5 rounded-full object-cover ring-2 ring-indigo-50"
                                  referrerPolicy="no-referrer"
                                />
                                <span className="absolute bottom-0 right-0 h-1.5 w-1.5 bg-emerald-400 border border-white rounded-full"></span>
                              </div>
                            ) : (
                              <p className="text-[9px] text-slate-400 font-medium">No Owner</p>
                            )}

                            {/* Easy quick status switcher buttons */}
                            <div className="flex gap-0.5 ml-1 border-l pl-1.5 border-slate-200">
                              {col.id !== "Todo" && (
                                <button
                                  onClick={() => {
                                    const prevStatus = col.id === "In Progress" ? "Todo" : col.id === "Review" ? "In Progress" : "Review";
                                    onUpdateTaskStatus(task._id, prevStatus);
                                  }}
                                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-500 px-1 py-0.5 rounded cursor-pointer font-bold hover:text-slate-800"
                                  title="Move Left"
                                >
                                  ←
                                </button>
                              )}
                              {col.id !== "Done" && (
                                <button
                                  onClick={() => {
                                    const nextStatus = col.id === "Todo" ? "In Progress" : col.id === "In Progress" ? "Review" : "Done";
                                    onUpdateTaskStatus(task._id, nextStatus);
                                  }}
                                  className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-1 py-0.5 rounded cursor-pointer font-bold hover:text-indigo-800"
                                  title="Move Right"
                                >
                                  →
                                </button>
                              )}
                            </div>
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
    </div>
  </div>
  );
}

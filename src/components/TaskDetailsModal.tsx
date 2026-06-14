import React, { useState, useEffect } from "react";
import { 
  Task, 
  User, 
  Comment, 
  Subtask 
} from "../types";
import { 
  X, 
  UserPlus, 
  Tag, 
  Calendar, 
  CheckSquare, 
  Paperclip, 
  MessageSquare, 
  Sparkles, 
  Trash2, 
  Plus,
  Send,
  Download,
  AlertCircle
} from "lucide-react";

interface TaskDetailsModalProps {
  task: Task;
  onClose: () => void;
  users: User[];
  currentUser: User | null;
  onUpdateTask: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
  activeWorkspaceId: string;
}

export default function TaskDetailsModal({
  task,
  onClose,
  users,
  currentUser,
  onUpdateTask,
  onDeleteTask,
  activeWorkspaceId
}: TaskDetailsModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [assigneeId, setAssigneeId] = useState(task.assigneeId);
  const [deadline, setDeadline] = useState(task.deadline);
  const [newLabel, setNewLabel] = useState("");
  const [labels, setLabels] = useState<string[]>(task.labels || []);
  const [subtasks, setSubtasks] = useState<Subtask[]>(task.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  // Attachments & State
  const [attachments, setAttachments] = useState(task.attachments || []);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Commments
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  // AI Load states
  const [isAiBreaking, setIsAiBreaking] = useState(false);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [aiRationale, setAiRationale] = useState("");

  // Load comments
  useEffect(() => {
    fetchComments();
  }, [task._id]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/comments/${task._id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error("Failed to fetch task comments:", err);
    }
  };

  // Synchronize on change
  const handleSaveAttributes = () => {
    const updated: Task = {
      ...task,
      title,
      description,
      status,
      priority,
      assigneeId,
      deadline,
      labels,
      subtasks,
      attachments
    };
    onUpdateTask(updated);
  };

  // Add Label Tag
  const handleAddLabel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    if (!labels.includes(newLabel.trim())) {
      const updated = [...labels, newLabel.trim()];
      setLabels(updated);
      onUpdateTask({ ...task, labels: updated });
    }
    setNewLabel("");
  };

  // Remove Label Tag
  const handleRemoveLabel = (label: string) => {
    const updated = labels.filter(l => l !== label);
    setLabels(updated);
    onUpdateTask({ ...task, labels: updated });
  };

  // Change subtask state
  const handleToggleSubtask = (id: string) => {
    const updated = subtasks.map(st => st.id === id ? { ...st, isDone: !st.isDone } : st);
    setSubtasks(updated);
    onUpdateTask({ ...task, subtasks: updated });
  };

  // Add inline subtask
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const newSt = {
      id: "st_" + Math.random().toString(36).substr(2, 9),
      title: newSubtaskTitle.trim(),
      isDone: false
    };
    const updated = [...subtasks, newSt];
    setSubtasks(updated);
    onUpdateTask({ ...task, subtasks: updated });
    setNewSubtaskTitle("");
  };

  // Delete subtask
  const handleDeleteSubtask = (id: string) => {
    const updated = subtasks.filter(st => st.id !== id);
    setSubtasks(updated);
    onUpdateTask({ ...task, subtasks: updated });
  };

  // File drag & drop simulator handlers
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const newAttach = {
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
        url: "#"
      };
      const updated = [...attachments, newAttach];
      setAttachments(updated);
      onUpdateTask({ ...task, attachments: updated });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const newAttach = {
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(1) + " MB",
        url: "#"
      };
      const updated = [...attachments, newAttach];
      setAttachments(updated);
      onUpdateTask({ ...task, attachments: updated });
    }
  };

  // Post Comment
  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task._id,
          userId: currentUser?._id,
          userName: currentUser?.name,
          userAvatar: currentUser?.avatar,
          content: newComment.trim(),
          workspaceId: activeWorkspaceId
        })
      });

      if (res.ok) {
        setNewComment("");
        fetchComments();
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  // Emoji reactions
  const handleAddReaction = async (commentId: string, emoji: string) => {
    try {
      const res = await fetch(`/api/comments/${commentId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji, userId: currentUser?._id || "u1" })
      });
      if (res.ok) {
        fetchComments();
      }
    } catch (err) {
      console.error("Reaction toggle failed:", err);
    }
  };

  // =========================================================================
  // GEMINI AI INTEGRATION SUITE
  // =========================================================================

  // AI Checklist breakdown
  const handleAiBreakdown = async () => {
    setIsAiBreaking(true);
    try {
      const res = await fetch("/api/ai/task-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.subtasks && Array.isArray(data.subtasks)) {
          const generatedSts = data.subtasks.map((stTitle: string) => ({
            id: "ai_" + Math.random().toString(36).substr(2, 9),
            title: stTitle,
            isDone: false
          }));
          const updated = [...subtasks, ...generatedSts];
          setSubtasks(updated);
          onUpdateTask({ ...task, subtasks: updated });
        }
      }
    } catch (err) {
      console.error("AI breakdown request failed:", err);
    } finally {
      setIsAiBreaking(false);
    }
  };

  // AI Deadline suggesting
  const handleAiDeadlineSuggest = async () => {
    setIsAiSuggesting(true);
    setAiRationale("");
    try {
      const res = await fetch("/api/ai/deadline-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, priority, labels })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.date) {
          setDeadline(data.date);
          setAiRationale(data.rationale);
          onUpdateTask({ ...task, deadline: data.date });
        }
      }
    } catch (err) {
      console.error("AI deadline suggestion failed:", err);
    } finally {
      setIsAiSuggesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 overflow-y-auto backdrop-blur-xs" id="task-details-modal">
      <div 
        className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200" 
        id="task-details-box"
      >
        {/* Head Bar */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xxs bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase font-bold">
              Task Details Panel
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-800 transition cursor-pointer"
            id="btn-close-details-modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Main Body Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 p-6 gap-6" id="modal-container-grid">
          {/* LEFT WING: Details inputs, checklists, attachments, comments */}
          <div className="lg:col-span-7 space-y-6" id="left-wing-details">
            {/* Title & Description inputs */}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSaveAttributes}
                className="w-full font-sans font-bold text-lg text-slate-800 border-b border-transparent hover:border-slate-200 focus:outline-none focus:border-indigo-500 pb-1"
                id="task-edit-title-input"
              />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleSaveAttributes}
                placeholder="Write supplemental task goals, specifications, or jira ticket logs block here..."
                className="w-full mt-3 p-3 text-xs text-slate-600 border border-slate-200 hover:border-slate-300 focus:outline-none focus:border-indigo-500 rounded-lg min-h-[100px] resize-y"
                id="task-edit-desc-input"
              />
            </div>

            {/* Checklist subtasks with AI breakdown Trigger */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4" id="task-subtasks-section">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-4.5 w-4.5 text-indigo-500" />
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono">
                    Subtask Action Lists
                  </h4>
                </div>
                <button
                  onClick={handleAiBreakdown}
                  disabled={isAiBreaking}
                  className="px-2.5 py-1.5 ai-gradient hover:opacity-95 disabled:opacity-50 text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-md shadow-indigo-500/10 transition flex items-center gap-1 cursor-pointer"
                  id="btn-ai-task-breakdown"
                >
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  {isAiBreaking ? "Generating breakdown..." : "Breakdown with Gemini AI⚡"}
                </button>
              </div>

              {/* Subtask elements list */}
              <div className="space-y-2 mb-3" id="subtasks-item-feed">
                {subtasks.length === 0 ? (
                  <p className="text-xxs text-slate-400 text-center py-4 italic">No checklist elements. Use Gemini breakdown to populate!</p>
                ) : (
                  subtasks.map((st) => (
                    <div key={st.id} className="flex items-center justify-between gap-2 p-2 bg-white rounded-lg border border-slate-100 shadow-xxs">
                      <label className="flex items-center gap-2 cursor-pointer flex-1 text-slate-700 text-xs">
                        <input
                          type="checkbox"
                          checked={st.isDone}
                          onChange={() => handleToggleSubtask(st.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 h-4 w-4"
                        />
                        <span className={st.isDone ? "line-through text-slate-400" : ""}>{st.title}</span>
                      </label>
                      <button 
                        onClick={() => handleDeleteSubtask(st.id)}
                        className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add checklist item inline */}
              <form onSubmit={handleAddSubtask} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Insert custom action items..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs md:text-xs placeholder-slate-400 focus:border-indigo-500 focus:outline-none"
                  id="input-inline-subtask"
                />
                <button
                  type="submit"
                  className="px-3 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Add
                </button>
              </form>
            </div>

            {/* Drag and Drop File Attachments Container */}
            <div className="border border-slate-200 rounded-xl p-4" id="task-attachments-section">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
                <Paperclip className="h-4 w-4 text-slate-400" />
                <span>Files & Attachments</span>
              </h4>

              {/* Upload Drop Zone drag validation */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition cursor-pointer ${
                  isDraggingFile 
                    ? "border-indigo-500 bg-indigo-50/30 text-indigo-700" 
                    : "border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-500"
                }`}
                id="attachment-drop-zone"
              >
                <div className="flex flex-col items-center">
                  <Paperclip className="h-6 w-6 text-slate-400 mb-1" />
                  <p className="text-xs font-semibold text-slate-700">Drag files here to attach</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">or click standard selector to upload</p>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="attachment-input-selector"
                  />
                  <label 
                    htmlFor="attachment-input-selector"
                    className="mt-2.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200/90 text-[10px] font-bold uppercase rounded-lg shadow-xxs cursor-pointer"
                  >
                    Select File
                  </label>
                </div>
              </div>

              {/* Attachments List */}
              {attachments.length > 0 && (
                <div className="mt-3.5 space-y-2" id="attachments-feed-list">
                  {attachments.map((at, index) => (
                    <div key={index} className="flex justify-between items-center p-2 border border-slate-100 bg-slate-50 rounded-lg text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-700 truncate">{at.name}</span>
                        <span className="text-slate-400 text-xxs font-mono">{at.size}</span>
                      </div>
                      <a 
                        href="#download-att"
                        onClick={(e) => e.preventDefault()}
                        className="p-1 hover:bg-slate-200 text-indigo-600 rounded cursor-pointer transition flex items-center gap-1 font-bold text-xxs"
                        title="Download Attachment Simulator"
                      >
                        <Download className="h-3 w-3" />
                        <span>Save</span>
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Task comments stream */}
            <div className="border border-slate-200 rounded-xl p-4 flex flex-col h-80" id="task-comments-section">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono mb-3 flex items-center gap-2 shrink-0">
                <MessageSquare className="h-4.5 w-4.5 text-slate-400" />
                <span>Discussion Board ({comments.length})</span>
              </h4>

              {/* Messages list */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin mb-3" id="comments-timeline-list">
                {comments.length === 0 ? (
                  <p className="text-[11px] text-slate-400 text-center py-6">No discussion comments posted. Start by typing below!</p>
                ) : (
                  comments.map((comm) => (
                    <div key={comm._id} className="flex gap-2 text-xs" id={`comment-item-box-${comm._id}`}>
                      <img
                        src={comm.userAvatar}
                        alt="Avatar"
                        className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0 bg-slate-50 border p-2.5 rounded-lg border-slate-100">
                        <div className="flex justify-between items-center font-semibold text-slate-700">
                          <span className="truncate">{comm.userName}</span>
                          <span className="text-slate-400 font-mono text-[9px]">{new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-slate-600 text-xs mt-1 leading-relaxed break-words">{comm.content}</p>

                        {/* Reaction emojis row */}
                        <div className="flex items-center gap-1.5 mt-2.5">
                          {["👍", "❤️", "🚀", "📢"].map((em) => {
                            const react = (comm.reactions || []).find((r: any) => r.emoji === em);
                            const hasUserReacted = react && currentUser && react.users.includes(currentUser._id);
                            return (
                              <button
                                key={em}
                                onClick={() => handleAddReaction(comm._id, em)}
                                className={`px-2 py-0.5 rounded-full text-xxs border flex items-center gap-1 transition-all cursor-pointer ${
                                  hasUserReacted 
                                    ? "bg-indigo-50 border-indigo-200 text-indigo-600 font-bold" 
                                    : "bg-white border-slate-200 hover:bg-slate-100 text-slate-500"
                                }`}
                              >
                                <span>{em}</span>
                                {react && react.count > 0 && <span className="font-mono">{react.count}</span>}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment submission form */}
              <form onSubmit={handlePostComment} className="flex gap-2 shrink-0">
                <input
                  type="text"
                  placeholder="Type comment (use @Name to mention)..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-lg text-xs"
                  id="new-comment-input-field"
                />
                <button
                  type="submit"
                  className="px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg cursor-pointer transition"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT WING: Attributes parameters, metadata, action buttons */}
          <div className="lg:col-span-5 bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-6" id="right-wing-attributes">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b pb-2">
              Parameters & Settings
            </h4>

            {/* Status Config selector */}
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 select-none block mb-1">Lane Status</label>
              <select
                value={status}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setStatus(val);
                  onUpdateTask({ ...task, status: val });
                }}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 shadow-xxs cursor-pointer"
                id="select-detail-status"
              >
                <option value="Todo">Todo Backlog</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Under Review</option>
                <option value="Done">Done Completed</option>
              </select>
            </div>

            {/* Priority Config selector */}
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 select-none block mb-1">Priority Weight</label>
              <select
                value={priority}
                onChange={(e) => {
                  const val = e.target.value as any;
                  setPriority(val);
                  onUpdateTask({ ...task, priority: val });
                }}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 shadow-xxs cursor-pointer"
                id="select-detail-priority"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Urgent">Urgent</option>
              </select>
            </div>

            {/* Assignee Config dropdown */}
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 select-none block mb-1">Assignee</label>
              <select
                value={assigneeId || ""}
                onChange={(e) => {
                  const val = e.target.value ? e.target.value : null;
                  setAssigneeId(val);
                  onUpdateTask({ ...task, assigneeId: val });
                }}
                className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 shadow-xxs cursor-pointer"
                id="select-detail-assignee"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            {/* Target Deadline Input */}
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 select-none block mb-1">Target Deadline</label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => {
                    setDeadline(e.target.value);
                    onUpdateTask({ ...task, deadline: e.target.value });
                  }}
                  className="flex-1 bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 shadow-xxs cursor-pointer"
                  id="input-detail-deadline"
                />
                <button
                  onClick={handleAiDeadlineSuggest}
                  disabled={isAiSuggesting}
                  className="px-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 disabled:bg-slate-100 text-indigo-700 rounded-lg shadow-xxs cursor-pointer flex items-center justify-center shrink-0"
                  title="AI Target date suggestion"
                  id="btn-ai-deadline"
                >
                  <Sparkles className="h-4 w-4" />
                </button>
              </div>

              {/* Suggest deadline reason display */}
              {isAiSuggesting && (
                <p className="text-[11px] text-slate-400 mt-2 font-mono animate-pulse">Querying Gemini Flash scheduler...</p>
              )}
              {aiRationale && !isAiSuggesting && (
                <div className="mt-2.5 p-2 bg-indigo-50 border border-indigo-100/60 rounded-lg" id="ai-deadline-rationale">
                  <p className="text-[10px] text-indigo-800 font-semibold uppercase tracking-wider font-mono flex items-center gap-1">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Gemini Scheduler Advice</span>
                  </p>
                  <p className="text-xxs text-slate-500 mt-0.5 leading-relaxed">{aiRationale}</p>
                </div>
              )}
            </div>

            {/* Label Tags creation */}
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 select-none block mb-1">Labels & Tags</label>
              <form onSubmit={handleAddLabel} className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Create label tag..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-lg p-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  id="input-detail-new-tag"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  Add
                </button>
              </form>
              <div className="flex flex-wrap gap-1.5" id="label-tags-pill-list">
                {labels.length === 0 ? (
                  <span className="text-xxs text-slate-400 italic">No labels created.</span>
                ) : (
                  labels.map((l) => (
                    <span 
                      key={l} 
                      className="inline-flex items-center gap-1 bg-slate-200 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    >
                      <span>{l}</span>
                      <button 
                        onClick={() => handleRemoveLabel(l)}
                        className="text-slate-400 hover:text-slate-800 font-bold ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Task Elimination Row */}
            <div className="pt-6 border-t border-slate-200" id="elimate-task-wrapper">
              <button
                onClick={() => {
                  if (confirm("Are you positive you wish to proceed with deleting this task permanent?")) {
                    onDeleteTask(task._id);
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold hover:border-rose-300 transition cursor-pointer"
                id="btn-delete-active-task"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete This Card Task</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

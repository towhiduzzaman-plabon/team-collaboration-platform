import React, { useState, useEffect } from "react";
import { 
  User, 
  Workspace, 
  Project, 
  Task, 
  Notification, 
  ActivityLog, 
  DashboardStats 
} from "./types";
import Sidebar from "./components/Sidebar";
import DashboardView from "./components/DashboardView";
import KanbanView from "./components/KanbanView";
import ChatView from "./components/ChatView";
import AIPanel from "./components/AIPanel";
import WorkspaceSettings from "./components/WorkspaceSettings";
import AuthPage from "./components/AuthPage";
import TaskDetailsModal from "./components/TaskDetailsModal";
import { Plus, X, Layers, AlertCircle, Sparkles, Menu } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Core MERN models lists state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Analytics State
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    reviewTasks: 0,
    inProgressTasks: 0,
    priorityUrgent: 0,
    priorityHigh: 0,
    priorityMedium: 0,
    priorityLow: 0
  });

  // Navigation router tabs
  const [currentTab, setCurrentTab] = useState<string>("dashboard");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleSetTab = (tab: string) => {
    setCurrentTab(tab);
    setIsMobileSidebarOpen(false);
  };

  // Selection state overlay dialog triggers
  const [selectedTaskDetails, setSelectedTaskDetails] = useState<Task | null>(null);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // New Creation Forms input states
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDesc, setNewWorkspaceDesc] = useState("");

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectDeadline, setNewProjectDeadline] = useState("");
  const [newProjectStatus, setNewProjectStatus] = useState<"Planning" | "Active" | "Review" | "Completed">("Active");

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"Low" | "Medium" | "High" | "Urgent">("Medium");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState("");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [newTaskLabelString, setNewTaskLabelString] = useState(""); // Comma split labels

  // Auto check token on initialization
  useEffect(() => {
    const savedToken = localStorage.getItem("collab_jwt_token");
    const savedUser = localStorage.getItem("collab_user_profile");
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        const parsedUser = JSON.parse(savedUser);
        if (parsedUser.email === "owner@company.com" || parsedUser.name === "Alex Mercer") {
          parsedUser.name = "Towhiduzzaman PLabon";
          localStorage.setItem("collab_user_profile", JSON.stringify(parsedUser));
        }
        setCurrentUser(parsedUser);
      } catch (e) {
        localStorage.removeItem("collab_jwt_token");
        localStorage.removeItem("collab_user_profile");
      }
    }
  }, []);

  // Sync workspaces, notifications, and users lists once user logs in
  useEffect(() => {
    if (currentUser) {
      fetchWorkspaces();
      fetchUsers();
      fetchNotifications();

      // Simulated Socket.io refresh loop: Polling every 5 seconds to load newly added messages, activities, notifications, or board alterations from simulated players
      const interval = setInterval(() => {
        fetchNotifications();
        if (activeWorkspace) {
          fetchActivities(activeWorkspace._id);
          fetchTasks(activeWorkspace._id);
          fetchDashboardStats(activeWorkspace._id);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [currentUser, activeWorkspace?._id]);

  // Sync projects and tasks whenever activeWorkspace alterations are made
  useEffect(() => {
    if (activeWorkspace) {
      fetchProjects(activeWorkspace._id);
      fetchTasks(activeWorkspace._id);
      fetchActivities(activeWorkspace._id);
      fetchDashboardStats(activeWorkspace._id);
    }
  }, [activeWorkspace?._id]);

  const handleLoginSuccess = (user: User, tokenString: string) => {
    setCurrentUser(user);
    setToken(tokenString);
    localStorage.setItem("collab_jwt_token", tokenString);
    localStorage.setItem("collab_user_profile", JSON.stringify(user));
  };

  const handleLogout = () => {
    signOut(auth).catch((err) => console.error("Firebase logout error:", err));
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem("collab_jwt_token");
    localStorage.removeItem("collab_user_profile");
    setCurrentTab("dashboard");
  };

  // =========================================================================
  // BACKEND SYNCHRONIZATION ENDPOINTS APIS
  // =========================================================================

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (err) {
      console.error("Failed to load users roster:", err);
    }
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch("/api/workspaces");
      if (res.ok) {
        const list = await res.json();
        setWorkspaces(list);
        if (list.length > 0 && !activeWorkspace) {
          // Default to first workspace
          setActiveWorkspace(list[0]);
        }
      }
    } catch (err) {
      console.error("Failed to fetch workspaces:", err);
    }
  };

  const fetchProjects = async (workspaceId: string) => {
    try {
      const res = await fetch(`/api/projects?workspaceId=${workspaceId}`);
      if (res.ok) {
        const list = await res.json();
        setProjects(list);
        if (list.length > 0) {
          // Set active project to first project if none is active or active is deleted
          const stillExists = list.some((p: any) => p._id === activeProject?._id);
          if (!stillExists) setActiveProject(list[0]);
        } else {
          setActiveProject(null);
        }
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    }
  };

  const fetchTasks = async (workspaceId: string) => {
    try {
      const res = await fetch(`/api/tasks?workspaceId=${workspaceId}`);
      if (res.ok) {
        setTasks(await res.json());
      }
    } catch (err) {
      console.error("Failed to load workspace tasks:", err);
    }
  };

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/notifications?userId=${currentUser._id}`);
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (err) {
      console.error("Failed to fetch notification timelines:", err);
    }
  };

  const fetchActivities = async (workspaceId: string) => {
    try {
      const res = await fetch(`/api/activities?workspaceId=${workspaceId}`);
      if (res.ok) {
        setActivities(await res.json());
      }
    } catch (err) {
      console.error("Failed to load system activity logs:", err);
    }
  };

  const fetchDashboardStats = async (workspaceId: string) => {
    try {
      const res = await fetch(`/api/dashboard?workspaceId=${workspaceId}`);
      if (res.ok) {
        setDashboardStats(await res.json());
      }
    } catch (err) {
      console.error("Failed to compute dashboard metrics:", err);
    }
  };

  // =========================================================================
  // CRUD MUTATORS TRIGGERS
  // =========================================================================

  // Create workspace
  const handleCreateWorkspaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newWorkspaceName.trim(),
          description: newWorkspaceDesc.trim(),
          ownerId: currentUser?._id,
          ownerName: currentUser?.name,
          ownerEmail: currentUser?.email,
          ownerRole: currentUser?.role
        })
      });

      if (res.ok) {
        const created = await res.json();
        setNewWorkspaceName("");
        setNewWorkspaceDesc("");
        setShowWorkspaceModal(false);
        fetchWorkspaces();
        setActiveWorkspace(created);
      }
    } catch (err) {
      console.error("Failed to submit workspace creation:", err);
    }
  };

  // Create Project
  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !activeWorkspace) return;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspace._id,
          name: newProjectName.trim(),
          description: newProjectDesc.trim(),
          deadline: newProjectDeadline,
          status: newProjectStatus,
          members: [currentUser?._id || "u1"]
        })
      });

      if (res.ok) {
        setNewProjectName("");
        setNewProjectDesc("");
        setNewProjectDeadline("");
        setShowProjectModal(false);
        fetchProjects(activeWorkspace._id);
      }
    } catch (err) {
      console.error("Project submission error:", err);
    }
  };

  // Create Task card
  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !activeProject || !activeWorkspace) return;

    const labelList = newTaskLabelString
      ? newTaskLabelString.split(",").map(l => l.trim()).filter(l => l.length > 0)
      : [];

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim(),
          projectId: activeProject._id,
          workspaceId: activeWorkspace._id,
          priority: newTaskPriority,
          assigneeId: newTaskAssigneeId || null,
          deadline: newTaskDeadline,
          labels: labelList,
          status: "Todo",
          attachments: [],
          subtasks: []
        })
      });

      if (res.ok) {
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskAssigneeId("");
        setNewTaskDeadline("");
        setNewTaskLabelString("");
        setShowTaskModal(false);
        fetchTasks(activeWorkspace._id);
        fetchDashboardStats(activeWorkspace._id);
      }
    } catch (err) {
      console.error("Sprint task card creation failure:", err);
    }
  };

  // Modify Task Card Status (Todo -> In Progress -> Review -> Done)
  const handleUpdateTaskStatus = async (taskId: string, newStatus: "Todo" | "In Progress" | "Review" | "Done") => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        if (activeWorkspace) {
          fetchTasks(activeWorkspace._id);
          fetchDashboardStats(activeWorkspace._id);
          fetchActivities(activeWorkspace._id);
        }
      }
    } catch (err) {
      console.error("Failed to update task lane status:", err);
    }
  };

  // Edit general task attributes
  const handleUpdateTaskAttributes = async (updatedTask: Task) => {
    try {
      const res = await fetch(`/api/tasks/${updatedTask._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask)
      });

      if (res.ok) {
        if (activeWorkspace) {
          fetchTasks(activeWorkspace._id);
          fetchDashboardStats(activeWorkspace._id);
        }
      }
    } catch (err) {
      console.error("Failed to overwrite task definitions:", err);
    }
  };

  // Delete task card
  const handleDeleteTask = async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        if (activeWorkspace) {
          fetchTasks(activeWorkspace._id);
          fetchDashboardStats(activeWorkspace._id);
        }
      }
    } catch (err) {
      console.error("Failed to wipe task card:", err);
    }
  };

  // Workspace settings mutator edits
  const handleUpdateWorkspace = async (updatedWorkspace: Workspace) => {
    try {
      const res = await fetch(`/api/workspaces/${updatedWorkspace._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedWorkspace)
      });
      if (res.ok) {
        fetchWorkspaces();
        setActiveWorkspace(updatedWorkspace);
      }
    } catch (err) {
      console.error("Failed to update general workplace attributes:", err);
    }
  };

  // Invite workspace member
  const handleInviteMember = async (email: string, role: string, name: string) => {
    if (!activeWorkspace) return null;
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace._id}/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role, name })
      });
      if (res.ok) {
        const bodyObj = await res.json();
        // Reload workspace members
        fetchWorkspaces();
        if (activeWorkspace) {
          const updated = {
            ...activeWorkspace,
            members: [...activeWorkspace.members, bodyObj.member]
          };
          setActiveWorkspace(updated);
        }
        return { status: "success" };
      }
    } catch (err) {
      console.error("Roster invitation dispatch failed:", err);
    }
    return { status: "error" };
  };

  // Remove workspace member
  const handleRemoveMember = async (userId: string) => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(`/api/workspaces/${activeWorkspace._id}/members/${userId}`, {
        method: "DELETE"
      });
      if (res.ok) {
        fetchWorkspaces();
        const updated = {
          ...activeWorkspace,
          members: activeWorkspace.members.filter(m => m.userId !== userId)
        };
        setActiveWorkspace(updated);
      }
    } catch (err) {
      console.error("Workspace member removal failed:", err);
    }
  };

  // Dismiss user notification
  const handleMarkNotificationRead = async (notifId: string) => {
    try {
      const res = await fetch(`/api/notifications/${notifId}/read`, {
        method: "POST"
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) {
      console.error("Dismiss notification failure:", err);
    }
  };

  // =========================================================================
  // VIEW RENDERER GATEKEEPER
  // =========================================================================

  if (!currentUser || !token) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="flex bg-slate-100 h-screen select-none overflow-hidden" id="applet-core-shell">
      {/* Sidebar Navigation Drawer */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={handleSetTab}
        workspaces={workspaces}
        activeWorkspace={activeWorkspace}
        setActiveWorkspace={setActiveWorkspace}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenNewWorkspaceModal={() => setShowWorkspaceModal(true)}
        notificationsCount={unreadNotificationsCount}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Primary Dashboard/Kanban Workspace screen viewport */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden" id="workspace-primary-stage">
        {/* Mobile responsive thin top navigation header bar */}
        <header className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0 select-none z-20" id="mobile-navigation-topbar">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-300 bg-slate-950/20 cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-sans font-extrabold text-sm tracking-tight text-white flex items-center gap-2">
              <span className="w-5 h-5 ai-gradient rounded flex items-center justify-center text-white text-[11px] font-bold">C</span>
              CollabSaaS AI
            </span>
          </div>
          <div className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded border border-indigo-500/15 max-w-[140px] truncate font-mono">
            {activeWorkspace?.name || "Active"}
          </div>
        </header>
        {currentTab === "dashboard" && (
          <DashboardView
            stats={dashboardStats}
            projects={projects}
            tasks={tasks}
            activities={activities}
            notifications={notifications}
            onMarkNotificationRead={handleMarkNotificationRead}
            activeWorkspaceName={activeWorkspace?.name || ""}
          />
        )}

        {currentTab === "kanban" && (
          <KanbanView
            projects={projects}
            activeProject={activeProject}
            setActiveProject={setActiveProject}
            tasks={tasks}
            users={users}
            onOpenCreateProject={() => setShowProjectModal(true)}
            onOpenCreateTask={() => {
              if (projects.length === 0) {
                alert("Please add a Project before assigning tasks.");
                return;
              }
              setShowTaskModal(true);
            }}
            onUpdateTaskStatus={handleUpdateTaskStatus}
            onOpenTaskDetails={(taskObj) => setSelectedTaskDetails(taskObj)}
          />
        )}

        {currentTab === "chat" && (
          <ChatView
            activeWorkspace={activeWorkspace}
            currentUser={currentUser}
            users={users}
          />
        )}

        {currentTab === "ai" && (
          <AIPanel
            activeWorkspace={activeWorkspace}
          />
        )}

        {currentTab === "settings" && (
          <WorkspaceSettings
            activeWorkspace={activeWorkspace}
            onUpdateWorkspace={handleUpdateWorkspace}
            onInviteMember={handleInviteMember}
            onRemoveMember={handleRemoveMember}
            currentUser={currentUser}
          />
        )}
      </div>

      {/* =====================================================================
          OVERLAY DIALOGS AND POPUP FORMS
          ===================================================================== */}

      {/* Task detail drawer modal views */}
      {selectedTaskDetails && (
        <TaskDetailsModal
          task={selectedTaskDetails}
          onClose={() => setSelectedTaskDetails(null)}
          users={users}
          currentUser={currentUser}
          onUpdateTask={handleUpdateTaskAttributes}
          onDeleteTask={handleDeleteTask}
          activeWorkspaceId={activeWorkspace?._id || "w1"}
        />
      )}

      {/* DIALOG 1: Create Workspace */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs" id="modal-create-workspace">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 bg-slate-50 p-3 rounded-xl">
              <span className="font-mono text-xs text-indigo-700 font-bold uppercase tracking-wider">Initialize Workspace</span>
              <button onClick={() => setShowWorkspaceModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateWorkspaceSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">Company Workspace Name</label>
                <input
                  type="text"
                  required
                  placeholder="Acme Product Delivery"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">Workspace Target Summary</label>
                <textarea
                  placeholder="Primary objective goals logs block..."
                  value={newWorkspaceDesc}
                  onChange={(e) => setNewWorkspaceDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs min-h-[80px]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow cursor-pointer transition"
              >
                Create Workspace Unit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG 2: Create Project */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs" id="modal-create-project">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 bg-slate-50 p-3 rounded-xl">
              <span className="font-mono text-xs text-indigo-700 font-bold uppercase tracking-wider">Initialize Project Roadmap</span>
              <button onClick={() => setShowProjectModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">Roadmap Name</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Security Audit Phase 1"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">Project Intent summary</label>
                <textarea
                  placeholder="Write specifications or epic metrics..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs min-h-[80px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">Sprint Deadline</label>
                  <input
                    type="date"
                    required
                    value={newProjectDeadline}
                    onChange={(e) => setNewProjectDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">Roadmap Status</label>
                  <select
                    value={newProjectStatus}
                    onChange={(e) => setNewProjectStatus(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs cursor-pointer"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow cursor-pointer transition"
              >
                Create Project Roadmap
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DIALOG 3: Create Task card */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs" id="modal-create-task">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 border border-slate-200 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4 bg-slate-50 p-3 rounded-xl">
              <span className="font-mono text-xs text-indigo-700 font-bold uppercase tracking-wider">Initialize Task Card</span>
              <button onClick={() => setShowTaskModal(false)} className="p-1 rounded-full text-slate-400 hover:bg-slate-100 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">Task Card Title</label>
                <input
                  type="text"
                  required
                  placeholder="E.g. Build backend verification headers"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">Description Description</label>
                <textarea
                  placeholder="Task specifications..."
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs min-h-[80px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">Priority Weight</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs cursor-pointer"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">Target Deadline</label>
                  <input
                    type="date"
                    required
                    value={newTaskDeadline}
                    onChange={(e) => setNewTaskDeadline(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs cursor-pointer"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">Assign Teammate</label>
                  <select
                    value={newTaskAssigneeId}
                    onChange={(e) => setNewTaskAssigneeId(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs cursor-pointer"
                  >
                    <option value="">Unassigned</option>
                    {users.map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">Pill Labels (comma separated)</label>
                  <input
                    type="text"
                    placeholder="E.g. Frontend, Component, Security"
                    value={newTaskLabelString}
                    onChange={(e) => setNewTaskLabelString(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow cursor-pointer transition animate-pulse"
              >
                Assemble Task Card
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

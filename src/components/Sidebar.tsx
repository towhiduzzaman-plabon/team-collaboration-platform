import { 
  Columns, 
  LayoutDashboard, 
  MessageSquare, 
  Sparkles, 
  Settings, 
  Layers, 
  Bell, 
  LogOut, 
  Plus, 
  ChevronDown,
  UserCheck2,
  X
} from "lucide-react";
import { Workspace, User } from "../types";
import { useState } from "react";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (w: Workspace) => void;
  currentUser: User | null;
  onLogout: () => void;
  onOpenNewWorkspaceModal: () => void;
  notificationsCount: number;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  currentTab,
  setCurrentTab,
  workspaces,
  activeWorkspace,
  setActiveWorkspace,
  currentUser,
  onLogout,
  onOpenNewWorkspaceModal,
  notificationsCount,
  isMobileOpen = false,
  onMobileClose
}: SidebarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "kanban", label: "Kanban Board", icon: Columns },
    { id: "chat", label: "Team Chat", icon: MessageSquare },
    { id: "ai", label: "AI Assistant", icon: Sparkles },
    { id: "settings", label: "Workspace Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={onMobileClose}
          id="sidebar-mobile-backdrop"
        />
      )}

      <div 
        className={`w-64 bg-slate-900 text-slate-100 flex flex-col border-r border-slate-800 h-screen select-none shrink-0 fixed inset-y-0 left-0 z-40 lg:relative transition-transform duration-300 transform ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`} 
        id="app-sidebar"
      >
        {/* Brand Header with dynamic badge */}
        <div className="p-6 pb-4 border-b border-slate-800 flex items-center justify-between" id="sidebar-header">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 ai-gradient rounded-lg flex items-center justify-center shadow-md shadow-indigo-500/15 shrink-0">
              <span className="text-white font-extrabold text-base">C</span>
            </div>
            <div>
              <span className="font-sans font-bold text-sm text-white tracking-tight leading-none block">
                CollabSaaS AI
              </span>
              <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase font-bold mt-1 block">Enterprise Platform</span>
            </div>
          </div>

          {/* Close button inside sidebar on mobile screens */}
          {onMobileClose && (
            <button 
              onClick={onMobileClose} 
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              id="btn-close-sidebar-mobile"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

      {/* Workspace Selector */}
      <div className="px-4 py-3 relative" id="workspace-selector-container">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition duration-150 text-left cursor-pointer"
          id="workspace-dropdown-trigger"
        >
          <div className="overflow-hidden">
            <p className="text-xxs text-indigo-400 font-mono font-medium uppercase tracking-wider">Active Workspace</p>
            <p className="text-sm font-semibold text-slate-100 truncate">
              {activeWorkspace?.name || "No active workspace"}
            </p>
          </div>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute left-4 right-4 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 p-1" id="workspace-dropdown-menu">
            <p className="text-xxs font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">Switch Workspaces</p>
            <div className="space-y-1 max-h-40 overflow-y-auto mt-1 pr-1 scrollbar-thin">
              {workspaces.map((w) => (
                <button
                  key={w._id}
                  onClick={() => {
                    setActiveWorkspace(w);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded text-xs truncate transition cursor-pointer flex items-center justify-between ${
                    activeWorkspace?._id === w._id
                      ? "bg-indigo-600 text-white font-medium"
                      : "text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <span>{w.name}</span>
                  {activeWorkspace?._id === w._id && <span className="h-1.5 w-1.5 bg-white rounded-full"></span>}
                </button>
              ))}
            </div>
            <div className="border-t border-slate-700 mt-2 pt-1">
              <button
                onClick={() => {
                  onOpenNewWorkspaceModal();
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center justify-center gap-1.5 p-2 text-xs text-indigo-400 hover:text-white hover:bg-slate-700 rounded transition font-medium cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto" id="sidebar-nav">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2 mt-2 px-3">Main Menu</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition cursor-pointer ${
                isActive
                  ? "bg-indigo-500/10 text-indigo-400 font-semibold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
              id={`nav-link-${item.id}`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
              <span>{item.label}</span>
              {item.id === "dashboard" && notificationsCount > 0 && (
                <span className="ml-auto bg-rose-500 text-white text-xxs font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                  {notificationsCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session Profile Footing */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40" id="sidebar-profile-footer">
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces"}
            alt="User avatar"
            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0"
            referrerPolicy="no-referrer"
          />
          <div className="overflow-hidden min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-100 truncate">{currentUser?.name || "Guest User"}</h4>
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center px-1.5 py-0.2 bg-indigo-500/10 text-indigo-400 text-xxs font-semibold rounded font-mono uppercase tracking-wider">
                <UserCheck2 className="h-2.5 w-2.5 mr-0.5" />
                {currentUser?.role || "Member"}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="mt-4 w-full flex items-center justify-center gap-2 py-2 border border-slate-800 bg-slate-900 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-slate-800 hover:border-rose-500/20 transition cursor-pointer"
          id="btn-logout-sidebar"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Exit Account</span>
        </button>
      </div>
    </div>
  </>
  );
}

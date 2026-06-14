import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from "recharts";
import { 
  Project, 
  Task, 
  ActivityLog, 
  Notification, 
  DashboardStats 
} from "../types";
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  FileSpreadsheet, 
  History, 
  BellRing,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Sparkles
} from "lucide-react";

interface DashboardViewProps {
  stats: DashboardStats;
  projects: Project[];
  tasks: Task[];
  activities: ActivityLog[];
  notifications: Notification[];
  onMarkNotificationRead: (id: string) => void;
  activeWorkspaceName: string;
}

export default function DashboardView({
  stats,
  projects,
  tasks,
  activities,
  notifications,
  onMarkNotificationRead,
  activeWorkspaceName
}: DashboardViewProps) {
  // Calculated Completion Rate
  const total = stats.totalTasks;
  const completed = stats.completedTasks;
  const rate = total ? Math.round((completed / total) * 100) : 0;

  // Prepare Pie Chart data for Task Status distributions
  const statusData = [
    { name: "Done", value: completed, color: "#10b981" },
    { name: "In Review", value: stats.reviewTasks, color: "#f59e0b" },
    { name: "In Progress", value: stats.inProgressTasks, color: "#6366f1" },
    { name: "Todo", value: Math.max(0, stats.totalTasks - completed - stats.reviewTasks - stats.inProgressTasks), color: "#64748b" }
  ].filter(item => item.value > 0);

  // Fallback if statusData is completely empty
  const statusChartData = statusData.length > 0 ? statusData : [{ name: "No Tasks", value: 1, color: "#334155" }];

  // Prepare Bar Chart data for Priority distribution
  const priorityData = [
    { name: "Low", Count: stats.priorityLow, color: "#94a3b8" },
    { name: "Medium", Count: stats.priorityMedium, color: "#38bdf8" },
    { name: "High", Count: stats.priorityHigh, color: "#f59e0b" },
    { name: "Urgent", Count: stats.priorityUrgent, color: "#f43f5e" }
  ];

  // Helper date formatter
  const formatTime = (isoString?: string) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " - " + date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50 min-h-screen" id="dashboard-view">
      {/* Header banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8" id="dashboard-header-container">
        <div>
          <h1 className="text-2xl font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Workspace Intelligence
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Operational speed and delivery metrics for <strong className="text-indigo-600 font-semibold">{activeWorkspaceName}</strong>.
          </p>
        </div>
        <div className="px-3.5 py-1.5 bg-slate-900 text-white font-mono text-xs rounded-lg shadow-sm border border-slate-800 flex items-center gap-2" id="live-indicator-tag">
          <span className="h-2 w-2 bg-emerald-400 rounded-full animate-pulse"></span>
          <span>System Synchronization Live</span>
        </div>
      </div>

      {/* Primary KPI Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" id="dashboard-stats-grid">
        {/* KPI: Projects */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow transition duration-150" id="card-stats-projects">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-mono font-bold">Total Projects</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{stats.totalProjects}</h3>
            </div>
            <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
          </div>
          <div className="text-slate-500 text-xs flex items-center gap-1.5 font-medium">
            <span className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded font-bold font-mono">
              {projects.filter(p => p.status === "Active").length} Active
            </span>
            <span>ongoing delivery roadmaps</span>
          </div>
        </div>

        {/* KPI: Tasks Completion */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow transition duration-150" id="card-stats-tasks">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-mono font-bold">Done / Pending</p>
              <h3 className="text-3xl font-extrabold text-slate-800 mt-1">
                {stats.completedTasks} <span className="text-slate-400 text-xl font-medium">/ {stats.pendingTasks}</span>
              </h3>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <div>
            <div className="w-full bg-slate-100 rounded-full h-2 mb-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500" 
                style={{ width: `${rate}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-slate-500 text-xs font-semibold">
              <span>{rate}% Completion Velocity</span>
              <span className="text-slate-400 font-medium">{stats.totalTasks} total</span>
            </div>
          </div>
        </div>

        {/* KPI: Critical Hazards */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow transition duration-150" id="card-stats-urgent">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-mono font-bold">Urgent Tasks</p>
              <h3 className="text-3xl font-extrabold text-rose-600 mt-1">{stats.priorityUrgent}</h3>
            </div>
            <div className="p-2.5 bg-rose-50 rounded-lg text-rose-600">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          <div className="text-slate-500 text-xs flex items-center gap-1 font-medium">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span>Blocking items active</span>
          </div>
        </div>

        {/* KPI: Waiting Review */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm hover:shadow transition duration-150" id="card-stats-review">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-mono font-bold">Pending Review</p>
              <h3 className="text-3xl font-extrabold text-amber-600 mt-1">{stats.reviewTasks}</h3>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="text-slate-500 text-xs flex items-center gap-1.5 font-medium">
            <span className="bg-amber-100/60 text-amber-800 px-1 py-0.5 rounded font-mono font-bold">
              Verification Node
            </span>
            <span>Awaiting administrator audit</span>
          </div>
        </div>
      </div>

      {/* Visual Charts Layout (Bento style grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8" id="dashboard-charts-layout">
        {/* Status distribution Pie */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm lg:col-span-4 flex flex-col h-80" id="panel-chart-status">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 font-mono text-slate-500">
            Task Status Proportion
          </h4>
          <div className="flex-1 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Priority distribution Bar */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm lg:col-span-5 flex flex-col h-80" id="panel-chart-priority">
          <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 font-mono text-slate-500">
            Task Priority Volume
          </h4>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="Count" radius={[4, 4, 0, 0]}>
                  {priorityData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Assistant Insights Banner */}
        <div className="ai-gradient p-6 rounded-xl text-white shadow-lg relative overflow-hidden flex flex-col justify-between h-80 lg:col-span-3" id="panel-dashboard-ai-insights">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-2 relative z-10">
            <Sparkles className="h-5 w-5 text-indigo-100 animate-pulse" />
            <span className="font-bold text-xs uppercase tracking-wider text-white font-sans">AI Workspace Audit</span>
          </div>
          <div className="bg-white/10 rounded-lg p-3 border border-white/15 relative z-10 my-3 flex-1 overflow-y-auto min-h-0">
            <div className="text-[10px] opacity-80 uppercase tracking-wider mb-2 font-mono font-bold">Recommended Actions</div>
            <ul className="text-[11px] space-y-1.5 opacity-90 font-medium list-disc list-inside">
              <li>Define MERN indices</li>
              <li>Rotate workspace JWT</li>
              <li>Secure container ports</li>
              <li>Prune stagnant cards</li>
            </ul>
          </div>
          <div className="relative z-10 shrink-0">
            <div className="text-[9px] opacity-70 text-right font-mono font-semibold">Empowered by Gemini 2.5</div>
          </div>
        </div>
      </div>

      {/* Activities and Notifications List Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-notifications-and-activities">
        {/* Activity Feed Column */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col h-96" id="panel-activity-log">
          <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100" id="activity-header">
            <History className="h-5 w-5 text-indigo-500" />
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider font-mono">
              Live Team Activity Log
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin" id="activity-list">
            {activities.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10 font-medium">No actions registered in this workspace yet.</p>
            ) : (
              activities.map((act) => (
                <div key={act._id} className="flex gap-3 text-xs leading-relaxed" id={`activity-node-${act._id}`}>
                  <div className="flex flex-col items-center">
                    <span className="h-2 w-2 bg-indigo-500 rounded-full ring-4 ring-indigo-50 shrink-0"></span>
                    <span className="w-0.5 bg-slate-200 flex-1 self-stretch my-1"></span>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between font-semibold text-slate-700">
                      <span className="hover:text-indigo-600 transition truncate">{act.userName}</span>
                      <span className="text-slate-400 font-mono text-[10px] whitespace-nowrap">{formatTime(act.createdAt)}</span>
                    </div>
                    <p className="text-indigo-600 font-mono text-[11px] uppercase tracking-wider mt-0.5">{act.action}</p>
                    <p className="text-slate-500 text-xs mt-1 font-medium bg-slate-50 p-2 border border-slate-100 rounded-lg">{act.details}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Actionable Notification list */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col h-96" id="panel-notifications-center">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100" id="notifications-header">
            <div className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-rose-500" />
              <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider font-mono">
                My Notifications Center
              </h3>
            </div>
            {notifications.filter(n => !n.isRead).length > 0 && (
              <span className="bg-rose-100 text-rose-700 font-bold px-2.5 py-0.5 text-xxs rounded-full font-mono">
                {notifications.filter(n => !n.isRead).length} New
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin" id="notifications-list">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10 font-medium">No alerts received.</p>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif._id} 
                  className={`p-3 rounded-lg border flex gap-3 group items-start transition ${
                    notif.isRead 
                      ? "bg-slate-50 border-slate-100 text-slate-500" 
                      : "bg-indigo-50/20 border-indigo-100 text-slate-800"
                  }`}
                  id={`notification-node-${notif._id}`}
                >
                  <div className="mt-0.5">
                    {notif.type === "Task" && <CheckCircle className="h-4 w-4 text-indigo-500" />}
                    {notif.type === "Workspace" && <HelpCircle className="h-4 w-4 text-emerald-500" />}
                    {notif.type === "Comment" && <AlertCircle className="h-4 w-4 text-amber-500" />}
                    {notif.type === "System" && <BellRing className="h-4 w-4 text-rose-500" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate leading-snug">{notif.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                    <span className="text-slate-400 font-mono text-[9px] mt-1.5 block">{formatTime(notif.createdAt)}</span>
                  </div>
                  {!notif.isRead && (
                    <button
                      onClick={() => onMarkNotificationRead(notif._id)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider border rounded-lg transition opacity-100 md:opacity-0 group-hover:opacity-100 shrink-0 cursor-pointer shadow-sm"
                      id={`btn-read-notification-${notif._id}`}
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

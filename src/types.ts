export interface User {
  _id: string;
  email: string;
  name: string;
  role: "Owner" | "Admin" | "Manager" | "Member";
  avatar: string;
  isVerified?: boolean;
}

export interface WorkspaceMember {
  userId: string;
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Manager" | "Member";
}

export interface Workspace {
  _id: string;
  name: string;
  description: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt?: string;
}

export interface Project {
  _id: string;
  workspaceId: string;
  name: string;
  description: string;
  status: "Planning" | "Active" | "Review" | "Completed";
  deadline: string;
  members: string[]; // User IDs
  createdAt?: string;
}

export interface Subtask {
  id: string;
  title: string;
  isDone: boolean;
}

export interface Attachment {
  name: string;
  size: string;
  url: string;
}

export interface Task {
  _id: string;
  projectId: string;
  workspaceId: string;
  title: string;
  description: string;
  status: "Todo" | "In Progress" | "Review" | "Done";
  priority: "Low" | "Medium" | "High" | "Urgent";
  assigneeId: string | null;
  deadline: string;
  labels: string[];
  attachments: Attachment[];
  subtasks: Subtask[];
  createdAt?: string;
}

export interface Reaction {
  emoji: string;
  count: number;
  users: string[]; // User IDs
}

export interface Comment {
  _id: string;
  taskId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  reactions: Reaction[];
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "System" | "Task" | "Workspace" | "Comment";
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  _id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  createdAt: string;
}

export interface ChatMessage {
  _id: string;
  workspaceId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  reviewTasks: number;
  inProgressTasks: number;
  priorityUrgent: number;
  priorityHigh: number;
  priorityMedium: number;
  priorityLow: number;
}

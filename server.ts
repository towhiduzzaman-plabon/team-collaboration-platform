import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db.js";
import {
  getAiTaskBreakdown,
  getAiDeadlineSuggestion,
  getAiMeetingSummary,
  getAiProductivityAnalysis,
  getAiProgressReport
} from "./server/gemini.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Parse incoming JSON body and form parameters
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Helper helper to generate activities
  async function logActivity(workspaceId: string, userId: string, userName: string, action: string, details: string) {
    try {
      await db.collection("activityLogs").insertOne({
        workspaceId,
        userId,
        userName,
        action,
        details,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Failed to log activity:", err);
    }
  }

  // =========================================================================
  // AUTH API
  // =========================================================================

  app.post("/api/auth/register", async (req, res) => {
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }

    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "A user with this email already exists." });
    }

    const newUser = {
      email,
      name,
      role: role || "Member", // Owner, Admin, Manager, Member
      avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?w=100&h=100&fit=crop&crop=faces`,
      isVerified: true
    };

    const result = await db.collection("users").insertOne(newUser);
    const userWithId = { ...newUser, _id: result.insertedId };

    // Register also creates a default workspace for them
    const newWorkspace = {
      name: `${name}'s Workspace`,
      description: "Default collaborative space created automatically on registration.",
      ownerId: userWithId._id,
      members: [
        { userId: userWithId._id, name: userWithId.name, email: userWithId.email, role: userWithId.role }
      ]
    };
    const workspaceResult = await db.collection("workspaces").insertOne(newWorkspace);

    // Initial project and activities
    const initProject = {
      workspaceId: workspaceResult.insertedId,
      name: "Product Development Sprint 1",
      description: "Initial sprint tasks to implement high-impact system flows, database caching, and standard layouts.",
      status: "Active",
      deadline: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split("T")[0],
      members: [userWithId._id]
    };
    await db.collection("projects").insertOne(initProject);

    await logActivity(workspaceResult.insertedId, userWithId._id, userWithId.name, "Workspace Created", `Registered workspace ${newWorkspace.name}`);

    res.status(201).json({
      message: "Registration successful",
      user: userWithId,
      token: "mock-jwt-access-token-jwt-" + userWithId._id,
      refreshToken: "mock-refresh-token-" + Math.random().toString(36).substring(2)
    });
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password, name, avatar } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    // Direct mock lookup
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      // Create user on the fly if testing with new credentials to make developer testing ultra-smooth
      const formattedName = name || (email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1));
      const newUser = {
        email,
        name: formattedName,
        role: "Member",
        avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces",
        isVerified: true
      };
      const result = await db.collection("users").insertOne(newUser);
      const userWithId = { ...newUser, _id: result.insertedId };

      return res.status(200).json({
        user: userWithId,
        token: "mock-jwt-access-token-jwt-" + userWithId._id,
        refreshToken: "mock-refresh-token-" + Math.random().toString(36).substring(2)
      });
    }

    res.status(200).json({
      user,
      token: "mock-jwt-access-token-jwt-" + user._id,
      refreshToken: "mock-refresh-token-" + Math.random().toString(36).substring(2)
    });
  });

  app.post("/api/auth/logout", (req, res) => {
    res.status(200).json({ status: "success", message: "Successfully logged out." });
  });

  app.get("/api/users", async (req, res) => {
    const usersList = await db.collection("users").find({}).toArray();
    res.json(usersList);
  });

  // =========================================================================
  // WORKSPACE API
  // =========================================================================

  app.get("/api/workspaces", async (req, res) => {
    const list = await db.collection("workspaces").find({}).toArray();
    res.json(list);
  });

  app.post("/api/workspaces", async (req, res) => {
    const { name, description, ownerId, ownerName, ownerEmail, ownerRole } = req.body;
    if (!name) return res.status(400).json({ error: "Workspace name is required." });

    const workspace = {
      name,
      description: description || "",
      ownerId: ownerId || "u1",
      members: [
        {
          userId: ownerId || "u1",
          name: ownerName || "Towhiduzzaman PLabon",
          email: ownerEmail || "owner@company.com",
          role: ownerRole || "Owner"
        }
      ]
    };

    const result = await db.collection("workspaces").insertOne(workspace);
    const wWithId = { ...workspace, _id: result.insertedId };

    await logActivity(wWithId._id, ownerId || "u1", ownerName || "Towhiduzzaman PLabon", "Workspace Created", `Created workspace '${name}'`);

    res.status(201).json(wWithId);
  });

  app.put("/api/workspaces/:id", async (req, res) => {
    const { id } = req.params;
    const { name, description, members } = req.body;

    const op = await db.collection("workspaces").updateOne({ _id: id }, { $set: { name, description, members } });
    if (op.matchedCount === 0) return res.status(404).json({ error: "Workspace not found." });

    res.json({ status: "success", message: "Workspace updated successfully." });
  });

  app.delete("/api/workspaces/:id", async (req, res) => {
    const { id } = req.params;
    const op = await db.collection("workspaces").deleteOne({ _id: id });
    if (op.deletedCount === 0) return res.status(404).json({ error: "Workspace not found." });

    // Clean linked projects
    await db.collection("projects").deleteMany({ workspaceId: id });
    await db.collection("tasks").deleteMany({ workspaceId: id });

    res.json({ status: "success", message: "Workspace deleted." });
  });

  app.post("/api/workspaces/:id/invite", async (req, res) => {
    const { id } = req.params;
    const { email, role, name } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required to invite member." });

    const workspace = await db.collection("workspaces").findOne({ _id: id });
    if (!workspace) return res.status(404).json({ error: "Workspace not found." });

    // Match or generate user on the fly
    let user = await db.collection("users").findOne({ email });
    if (!user) {
      const fallbackName = name || email.split("@")[0].charAt(0).toUpperCase() + email.split("@")[0].slice(1);
      const newUser = {
        email,
        name: fallbackName,
        role: role || "Member",
        avatar: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 999999)}?w=100&h=100&fit=crop&crop=faces`,
        isVerified: true
      };
      const result = await db.collection("users").insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }

    // Check if membership already exists
    const exists = (workspace.members || []).some((m: any) => m.userId === user._id || m.email === email);
    if (exists) {
      return res.status(400).json({ error: "User is already a member of this workspace." });
    }

    const updatedMembers = [...(workspace.members || []), {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: role || "Member"
    }];

    await db.collection("workspaces").updateOne({ _id: id }, { $set: { members: updatedMembers } });

    // Create system notification for invited user
    await db.collection("notifications").insertOne({
      userId: user._id,
      title: "Workspace Invitation",
      message: `You have been added to the workspace '${workspace.name}' as a ${role || "Member"}.`,
      type: "Workspace",
      isRead: false,
      createdAt: new Date().toISOString()
    });

    await logActivity(id, "system", "System Action", "Member Invited", `Invited ${user.name} (${email}) as ${role || "Member"}`);

    res.json({ status: "success", member: { userId: user._id, name: user.name, email: user.email, role: role || "Member" } });
  });

  app.delete("/api/workspaces/:id/members/:userId", async (req, res) => {
    const { id, userId } = req.params;
    const workspace = await db.collection("workspaces").findOne({ _id: id });
    if (!workspace) return res.status(404).json({ error: "Workspace not found." });

    const updatedMembers = (workspace.members || []).filter((m: any) => m.userId !== userId);
    await db.collection("workspaces").updateOne({ _id: id }, { $set: { members: updatedMembers } });

    await logActivity(id, "system", "System Action", "Member Removed", `Removed user ID ${userId} from workspace`);

    res.json({ status: "success", message: "Member removed." });
  });

  // =========================================================================
  // PROJECT API
  // =========================================================================

  app.get("/api/projects", async (req, res) => {
    const { workspaceId } = req.query;
    const filter = workspaceId ? { workspaceId } : {};
    const projectsList = await db.collection("projects").find(filter).toArray();
    res.json(projectsList);
  });

  app.post("/api/projects", async (req, res) => {
    const { name, description, workspaceId, deadline, status, members } = req.body;
    if (!name || !workspaceId) {
      return res.status(400).json({ error: "Project name and workspaceId are required." });
    }

    const newProj = {
      workspaceId,
      name,
      description: description || "",
      status: status || "Planning", // Planning, Active, Review, Completed
      deadline: deadline || "",
      members: members || ["u1"],
      createdAt: new Date().toISOString()
    };

    const result = await db.collection("projects").insertOne(newProj);
    const pWithId = { ...newProj, _id: result.insertedId };

    await logActivity(workspaceId, "system", "System Action", "Project Created", `Created active project '${name}'`);

    res.status(201).json(pWithId);
  });

  app.put("/api/projects/:id", async (req, res) => {
    const { id } = req.params;
    const { name, description, status, deadline, members } = req.body;

    const op = await db.collection("projects").updateOne({ _id: id }, { $set: { name, description, status, deadline, members } });
    if (op.matchedCount === 0) return res.status(404).json({ error: "Project not found." });

    res.json({ status: "success", message: "Project updated." });
  });

  app.delete("/api/projects/:id", async (req, res) => {
    const { id } = req.params;
    const project = await db.collection("projects").findOne({ _id: id });
    if (!project) return res.status(404).json({ error: "Project not found." });

    await db.collection("projects").deleteOne({ _id: id });
    // Cleanup tasks under project name
    await db.collection("tasks").deleteMany({ projectId: id });

    res.json({ status: "success", message: "Project and underlying tasks deleted successfully." });
  });

  // =========================================================================
  // TASK API
  // =========================================================================

  app.get("/api/tasks", async (req, res) => {
    try {
      const { workspaceId, projectId } = req.query;
      const filter: any = {};
      if (workspaceId) filter.workspaceId = workspaceId;
      if (projectId) filter.projectId = projectId;

      const tasksList = await db.collection("tasks").find(filter).toArray();
      res.json(tasksList);
    } catch (err: any) {
      console.error("Error in GET /api/tasks:", err);
      res.status(500).json([]);
    }
  });

  app.post("/api/tasks", async (req, res) => {
    const { title, description, projectId, workspaceId, status, priority, assigneeId, deadline, labels, attachments, subtasks } = req.body;
    if (!title || !projectId || !workspaceId) {
      return res.status(400).json({ error: "Title, projectId, and workspaceId are required." });
    }

    const newTask = {
      title,
      description: description || "",
      projectId,
      workspaceId,
      status: status || "Todo", // Todo, In Progress, Review, Done
      priority: priority || "Medium", // Low, Medium, High, Urgent
      assigneeId: assigneeId || null,
      deadline: deadline || "",
      labels: labels || [],
      attachments: attachments || [],
      subtasks: subtasks || [],
      createdAt: new Date().toISOString()
    };

    const result = await db.collection("tasks").insertOne(newTask);
    const tWithId = { ...newTask, _id: result.insertedId };

    // Emit notification to assigned user if assignee works
    if (assigneeId) {
      await db.collection("notifications").insertOne({
        userId: assigneeId,
        title: "Task Assigned",
        message: `You have been assigned to task: '${title}'.`,
        type: "Task",
        isRead: false,
        createdAt: new Date().toISOString()
      });
    }

    await logActivity(workspaceId, "system", "System Action", "Task Created", `Created task: '${title}'`);

    res.status(201).json(tWithId);
  });

  app.put("/api/tasks/:id", async (req, res) => {
    const { id } = req.params;
    const updatePayload = { ...req.body };
    delete updatePayload._id; // prevent rewriting ID

    const original = await db.collection("tasks").findOne({ _id: id });
    const op = await db.collection("tasks").updateOne({ _id: id }, { $set: updatePayload });

    if (op.matchedCount === 0) return res.status(404).json({ error: "Task not found." });

    if (original && updatePayload.status && original.status !== updatePayload.status) {
      await logActivity(
        original.workspaceId,
        "system",
        "System Action",
        "Task Updated",
        `Changed task '${original.title}' status from ${original.status} to ${updatePayload.status}`
      );
    }

    res.json({ status: "success", message: "Task updated." });
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    const { id } = req.params;
    const task = await db.collection("tasks").findOne({ _id: id });
    if (!task) return res.status(404).json({ error: "Task not found." });

    await db.collection("tasks").deleteOne({ _id: id });
    await db.collection("comments").deleteMany({ taskId: id });

    await logActivity(task.workspaceId, "system", "System Action", "Task Deleted", `Deleted task: '${task.title}'`);

    res.json({ status: "success", message: "Task successfully deleted." });
  });

  // =========================================================================
  // COMMENT SYSTEM API
  // =========================================================================

  app.get("/api/comments/:taskId", async (req, res) => {
    const { taskId } = req.params;
    const commentsList = await db.collection("comments").find({ taskId }).toArray();
    res.json(commentsList);
  });

  app.post("/api/comments", async (req, res) => {
    const { taskId, userId, userName, userAvatar, content, workspaceId } = req.body;
    if (!taskId || !content) {
      return res.status(400).json({ error: "Task ID and comment content are required." });
    }

    const comment = {
      taskId,
      userId: userId || "u1",
      userName: userName || "Towhiduzzaman PLabon",
      userAvatar: userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
      content,
      reactions: [],
      createdAt: new Date().toISOString()
    };

    const result = await db.collection("comments").insertOne(comment);
    const commentWithId = { ...comment, _id: result.insertedId };

    // Handle user mentions (e.g., @Sarah Chen)
    if (content.includes("@")) {
      const match = content.match(/@([a-zA-Z\s]+)/);
      if (match && match[1]) {
        const namePart = match[1].trim();
        const users = await db.collection("users").find({}).toArray();
        const mentioned = users.find((u: any) => u.name.toLowerCase().includes(namePart.toLowerCase()));
        if (mentioned) {
          await db.collection("notifications").insertOne({
            userId: mentioned._id,
            title: "Comment Mention",
            message: `${userName || "Towhiduzzaman PLabon"} mentioned you in a comment on task.`,
            type: "Comment",
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }
      }
    }

    if (workspaceId) {
      await logActivity(workspaceId, userId || "u1", userName || "Towhiduzzaman PLabon", "Comment Added", `Added comment to is: '${content.substring(0, 30)}...'`);
    }

    res.status(201).json(commentWithId);
  });

  app.post("/api/comments/:id/react", async (req, res) => {
    const { id } = req.params;
    const { emoji, userId } = req.body;
    if (!emoji || !userId) return res.status(400).json({ error: "Emoji and userId are required." });

    const comment = await db.collection("comments").findOne({ _id: id });
    if (!comment) return res.status(404).json({ error: "Comment not found." });

    const reactions = comment.reactions || [];
    const index = reactions.findIndex((r: any) => r.emoji === emoji);

    if (index !== -1) {
      const usersSet = new Set(reactions[index].users || []);
      if (usersSet.has(userId)) {
        usersSet.delete(userId);
      } else {
        usersSet.add(userId);
      }
      reactions[index].users = Array.from(usersSet);
      reactions[index].count = reactions[index].users.length;
    } else {
      reactions.push({
        emoji,
        count: 1,
        users: [userId]
      });
    }

    // Filter out reactions with zero users
    const filtered = reactions.filter((r: any) => r.count > 0);

    await db.collection("comments").updateOne({ _id: id }, { $set: { reactions: filtered } });
    res.json({ status: "success", reactions: filtered });
  });

  // =========================================================================
  // NOTIFICATION SYSTEM API
  // =========================================================================

  app.get("/api/notifications", async (req, res) => {
    try {
      const { userId } = req.query;
      const filter = userId ? { userId } : {};
      const notificationList = await db.collection("notifications").find(filter).sort({ createdAt: -1 }).toArray();
      res.json(notificationList);
    } catch (err: any) {
      console.error("Error in GET /api/notifications:", err);
      res.status(500).json([]);
    }
  });

  app.post("/api/notifications/:id/read", async (req, res) => {
    const { id } = req.params;
    const op = await db.collection("notifications").updateOne({ _id: id }, { $set: { isRead: true } });
    if (op.matchedCount === 0) return res.status(404).json({ error: "Notification not found." });

    res.json({ status: "success" });
  });

  // =========================================================================
  // TEAM CHAT API
  // =========================================================================

  app.get("/api/messages", async (req, res) => {
    const { workspaceId } = req.query;
    if (!workspaceId) return res.status(400).json({ error: "workspaceId parameter required." });

    const list = await db.collection("messages").find({ workspaceId }).toArray();
    res.json(list);
  });

  app.post("/api/messages", async (req, res) => {
    const { workspaceId, userId, userName, userAvatar, content } = req.body;
    if (!workspaceId || !content) return res.status(400).json({ error: "Content and workspace ID are required." });

    const message = {
      workspaceId,
      userId: userId || "u1",
      userName: userName || "Towhiduzzaman PLabon",
      userAvatar: userAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
      content,
      createdAt: new Date().toISOString()
    };

    const result = await db.collection("messages").insertOne(message);
    const mWithId = { ...message, _id: result.insertedId };

    res.status(201).json(mWithId);
  });

  // =========================================================================
  // ACTIVITY LOGS API
  // =========================================================================

  app.get("/api/activities", async (req, res) => {
    try {
      const { workspaceId } = req.query;
      const filter = workspaceId ? { workspaceId } : {};
      const list = await db.collection("activityLogs").find(filter).sort({ createdAt: -1 }).toArray();
      res.json(list);
    } catch (err: any) {
      console.error("Error in GET /api/activities:", err);
      res.status(500).json([]);
    }
  });

  // =========================================================================
  // ANALYTICS & DASHBOARD API
  // =========================================================================

  app.get("/api/dashboard", async (req, res) => {
    try {
      const { workspaceId } = req.query;
      if (!workspaceId) return res.status(400).json({ error: "workspaceId parameter required for analytics metrics." });

      const projectsList = await db.collection("projects").find({ workspaceId }).toArray();
      const tasksList = await db.collection("tasks").find({ workspaceId }).toArray();

      const stats = {
        totalProjects: projectsList.length,
        totalTasks: tasksList.length,
        completedTasks: tasksList.filter(t => t.status === "Done").length,
        pendingTasks: tasksList.filter(t => t.status !== "Done").length,
        reviewTasks: tasksList.filter(t => t.status === "Review").length,
        inProgressTasks: tasksList.filter(t => t.status === "In Progress").length,
        priorityUrgent: tasksList.filter(t => t.priority === "Urgent").length,
        priorityHigh: tasksList.filter(t => t.priority === "High").length,
        priorityMedium: tasksList.filter(t => t.priority === "Medium").length,
        priorityLow: tasksList.filter(t => t.priority === "Low").length,
      };

      res.json(stats);
    } catch (err: any) {
      console.error("Error in GET /api/dashboard:", err);
      res.status(500).json({
        totalProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        reviewTasks: 0,
        inProgressTasks: 0,
        priorityUrgent: 0,
        priorityHigh: 0,
        priorityMedium: 0,
        priorityLow: 0,
      });
    }
  });

  // =========================================================================
  // GEMINI AI INTEGRATION API (Task Breakdown, Suggest Deadline, summary sync)
  // =========================================================================

  app.post("/api/ai/task-breakdown", async (req, res) => {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: "A clear task title is required for AI Breakdown." });

    try {
      const subtasks = await getAiTaskBreakdown(title, description || "");
      res.json({ subtasks });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "AI task breakdown generation failed." });
    }
  });

  app.post("/api/ai/deadline-suggestion", async (req, res) => {
    const { title, priority, labels } = req.body;
    if (!title) return res.status(400).json({ error: "Task Title is required." });

    try {
      const suggestion = await getAiDeadlineSuggestion(title, priority || "Medium", labels || []);
      res.json(suggestion);
    } catch (err: any) {
      res.status(500).json({ error: err.message || "AI deadline suggestion failure." });
    }
  });

  app.post("/api/ai/meeting-notes", async (req, res) => {
    const { notes } = req.body;
    if (!notes) return res.status(400).json({ error: "Unstructured Action notes are required for AI Summary generation." });

    try {
      const summary = await getAiMeetingSummary(notes);
      res.json({ summary });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "AI summary generation failed." });
    }
  });

  app.post("/api/ai/productivity", async (req, res) => {
    const { workspaceId } = req.body;
    if (!workspaceId) return res.status(400).json({ error: "Workspace ID is required for AI appraisal." });

    try {
      const tasksList = await db.collection("tasks").find({ workspaceId }).toArray();
      const analysis = await getAiProductivityAnalysis(tasksList);
      res.json({ analysis });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "AI productivity appraisal failed." });
    }
  });

  app.post("/api/ai/report", async (req, res) => {
    const { workspaceId } = req.body;
    if (!workspaceId) return res.status(400).json({ error: "workspaceId context is required for executive progresses." });

    try {
      const projects = await db.collection("projects").find({ workspaceId }).toArray();
      const tasks = await db.collection("tasks").find({ workspaceId }).toArray();
      const activities = await db.collection("activityLogs").find({ workspaceId }).sort({ createdAt: -1 }).toArray();

      const report = await getAiProgressReport(projects, tasks, activities);
      res.json({ report });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "AI Executive Summary failed." });
    }
  });


  // =========================================================================
  // CLIENT ROUTING & ASSET SERVING (Nginx/Vite Middleware integration)
  // =========================================================================

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    // Serving built front-end scripts static structure cleanly
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server successfully running at http://localhost:${PORT}`);
    console.log(`Port ingress routed through standard nginx fallback systems.`);
  });
}

startServer().catch((error) => {
  console.error("Critical error starting Express custom server:", error);
});

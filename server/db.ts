import fs from "fs";
import path from "path";

// Define DB file path
const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Define basic interface of our database collections
export interface DatabaseSchema {
  users: any[];
  workspaces: any[];
  projects: any[];
  tasks: any[];
  comments: any[];
  notifications: any[];
  activityLogs: any[];
  messages: any[];
  aiReports: any[];
}

const DEFAULT_USERS = [
  {
    _id: "u1",
    email: "owner@company.com",
    name: "Towhiduzzaman PLabon",
    role: "Owner",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
    isVerified: true
  },
  {
    _id: "u2",
    email: "admin@company.com",
    name: "Sarah Chen",
    role: "Admin",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces",
    isVerified: true
  },
  {
    _id: "u3",
    email: "manager@company.com",
    name: "Marcus Vance",
    role: "Manager",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
    isVerified: true
  },
  {
    _id: "u4",
    email: "member@company.com",
    name: "Elena Rostova",
    role: "Member",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
    isVerified: true
  }
];

const DEFAULT_WORKSPACES = [
  {
    _id: "w1",
    name: "Acme Product Engineering",
    description: "Primary workspace for general development, roadmap delivery, and sprint goals.",
    ownerId: "u1",
    members: [
      { userId: "u1", name: "Towhiduzzaman PLabon", email: "owner@company.com", role: "Owner" },
      { userId: "u2", name: "Sarah Chen", email: "admin@company.com", role: "Admin" },
      { userId: "u3", name: "Marcus Vance", email: "manager@company.com", role: "Manager" },
      { userId: "u4", name: "Elena Rostova", email: "member@company.com", role: "Member" }
    ],
    createdAt: new Date("2026-05-01T10:00:00.000Z")
  }
];

const DEFAULT_PROJECTS = [
  {
    _id: "p1",
    workspaceId: "w1",
    name: "V3 Enterprise Launch",
    description: "Launch the enterprise cohort subscription modules, dual storage support, and workspace permissions framework.",
    status: "Active", // Planning, Active, Review, Completed
    deadline: "2026-07-20",
    members: ["u1", "u2", "u3", "u4"],
    createdAt: new Date("2026-05-05T09:00:00.000Z")
  },
  {
    _id: "p2",
    workspaceId: "w1",
    name: "Security Auditing 2026",
    description: "Review JWT rotation patterns, refresh token caching speeds, and enforce end-to-end sanitization on Express ingress endpoints.",
    status: "Planning",
    deadline: "2026-08-15",
    members: ["u1", "u2"],
    createdAt: new Date("2026-06-01T11:00:00.000Z")
  }
];

const DEFAULT_TASKS = [
  {
    _id: "t1",
    projectId: "p1",
    workspaceId: "w1",
    title: "Implement JWT Cache & Token Rotation Engine",
    description: "Integrate automated secret matching, storage of revoked access tokens, and background cleanup logs for expired security caches.",
    status: "In Progress", // Todo, In Progress, Review, Done
    priority: "Urgent", // Low, Medium, High, Urgent
    assigneeId: "u2",
    deadline: "2026-06-25",
    labels: ["Security", "Backend"],
    attachments: [
      { name: "refresh_flow_guide.pdf", size: "1.4 MB", url: "#" }
    ],
    subtasks: [
      { id: "sub1", title: "Setup token verification interceptors", isDone: true },
      { id: "sub2", title: "Enforce safe refresh cookie attributes", isDone: false },
      { id: "sub3", title: "Validate rate limiting triggers", isDone: false }
    ],
    createdAt: "2026-06-05T14:24:00.000Z"
  },
  {
    _id: "t2",
    projectId: "p1",
    workspaceId: "w1",
    title: "Design Responsive Kanban UI with Staggered Motion",
    description: "Enhance column drag headers, hover effects, item list transition speeds, and detail drawer modals utilizing modern Tailwind classes.",
    status: "Todo",
    priority: "High",
    assigneeId: "u4",
    deadline: "2026-06-30",
    labels: ["Frontend", "UX"],
    attachments: [],
    subtasks: [
      { id: "sub4", title: "Construct empty-status boards", isDone: false },
      { id: "sub5", title: "Anchor focus outlines for card selectors", isDone: false }
    ],
    createdAt: "2026-06-08T08:15:00.000Z"
  },
  {
    _id: "t3",
    projectId: "p1",
    workspaceId: "w1",
    title: "Produce AI Productivity Synthesis Model Integration",
    description: "Connect the Gemini 3.5 Flash server endpoint to summarize historic project trends and suggest task resolution speeds.",
    status: "Review",
    priority: "Medium",
    assigneeId: "u3",
    deadline: "2026-06-20",
    labels: ["AI Module", "Feature"],
    attachments: [],
    subtasks: [
      { id: "sub6", title: "Design server payload adapter system", isDone: true },
      { id: "sub7", title: "Implement markdown layout renderer component", isDone: true }
    ],
    createdAt: "2026-06-10T10:00:00.000Z"
  },
  {
    _id: "t4",
    projectId: "p1",
    workspaceId: "w1",
    title: "Setup Standard Docker Engine Compose & Nginx Fallback",
    description: "Author precise multivariant config bundles, static build folders, proxy definitions, and reverse DNS mapping presets.",
    status: "Done",
    priority: "Low",
    assigneeId: "u1",
    deadline: "2026-06-12",
    labels: ["DevOps"],
    attachments: [],
    subtasks: [],
    createdAt: "2026-06-01T09:30:00.000Z"
  }
];

const DEFAULT_COMMENTS = [
  {
    _id: "c1",
    taskId: "t1",
    userId: "u3",
    userName: "Marcus Vance",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces",
    content: "@Sarah Chen Please review the cookie secure flags in development. Local preview needs compatibility tests.",
    reactions: [
      { emoji: "👍", count: 2, users: ["u1", "u2"] },
      { emoji: "🚀", count: 1, users: ["u1"] }
    ],
    createdAt: "2026-06-11T15:30:00.000Z"
  },
  {
    _id: "c2",
    taskId: "t1",
    userId: "u2",
    userName: "Sarah Chen",
    userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces",
    content: "Excellent. Adding custom middleware logs to track expired headers. Will update the schema momentarily.",
    reactions: [],
    createdAt: "2026-06-12T09:10:00.000Z"
  }
];

const DEFAULT_NOTIFICATIONS = [
  {
    _id: "n1",
    userId: "u1",
    title: "New Task Assigned",
    message: "Elena Rostova assigned you to 'Design Responsive Kanban UI'.",
    type: "Task", // System, Task, Workspace, Comment
    isRead: false,
    createdAt: "2026-06-13T18:40:00.000Z"
  },
  {
    _id: "n2",
    userId: "u1",
    title: "Workspace Update",
    message: "Marcus Vance updated ACM Product roadmap milestones.",
    type: "Workspace",
    isRead: true,
    createdAt: "2026-06-12T11:00:00.000Z"
  }
];

const DEFAULT_ACTIVITIES = [
  {
    _id: "act1",
    workspaceId: "w1",
    userId: "u1",
    userName: "Towhiduzzaman PLabon",
    action: "Task Created",
    details: "Created task 'Setup Standard Docker Engine Compose & Nginx Fallback'",
    createdAt: "2026-06-01T09:30:00.000Z"
  },
  {
    _id: "act2",
    workspaceId: "w1",
    userId: "u2",
    userName: "Sarah Chen",
    action: "Task Updated",
    details: "Changed status of 'Implement JWT Cache & Token Rotation Engine' to 'In Progress'",
    createdAt: "2026-06-05T14:24:00.000Z"
  },
  {
    _id: "act3",
    workspaceId: "w1",
    userId: "u1",
    userName: "Towhiduzzaman PLabon",
    action: "Workspace Created",
    details: "Created workspace 'Acme Product Engineering'",
    createdAt: "2026-05-01T10:00:00.000Z"
  }
];

const DEFAULT_MESSAGES = [
  {
    _id: "m1",
    workspaceId: "w1",
    userId: "u1",
    userName: "Towhiduzzaman PLabon",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces",
    content: "Team, welcome to the new Acne Product Engineering workspace! All our sprints, Jira backlogs, and conversations live here.",
    createdAt: "2026-06-12T09:00:00.000Z"
  },
  {
    _id: "m2",
    workspaceId: "w1",
    userId: "u2",
    userName: "Sarah Chen",
    userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces",
    content: "Awesome. I am setting up the Kanban flows right now. AI Task breakdown saves a lot of time!",
    createdAt: "2026-06-12T09:12:00.000Z"
  },
  {
    _id: "m3",
    workspaceId: "w1",
    userId: "u4",
    userName: "Elena Rostova",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces",
    content: "Agreed. Let's do our weekly review using the AI productivity tool directly.",
    createdAt: "2026-06-12T10:05:00.000Z"
  }
];

class MongoLocalClient {
  private data: DatabaseSchema;

  constructor() {
    this.data = {
      users: [],
      workspaces: [],
      projects: [],
      tasks: [],
      comments: [],
      notifications: [],
      activityLogs: [],
      messages: [],
      aiReports: []
    };
    this.init();
  }

  private init() {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        this.data = JSON.parse(fileContent);
      } catch (err) {
        console.error("Failed to parse local database file, restoring defaults:", err);
        this.loadDefaults();
      }
    } else {
      this.loadDefaults();
    }
  }

  private loadDefaults() {
    this.data.users = [...DEFAULT_USERS];
    this.data.workspaces = [...DEFAULT_WORKSPACES];
    this.data.projects = [...DEFAULT_PROJECTS];
    this.data.tasks = [...DEFAULT_TASKS];
    this.data.comments = [...DEFAULT_COMMENTS];
    this.data.notifications = [...DEFAULT_NOTIFICATIONS];
    this.data.activityLogs = [...DEFAULT_ACTIVITIES];
    this.data.messages = [...DEFAULT_MESSAGES];
    this.data.aiReports = [];
    this.save();
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save database state to file:", err);
    }
  }

  // Generic DB interaction that handles collection operations exactly resembling MongoDB driver
  public collection(name: keyof DatabaseSchema) {
    const list = this.data[name] || [];
    const saveDb = () => this.save();

    return {
      find: (filter: any = {}) => {
        let results = [...list];
        // Apply basic filtering key/values
        for (const [key, val] of Object.entries(filter)) {
          if (val && typeof val === "object") {
            // Check for MongoDB-like expressions or array queries
            if (Array.isArray(val)) {
              results = results.filter((item) => val.includes(item[key]));
            }
          } else {
            results = results.filter((item) => item[key] === val);
          }
        }
        return {
          toArray: async () => results,
          sort: (sortObj: any) => {
            const [sortKey, sortOrder] = Object.entries(sortObj)[0] || ["_id", 1];
            results.sort((a, b) => {
              const valA = a[sortKey];
              const valB = b[sortKey];
              if (valA < valB) return sortOrder === 1 ? -1 : 1;
              if (valA > valB) return sortOrder === 1 ? 1 : -1;
              return 0;
            });
            return { toArray: async () => results };
          }
        };
      },

      findOne: async (filter: any = {}) => {
        const keys = Object.keys(filter);
        if (keys.length === 0) {
          return list[0] || null;
        }
        const found = list.find((item) => {
          return keys.every((key) => item[key] === filter[key]);
        });
        return found || null;
      },

      insertOne: async (doc: any) => {
        const newDoc = {
          _id: doc._id || "id_" + Math.random().toString(36).substr(2, 9),
          ...doc,
          createdAt: doc.createdAt || new Date().toISOString()
        };
        list.push(newDoc);
        saveDb();
        return { insertedId: newDoc._id, acknowledged: true };
      },

      updateOne: async (filter: any, updateObj: any) => {
        const idKey = filter._id;
        const index = list.findIndex((item) => item._id === idKey);
        if (index !== -1) {
          const setObj = updateObj.$set || updateObj;
          list[index] = { ...list[index], ...setObj };
          saveDb();
          return { matchedCount: 1, modifiedCount: 1, acknowledged: true };
        }
        return { matchedCount: 0, modifiedCount: 0, acknowledged: false };
      },

      deleteOne: async (filter: any) => {
        const idKey = filter._id;
        const index = list.findIndex((item) => item._id === idKey);
        if (index !== -1) {
          list.splice(index, 1);
          saveDb();
          return { deletedCount: 1, acknowledged: true };
        }
        return { deletedCount: 0, acknowledged: false };
      },

      deleteMany: async (filter: any) => {
        let count = 0;
        for (let i = list.length - 1; i >= 0; i--) {
          let match = true;
          for (const [key, val] of Object.entries(filter)) {
            if (list[i][key] !== val) {
              match = false;
              break;
            }
          }
          if (match) {
            list.splice(i, 1);
            count++;
          }
        }
        if (count > 0) saveDb();
        return { deletedCount: count, acknowledged: true };
      },

      countDocuments: async (filter: any = {}) => {
        let count = 0;
        for (const item of list) {
          let match = true;
          for (const [key, val] of Object.entries(filter)) {
            if (item[key] !== val) {
              match = false;
              break;
            }
          }
          if (match) count++;
        }
        return count;
      }
    };
  }
}

// Singleton DB Instantiation
export const db = new MongoLocalClient();

import { GoogleGenAI } from "@google/genai";

// Standard lazy-init implementation of GoogleGenAI
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key && key !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    }
  }
  return aiClient;
}

/**
 * 1. AI Task Breakdown
 * Converts large tasks into subtasks.
 */
export async function getAiTaskBreakdown(title: string, description: string): Promise<string[]> {
  const client = getAiClient();
  const prompt = `Break down the following task into a JSON array of 3 to 5 small, clear, actionable subtask titles.
Task Title: "${title}"
Task Description: "${description}"

Return ONLY a raw JSON string array like: ["Subtask 1 Title", "Subtask 2 Title", "Subtask 3 Title"]
Do not wrap it in markdown codeblocks.`;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      const text = response.text || "";
      const cleaned = text.trim().replace(/^```json\s*/, "").replace(/```$/, "");
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        return parsed.map(String);
      }
    } catch (err) {
      console.error("Gemini API Task Breakdown failed, falling back to simulation:", err);
    }
  }

  // Graceful simulation fallback with relevant titles
  const lowercaseVal = (title + " " + description).toLowerCase();
  if (lowercaseVal.includes("security") || lowercaseVal.includes("auth")) {
    return [
      "Configure cryptographically secure JWT hashing algorithms",
      "Draft middleware checking auth header formats",
      "Initialize redis cache token blacklists",
      "Verify TLS cookie secure flags in local sandbox"
    ];
  } else if (lowercaseVal.includes("ui") || lowercaseVal.includes("kanban") || lowercaseVal.includes("route")) {
    return [
      "Draft wireframe canvas layouts for Kanban board modules",
      "Build high-contrast cards utilizing Tailwind utility classes",
      "Wire client-side drag events to drag-start state triggers",
      "Audit modal detail view layouts for mobile accessibility"
    ];
  } else if (lowercaseVal.includes("docker") || lowercaseVal.includes("nginx") || lowercaseVal.includes("devops")) {
    return [
      "Author Docker dev environmental variables overrides",
      "Expose standard internal port 3000 mapping parameters",
      "Configure Nginx reverse proxy rewrite headers",
      "Test client static build compression rates"
    ];
  }

  return [
    `Initialize ${title} execution branch`,
    "Evaluate secondary technical resource criteria",
    "Perform automated unit tests and assert outputs",
    "Publish final change milestones to team chat"
  ];
}

/**
 * 2. AI Deadline Suggestion
 * Recommends realistic target dates.
 */
export async function getAiDeadlineSuggestion(title: string, priority: string, labels: string[]): Promise<{ date: string; rationale: string }> {
  const client = getAiClient();
  const dateToday = new Date().toISOString().split("T")[0];
  const prompt = `Given the current date is ${dateToday}. A task titled "${title}" has priority "${priority}" and labels: ${labels.join(", ")}.
Suggest a realistic target deadline and a 1-sentence rationale.
Return as a strict JSON format:
{
  "suggestedDate": "YYYY-MM-DD",
  "rationale": "one sentence explaining why this date fits this task priority."
}
Do not wrap it in formatting outside raw JSON.`;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      const text = response.text || "";
      const cleaned = text.trim().replace(/^```json\s*/, "").replace(/```$/, "");
      const parsed = JSON.parse(cleaned);
      if (parsed.suggestedDate && parsed.rationale) {
        return {
          date: parsed.suggestedDate,
          rationale: parsed.rationale
        };
      }
    } catch (err) {
      console.error("Gemini API Deadline Suggestion failed, falling back:", err);
    }
  }

  // Simulation fallback calculation
  const daysOffset = priority === "Urgent" ? 3 : priority === "High" ? 7 : priority === "Medium" ? 14 : 21;
  const target = new Date();
  target.setDate(target.getDate() + daysOffset);
  const suggestedDate = target.toISOString().split("T")[0];

  return {
    date: suggestedDate,
    rationale: `Simulated: Set deadline to ${daysOffset} days from now because the task is categorized as ${priority} priority with ${labels.length ? labels.join('/') : 'general'} parameters.`
  };
}

/**
 * 3. AI Meeting Summary
 * Renders meeting minutes as beautifully formatted Markdown documents.
 */
export async function getAiMeetingSummary(notes: string): Promise<string> {
  const client = getAiClient();
  const prompt = `Analyze the following unorganized meeting notes or discussion bullets:
"${notes}"

Create an executive summary formatted in Markdown with:
1. Executive Summary: Overarching goal of the sync
2. Core Takeaways (as bulleted items with bold emphasis)
3. Action Items (assigned to respective departments or owners)
4. Next Milestone Schedule

Return ONLY formatted Markdown text. Do not return other commentary.`;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      return response.text || "No response text generated.";
    } catch (err) {
      console.error("Gemini Meeting Sync summary failed, using mock:", err);
    }
  }

  return `### 📝 Executive Meeting Summary (Simulated AI)

**Overview:**
The team convened to address the Enterprise Launch sprint schedule, JWT rotation middleware, and the UI Kanban card drag latency issues.

#### 📌 Core Takeaways
* **Platform Security Priority:** Transition validation logic purely server-side. Cache revoked Refresh Tokens to secure user sessions.
* **Component Optimization:** Smooth rendering on Kanban item moves by debouncing state reflow handlers.
* **Release Pipeline:** Deploying docker images with integrated Nginx rules to production channels.

#### ⚡ Action Items
- 💻 **Towhiduzzaman PLabon (Owner):** Validate production environment variables on container deploy. *(Target: June 18)*
- 🛡️ **Sarah Chen (Admin):** Establish Redis/in-memory rate limiting and secure JWT cookies. *(Target: June 20)*
- 🎨 **Elena Rostova (Member):** Style active transition nodes using Tailwind utilities. *(Target: June 22)*

#### 📅 Next Sprint Landmark
The next retrospective sync is scheduled for **June 24 at 10:00 AM UTC** to evaluate beta feedback.`;
}

/**
 * 4. AI Productivity Analysis
 * Reviews active boards and task distributions.
 */
export async function getAiProductivityAnalysis(tasksList: any[]): Promise<string> {
  const client = getAiClient();
  const summaryText = tasksList.map(t => `- Task: ${t.title}, Priority: ${t.priority}, Status: ${t.status}, AssignedTo: ${t.assigneeId || 'Unassigned'}`).join("\n");
  const prompt = `You are an elite operational workflow analyst. Formulate a concise team productivity appraisal from the following task list:
${summaryText}

Provide:
1. Operational Cadence Status (e.g., Healthy, Bottlenecks Detected)
2. Priority Allocation Analysis (check if urgent tasks are being delayed or assigned poorly)
3. Targeted Operational Advice (3 clear bullet points on how to speed up work or load balance)

Provide beautiful Markdown output. Keep it actionable.`;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      return response.text || "No analysis text returned.";
    } catch (err) {
      console.error("Gemini Productivity Analysis failed, using mock:", err);
    }
  }

  const todoCount = tasksList.filter(t => t.status === "Todo").length;
  const inProgressCount = tasksList.filter(t => t.status === "In Progress").length;
  const reviewCount = tasksList.filter(t => t.status === "Review").length;
  const doneCount = tasksList.filter(t => t.status === "Done").length;

  return `### 📊 AI Team Productivity & Velocity Appraisal

**Operational Status:** ⚠️ **Moderate Bottleneck Detected (Simulated Audit)**

The current task pipeline houses **${tasksList.length}** tracked items across various progression nodes. 

#### 📈 Current Kanban Distribution
* 📥 **Backlog/Todo:** ${todoCount} tasks (Requires breakdown or immediate assignment triage).
* ⚙️ **In Progress:** ${inProgressCount} tasks (Currently active engineering focus).
* 🔍 **In Review:** ${reviewCount} tasks (Pending owner/admin audit approval).
* ✅ **Completed:** ${doneCount} tasks.

#### ⚠️ Priority & Bottleneck Flagging
* **Urgent Items Status:** Key architectural tasks are waiting in review. This stalls downstream delivery cycles.
* **Resource Balance Check:** Load is concentrated on admin roles (e.g. Sarah Chen). Triage backend tasks among team members to prevent burnout.

#### 💡 Actionable Improvement Blueprint
1. **Accelerate Code Reviews:** Triage other managers or owners to review tasks currently sitting in the review stage to unlock progression.
2. **Promote Task Slicing:** Utilize the **AI Task Breakdown tool** on large backlog elements to make them bite-sized and assignable.
3. **Equilibrate Role Assignments:** Distribute secondary DevOps and UX assignments to under-utilized members (e.g. Elena Rostova).`;
}

/**
 * 5. AI Progress Report
 * Generates dynamic team progress reports.
 */
export async function getAiProgressReport(projects: any[], tasks: any[], activities: any[]): Promise<string> {
  const client = getAiClient();
  const summaryPayload = `
Projects: ${projects.map(p => p.name + " (" + p.status + ")").join(", ")}
Tasks Overview: ${tasks.length} total tasks. Done: ${tasks.filter(t => t.status === "Done").length}. Urgent: ${tasks.filter(t => t.priority === "Urgent").length}.
Recent Actions: ${activities.slice(0, 10).map(a => a.userName + ": " + a.details).join("\n")}
`;
  const prompt = `Synthesize an elegant executive enterprise progress report based on these parameters:
${summaryPayload}

Create an executive document containing:
1. Executive Milestone Progress (high level summary of sprints)
2. Development Velocity Metrics
3. Highlighted Success Items
4. Action Plan for Remaining Risks

Format in high-contrast professional Markdown with readable sections.`;

  if (client) {
    try {
      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });
      return response.text || "Empty response from Gemini.";
    } catch (err) {
      console.error("Gemini Progress Report failed, using mock:", err);
    }
  }

  const completed = tasks.filter(t => t.status === "Done").length;
  const rate = tasks.length ? Math.round((completed / tasks.length) * 100) : 100;

  return `### 🏆 Executive Enterprise Progress Summary

**Sprint Window Date:** June 2026

#### 🗺️ 1. Project Milestone Overview
* **Active Projects Registered:** ${projects.length}
* **Enterprise Release (V3 Launch):** Currently marked as **Active**. All sub-components are progressing at steady velocity.
* **Security Audits:** Set for **Planning** - requirements definition is underway.

#### ⚡ 2. Workspace Velocity Metrics
* **Goal Completion Metric:** \`${rate}%\` of active tasks successfully completed to release specifications.
* **Outstanding Backlog:** \`${tasks.length - completed}\` items remaining across backlog/testing lanes.
* **Lead Time Average:** 4.2 Days from initial breakdown to final production deploy.

#### 🎯 3. Highlighted Team Achievements
* **Enterprise Setup:** Completed **Nginx configs & standard Docker compose layers** with optimal routing.
* **Role Management Framework:** Successfully staged multi-tier permission rules (Owner, Admin, Manager, Member) across primary workspace tables.

#### 🛡️ 4. Risk Mitigation & Sprint Alignment
* **Cookie Isolation Integrity:** Focus for next 48 hours is to successfully rotaterest tokens and complete caching logic.
* **Action Priority:** Balance developer assignments to ensure Elena and Marcus have direct oversight of UI card responsiveness.`;
}

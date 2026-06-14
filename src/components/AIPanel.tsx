import { useState } from "react";
import { 
  Sparkles, 
  Layers, 
  Calendar, 
  FolderDown, 
  HelpCircle,
  FileCheck2,
  Search,
  BookOpen,
  PieChartIcon,
  Activity
} from "lucide-react";
import { Workspace } from "../types";

// Prefer react-markdown as specified in framework section
// We can use standard element-based Markdown viewer or a clean styling block
interface AIPanelProps {
  activeWorkspace: Workspace | null;
}

export default function AIPanel({ activeWorkspace }: AIPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<"breakdown" | "meeting" | "productivity" | "report">("breakdown");

  // Output containers
  const [breakdownOutput, setBreakdownOutput] = useState<string[]>([]);
  const [meetingOutput, setMeetingOutput] = useState("");
  const [productivityOutput, setProductivityOutput] = useState("");
  const [reportOutput, setReportOutput] = useState("");

  // Standard input boxes values
  const [breakdownTitle, setBreakdownTitle] = useState("Implement JWT Token Security and Caching");
  const [breakdownDesc, setBreakdownDesc] = useState("We need to manage refresh token expiration, redis Blacklist queries, and secure HTTP cookies configurations.");
  const [meetingNotes, setMeetingNotes] = useState(`- Discussed Enterprise billing requirements sync with Sarah
- Towhiduzzaman PLabon agrees we must deploy the Docker container to port 3000
- Elena flagged card drag speed latency on low-end browsers
- Need JWT rotation middleware tested before next Friday sync`);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);

  // 1. AI Breakdown dispatcher
  const handleRunBreakdown = async () => {
    if (!breakdownTitle.trim()) return;
    setIsLoading(true);
    setBreakdownOutput([]);
    try {
      const res = await fetch("/api/ai/task-breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: breakdownTitle.trim(), description: breakdownDesc })
      });
      if (res.ok) {
        const data = await res.json();
        setBreakdownOutput(data.subtasks || []);
      }
    } catch (err) {
      console.error("AI breakdown run failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. AI Meeting summarizer
  const handleRunMeetingSummary = async () => {
    if (!meetingNotes.trim()) return;
    setIsLoading(true);
    setMeetingOutput("");
    try {
      const res = await fetch("/api/ai/meeting-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: meetingNotes.trim() })
      });
      if (res.ok) {
        const data = await res.json();
        setMeetingOutput(data.summary || "");
      }
    } catch (err) {
      console.error("AI summary sync failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 3. AI Productivity assessment
  const handleRunProductivity = async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    setProductivityOutput("");
    try {
      const res = await fetch("/api/ai/productivity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: activeWorkspace._id })
      });
      if (res.ok) {
        const data = await res.json();
        setProductivityOutput(data.analysis || "");
      }
    } catch (err) {
      console.error("Productivity dispatch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 4. AI Progress Milestone report
  const handleRunProgressReport = async () => {
    if (!activeWorkspace) return;
    setIsLoading(true);
    setReportOutput("");
    try {
      const res = await fetch("/api/ai/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: activeWorkspace._id })
      });
      if (res.ok) {
        const data = await res.json();
        setReportOutput(data.report || "");
      }
    } catch (err) {
      console.error("Progress report trigger error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50 min-h-screen" id="ai-panel">
      {/* Title banner */}
      <div className="pb-5 border-b border-slate-200 mb-6 shrink-0" id="ai-hub-header">
        <h1 className="text-2xl font-sans font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-indigo-500 animate-pulse" />
          <span>Gemini AI Operations Control</span>
        </h1>
        <p className="text-slate-500 text-xs mt-0.5">
          Execute natural language models, generate checklists, or synthesize team roadmap velocity parameters.
        </p>
      </div>

      {/* Internal navigation nodes */}
      <div className="flex flex-wrap gap-2 mb-6" id="ai-tab-triggers">
        {[
          { id: "breakdown", label: "Checklist Breakdown", icon: Layers },
          { id: "meeting", label: "Meeting Summary", icon: FileCheck2 },
          { id: "productivity", label: "Productivity Appraisal", icon: PieChartIcon },
          { id: "report", label: "Executive Milestones Report", icon: Activity }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as any);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase rounded-lg border transition shadow-xxs cursor-pointer ${
                isSelected 
                  ? "ai-gradient border-transparent text-white shadow-lg shadow-indigo-500/15" 
                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Primary content card boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="ai-engine-split-view">
        {/* Input parameters card */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-fit" id="ai-input-parameters-card">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b pb-2 mb-4">
            Agi-Engine Configuration
          </h3>

          {/* Render inputs dynamically depending on active sub-tab selection */}
          {activeSubTab === "breakdown" && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 select-none block mb-1">Target Task Title</label>
                <input
                  type="text"
                  value={breakdownTitle}
                  onChange={(e) => setBreakdownTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 select-none block mb-1">Extended Goals Brief</label>
                <textarea
                  value={breakdownDesc}
                  onChange={(e) => setBreakdownDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs min-h-[100px] resize-y"
                  placeholder="Insert auxiliary info..."
                />
              </div>
              <button
                onClick={handleRunBreakdown}
                disabled={isLoading}
                className="w-full py-2.5 ai-gradient hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer transition flex items-center justify-center gap-1"
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>{isLoading ? "Analyzing..." : "Decompose Into Steps ⚡"}</span>
              </button>
            </div>
          )}

          {activeSubTab === "meeting" && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 select-none block mb-1">Messy Meeting Bullets</label>
                <textarea
                  value={meetingNotes}
                  onChange={(e) => setMeetingNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs min-h-[160px] resize-y"
                />
              </div>
              <button
                onClick={handleRunMeetingSummary}
                disabled={isLoading}
                className="w-full py-2.5 ai-gradient hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer transition flex items-center justify-center gap-1"
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>{isLoading ? "Synthesizing..." : "Generate Action Minutes 📝"}</span>
              </button>
            </div>
          )}

          {activeSubTab === "productivity" && (
            <div className="space-y-4">
              <p className="text-xxs text-slate-400 leading-relaxed font-semibold bg-slate-50 p-3 rounded-lg border border-slate-100/85">
                Evaluates active database pipelines, looking for role distribution bottlenecks, queue blockages, or stagnant tasks inside review lanes.
              </p>
              <button
                onClick={handleRunProductivity}
                disabled={isLoading}
                className="w-full py-2.5 ai-gradient hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer transition flex items-center justify-center gap-1"
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>{isLoading ? "Auditing logs..." : "Appraise Team Productivity 📊"}</span>
              </button>
            </div>
          )}

          {activeSubTab === "report" && (
            <div className="space-y-4">
              <p className="text-xxs text-slate-400 leading-relaxed font-semibold bg-slate-50 p-3 rounded-lg border border-slate-100/85">
                Calculates complete sprint parameters. Synthesizes task metrics, ongoing development velocity percentages, and lists high-impact risks for owners.
              </p>
              <button
                onClick={handleRunProgressReport}
                disabled={isLoading}
                className="w-full py-2.5 ai-gradient hover:opacity-95 disabled:opacity-50 text-white text-xs font-bold uppercase rounded-lg shadow-sm cursor-pointer transition flex items-center justify-center gap-1"
              >
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>{isLoading ? "Compiling stats..." : "Formulate Executive Report ✍️"}</span>
              </button>
            </div>
          )}
        </div>

        {/* Output visualization viewport */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col h-[520px] shadow-sm overflow-hidden" id="ai-output-viewport-card">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b pb-2 mb-4 select-none flex items-center justify-between shrink-0">
            <span>Model Terminal Output Pane</span>
            <span className="text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded px-1.5 py-0.2 uppercase font-bold tracking-widest leading-none font-mono">
              gemini-3.5-flash
            </span>
          </h3>

          {/* Model display body */}
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin" id="rendered-output-space">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-3" id="viewport-state-loading">
                <Sparkles className="h-10 w-10 text-indigo-500 animate-spin" />
                <p className="text-xs font-mono tracking-widest uppercase">Executing Gemini Model Synapse</p>
                <p className="text-xxs max-w-xs text-center text-slate-400 leading-normal">Parsing JSON buffers, auditing active collections, and drafting Markdown response blocks...</p>
              </div>
            ) : (
              <>
                {/* 1. Checklist Breakdown Output */}
                {activeSubTab === "breakdown" && (
                  <div className="space-y-4" id="view-breakdown-output">
                    {breakdownOutput.length === 0 ? (
                      <div className="text-slate-400 py-16 text-center text-xs">
                        <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <span>Configure and run Decompose above to view step results.</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="font-bold text-slate-800 text-xs font-mono uppercase tracking-wider">Suggested Subtask Milestones</h4>
                        <div className="space-y-2">
                          {breakdownOutput.map((st, i) => (
                            <div key={i} className="flex gap-2 p-3 border border-slate-100 bg-slate-50/70 hover:bg-white rounded-lg transition text-xs font-medium">
                              <span className="text-indigo-600 font-bold font-mono">0{i+1}.</span>
                              <span className="text-slate-700">{st}</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xxs text-slate-400 pt-2 border-t border-slate-100">
                          These steps can be directly auto-applied to checklists in task card detail views.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* 2. Meeting notes output */}
                {activeSubTab === "meeting" && (
                  <div id="view-meeting-output">
                    {!meetingOutput ? (
                      <div className="text-slate-400 py-16 text-center text-xs">
                        <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <span>Awaiting conference sync transcription notes.</span>
                      </div>
                    ) : (
                      <div className="prose max-w-none text-slate-600 text-xs leading-relaxed whitespace-pre-wrap bg-indigo-50/20 border-l-4 border-indigo-600 p-5 rounded-r-xl">
                        {meetingOutput}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Productivity appraisal output */}
                {activeSubTab === "productivity" && (
                  <div id="view-productivity-output">
                    {!productivityOutput ? (
                      <div className="text-slate-400 py-16 text-center text-xs">
                        <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <span>Initiate analysis to trace pipeline blockages.</span>
                      </div>
                    ) : (
                      <div className="prose max-w-none text-slate-600 text-xs leading-relaxed whitespace-pre-wrap bg-amber-50/20 border-l-4 border-amber-500 p-5 rounded-r-xl">
                        {productivityOutput}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Sprint milestone report */}
                {activeSubTab === "report" && (
                  <div id="view-report-output">
                    {!reportOutput ? (
                      <div className="text-slate-400 py-16 text-center text-xs">
                        <BookOpen className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                        <span>Formulate report to generate executive summaries.</span>
                      </div>
                    ) : (
                      <div className="prose max-w-none text-slate-600 text-xs leading-relaxed whitespace-pre-wrap bg-emerald-50/20 border-l-4 border-emerald-500 p-5 rounded-r-xl">
                        {reportOutput}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

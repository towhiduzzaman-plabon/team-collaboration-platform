import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, User, Workspace } from "../types";
import { 
  Send, 
  Users2, 
  Sparkles, 
  MessageSquare, 
  Code2, 
  Terminal,
  Server
} from "lucide-react";

interface ChatViewProps {
  activeWorkspace: Workspace | null;
  currentUser: User | null;
  users: User[];
}

export default function ChatView({
  activeWorkspace,
  currentUser,
  users
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAiResponding, setIsAiResponding] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load initial messages for workspace
  useEffect(() => {
    if (activeWorkspace) {
      fetchMessages();
    }
  }, [activeWorkspace?._id]);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiResponding]);

  const fetchMessages = async () => {
    if (!activeWorkspace) return;
    try {
      const res = await fetch(`/api/messages?workspaceId=${activeWorkspace._id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch timeline messages:", err);
    }
  };

  // Submit new chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !activeWorkspace) return;

    const textPayload = inputValue.trim();
    setInputValue("");

    // 1. Post client message to server database
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: activeWorkspace._id,
          userId: currentUser?._id,
          userName: currentUser?.name,
          userAvatar: currentUser?.avatar,
          content: textPayload
        })
      });

      if (res.ok) {
        // Optimistic refresh
        await fetchMessages();

        // 2. Multi-user simulation: if they didn't chat with ai, trigger simulated team response after a short delay
        if (!textPayload.includes("@ai") && !textPayload.includes("@gemini")) {
          simulateTeamResponse(textPayload);
        } else {
          // Trigger direct AI response
          triggerAiChatResponse(textPayload);
        }
      }
    } catch (err) {
      console.error("Failed to post message:", err);
    }
  };

  // Simulate responses from other team members to create active multiplayer feel
  const simulateTeamResponse = (userMsg: string) => {
    const lowercase = userMsg.toLowerCase();
    let replyText = "";
    let responder: any = null;

    // Pick Sarah Chen or Marcus Vance or Elena Rostova
    if (lowercase.includes("security") || lowercase.includes("jwt") || lowercase.includes("cache") || lowercase.includes("auth")) {
      responder = users.find(u => u.role === "Admin") || users[1];
      replyText = "Understood. I am validating standard cookie secure parameters and JWT token lifetimes in our development sandbox. Rate limit configs are also cached in node memory.";
    } else if (lowercase.includes("ux") || lowercase.includes("css") || lowercase.includes("kanban") || lowercase.includes("board")) {
      responder = users.find(u => u.role === "Member") || users[3];
      replyText = "Agreed! I just polished the Card outlines using high-contrast flex structures. Hover selectors now load with staggered CSS transitions.";
    } else if (lowercase.includes("meeting") || lowercase.includes("sync") || lowercase.includes("sprint") || lowercase.includes("deadline")) {
      responder = users.find(u => u.role === "Manager") || users[2];
      replyText = "Good reminder. Let's run our weekly summary notes directly through the Gemini report generator endpoint. We should lock our milestones for review.";
    } else {
      // Pick random responder
      const teamMates = users.filter(u => u._id !== currentUser?._id);
      if (teamMates.length > 0) {
        responder = teamMates[Math.floor(Math.random() * teamMates.length)];
        replyText = "Understood. I'll update my active tasks list momentarily. Let's keep our velocity green.";
      }
    }

    if (!responder) return;

    setTimeout(async () => {
      try {
        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: activeWorkspace?._id,
            userId: responder._id,
            userName: responder.name,
            userAvatar: responder.avatar,
            content: replyText
          })
        });
        fetchMessages();
      } catch (err) {
        console.error("Multiplayer message simulation failed:", err);
      }
    }, 1500);
  };

  // Trigger Gemini chatbot in Team Channel
  const triggerAiChatResponse = async (userPrompt: string) => {
    setIsAiResponding(true);
    const cleanedPrompt = userPrompt.replace("@ai", "").replace("@gemini", "").trim();

    try {
      const res = await fetch("/api/ai/meeting-notes", { // Use meeting summarizer/chat model fallback safely
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: `Direct channel query from teammate: "${cleanedPrompt}"` })
      });
      if (res.ok) {
        const data = await res.json();
        const aiMessage = {
          workspaceId: activeWorkspace?._id || "w1",
          userId: "u_ai",
          userName: "Gemini AI Co-Pilot",
          userAvatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop",
          content: data.summary || "I am connected and ready. How can I assist with your agile sprint?"
        };

        await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aiMessage)
        });
        fetchMessages();
      }
    } catch (err) {
      console.error("AI chat dispatch error:", err);
    } finally {
      setIsAiResponding(false);
    }
  };

  return (
    <div className="flex-1 overflow-hidden p-4 sm:p-6 md:p-8 bg-slate-50 min-h-screen flex flex-col" id="workspace-chat-pane">
      {/* Thread Header info */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 shrink-0 mb-6" id="chat-overview-bar">
        <div>
          <h1 className="text-xl font-sans font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquare className="h-5.5 w-5.5 text-indigo-500" />
            <span>Multiplayer Team Channel</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Discuss roadmap objectives, ping members, or summon the <strong className="text-indigo-600">@ai</strong> helper directly.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-white border px-3 py-1.5 rounded-lg text-slate-500 text-xxs font-bold uppercase tracking-wider font-mono shadow-sm">
          <Users2 className="h-4.5 w-4.5 text-slate-400" />
          <span>Active Members ({activeWorkspace?.members.length || 0})</span>
        </div>
      </div>

      {/* Main chat window split */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-6 min-h-0" id="chat-split-frame">
        {/* Messages Stream Node */}
        <div className="xl:col-span-3 bg-white border border-slate-200 rounded-2xl flex flex-col min-h-0 shadow-sm" id="messages-stream-box">
          {/* Messages timeline */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin" id="messages-scroller">
            {messages.length === 0 ? (
              <div className="text-center py-24 text-slate-400 text-xs" id="empty-chat-state">
                <Users2 className="h-8 w-8 text-slate-300 mx-auto mb-3 shrink-0" />
                <p className="font-semibold text-slate-600">Welcome to the Workspace Chat!</p>
                <p className="mt-1 text-slate-400">Collaborate with Sarah Chen, Marcus and others here.</p>
              </div>
            ) : (
              messages.map((m) => {
                const isAi = m.userId === "u_ai";
                return (
                  <div key={m._id} className={`flex gap-3 text-xs leading-relaxed max-w-[85%] ${m.userId === currentUser?._id ? "ml-auto flex-row-reverse" : ""}`}>
                    <img
                      src={m.userAvatar}
                      alt="User profile"
                      className="w-8.5 h-8.5 rounded-full object-cover shrink-0 ring-2 ring-slate-100"
                      referrerPolicy="no-referrer"
                    />
                    <div className={`p-4 rounded-xl border shadow-xxs ${
                      isAi 
                        ? "bg-indigo-50/50 border-indigo-100/80 text-slate-800 text-xs font-medium"
                        : m.userId === currentUser?._id
                          ? "bg-indigo-600 border-indigo-500 text-white text-xs"
                          : "bg-slate-50 border-slate-100 text-slate-700"
                    }`}>
                      <div className="flex items-center justify-between gap-6 font-bold pb-1 border-b border-slate-100/10 mb-1">
                        <span className="truncate flex items-center gap-1">
                          {isAi && <Sparkles className="h-3 w-3 text-indigo-500 animate-bounce" />}
                          <span>{m.userName}</span>
                        </span>
                        <span className={`text-[9px] font-mono ${m.userId === currentUser?._id ? "text-indigo-100" : "text-slate-400"}`}>
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed mt-1 text-xs">{m.content}</p>
                    </div>
                  </div>
                );
              })
            )}

            {isAiResponding && (
              <div className="flex gap-3 text-xs leading-relaxed max-w-[80%]">
                <img
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&h=100&fit=crop"
                  className="w-8.5 h-8.5 rounded-full object-cover shrink-0 animate-pulse"
                  alt="AI Co-Pilot Loading"
                  referrerPolicy="no-referrer"
                />
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-slate-500 font-mono text-xxs animate-pulse flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-500 animate-spin" />
                  <span>Gemini analysis pending... drafting code architecture</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat text box input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl shrink-0" id="chat-input-row">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type messages... (Summon AI with @ai or type questions)"
                className="flex-1 px-4.5 py-2.5 bg-white border border-slate-200 focus:outline-none focus:border-indigo-500 hover:border-slate-300 rounded-xl text-xs md:text-xs"
                id="workspace-chat-bar-input"
              />
              <button 
                type="submit"
                className="px-5 ai-gradient hover:opacity-95 text-white font-bold rounded-xl transition cursor-pointer shadow-md shadow-indigo-500/15 flex items-center gap-1 shrink-0 select-none"
              >
                <span>Send</span>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Workspace Active Members Directory Panel */}
        <div className="hidden xl:flex bg-white border border-slate-200 rounded-2xl p-5 flex-col shadow-sm" id="chat-directory-panel">
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b pb-2 mb-4">
            Roster & Activity status
          </h4>
          <div className="space-y-4 flex-1 overflow-y-auto scrollbar-thin" id="team-roster-list">
            {activeWorkspace?.members.map((member, index) => {
              // Map role index
              const isOnline = index !== 3; // Mock Elena offline, others online
              return (
                <div key={index} className="flex items-center gap-2.5 text-xs">
                  <div className="relative shrink-0">
                    <img
                      src={`https://images.unsplash.com/photo-${1500000000000 + (index * 243924)}?w=100&h=100&fit=crop&crop=faces`}
                      className="w-8.5 h-8.5 rounded-full object-cover"
                      alt={member.name}
                      referrerPolicy="no-referrer"
                    />
                    <span className={`absolute bottom-0 right-0 h-2 w-2 border border-white rounded-full ${isOnline ? "bg-emerald-400" : "bg-slate-300"}`}></span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{member.name}</p>
                    <div className="flex gap-1.5 items-center mt-0.5">
                      <span className="text-[9px] text-indigo-600 font-mono font-bold uppercase">{member.role}</span>
                      <span className="text-slate-400 text-[10px]">• {isOnline ? "Active" : "Away"}</span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* AI Assistant Roster Card */}
            <div className="border border-indigo-100 bg-indigo-50/30 p-3 rounded-xl flex items-center gap-2 mt-4" id="ai-co-pilot-roster-card">
              <Sparkles className="h-4.5 w-4.5 text-indigo-500 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-slate-800 text-xs truncate">Gemini Active Co-Pilot</p>
                <p className="text-xxs text-indigo-600 font-semibold font-mono">ONLINE • BOT</p>
              </div>
            </div>
          </div>

          {/* Quick tips display */}
          <div className="bg-slate-50 border p-3 rounded-xl mt-4 shrink-0 text-xxs text-slate-400 leading-relaxed">
            <p className="font-bold text-slate-600 uppercase font-mono mb-1">Developer Notice</p>
            <span>Type <strong>@ai</strong> to summon the Gemini code generator, milestone planner, or security validator directly in the chat line.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { 
  Workspace, 
  WorkspaceMember, 
  User 
} from "../types";
import { 
  Users, 
  UserPlus, 
  Settings2, 
  Mail, 
  Crown, 
  X, 
  Trash2, 
  Briefcase,
  AlertCircle
} from "lucide-react";

interface WorkspaceSettingsProps {
  activeWorkspace: Workspace | null;
  onUpdateWorkspace: (updatedWorkspace: Workspace) => void;
  onInviteMember: (email: string, role: "Owner" | "Admin" | "Manager" | "Member", name: string) => Promise<any>;
  onRemoveMember: (userId: string) => void;
  currentUser: User | null;
}

export default function WorkspaceSettings({
  activeWorkspace,
  onUpdateWorkspace,
  onInviteMember,
  onRemoveMember,
  currentUser
}: WorkspaceSettingsProps) {
  const [name, setName] = useState(activeWorkspace?.name || "");
  const [description, setDescription] = useState(activeWorkspace?.description || "");

  // Invite states
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"Owner" | "Admin" | "Manager" | "Member">("Member");
  const [isInviting, setIsInviting] = useState(false);
  const [feedback, setFeedback] = useState("");

  const isOwnerOrAdmin = currentUser?.role === "Owner" || currentUser?.role === "Admin";

  const handleUpdateGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspace || !name.trim()) return;

    const updated = {
      ...activeWorkspace,
      name: name.trim(),
      description: description.trim()
    };
    onUpdateWorkspace(updated);
    setFeedback("Workspace general parameters updated successfully.");
    setTimeout(() => setFeedback(""), 3000);
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setIsInviting(true);
    setFeedback("");

    try {
      const res = await onInviteMember(inviteEmail.trim(), inviteRole, inviteName.trim());
      if (res && res.status === "success") {
        setFeedback(`Successfully added member (${inviteEmail}).`);
        setInviteEmail("");
        setInviteName("");
      } else {
        setFeedback("Failed to complete workspace invite.");
      }
    } catch (err) {
      setFeedback("Error completing invitation.");
    } finally {
      setIsInviting(false);
      setTimeout(() => setFeedback(""), 4000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-50 min-h-screen" id="workspace-settings-view">
      {/* Title banner */}
      <div className="pb-5 border-b border-slate-200 mb-6 shrink-0" id="settings-view-header">
        <h1 className="text-2xl font-sans font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings2 className="h-6 w-6 text-indigo-500" />
          <span>Workspace Settings & Roster</span>
        </h1>
        <p className="text-slate-500 text-xs mt-0.5">
          Configure project boundaries, administer database permissions, and assign roles for our agile delivery squad.
        </p>
      </div>

      {feedback && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2" id="settings-action-feedback">
          <AlertCircle className="h-4.5 w-4.5 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="settings-grid-frame">
        {/* Left column: Workspace Profile form */}
        <div className="lg:col-span-5 space-y-6" id="settings-left-forms">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="card-general-profile-settings">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b pb-2 mb-4">
              General Parameters
            </h3>
            <form onSubmit={handleUpdateGeneralSettings} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 select-none block mb-1">Workspace Label Name</label>
                <input
                  type="text"
                  disabled={!isOwnerOrAdmin}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-slate-400 select-none block mb-1">Workspace Intent Summary</label>
                <textarea
                  disabled={!isOwnerOrAdmin}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs min-h-[100px] resize-none focus:border-indigo-500 focus:outline-none"
                  placeholder="Summary..."
                />
              </div>

              {isOwnerOrAdmin ? (
                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition cursor-pointer"
                >
                  Save Profile Configuration
                </button>
              ) : (
                <div className="p-3 bg-amber-50 border border-amber-100 rounded-lg text-xxs text-amber-800 leading-normal">
                  ⚠️ Administrative restrictions apply. Only Owners or Admins have credentials to rewrite profile attributes.
                </div>
              )}
            </form>
          </div>

          {/* Invitation setup form */}
          {isOwnerOrAdmin && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="card-invite-members-panel">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b pb-2 mb-4 flex items-center gap-1.5">
                <UserPlus className="h-4.5 w-4.5 text-indigo-500" />
                <span>Invite New Teammates</span>
              </h3>
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 select-none block mb-1">Teammate Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="E.g. Rachel Green"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 select-none block mb-1">E-mail Address</label>
                  <input
                    type="email"
                    required
                    placeholder="rachel@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-xs focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono font-bold uppercase text-slate-400 select-none block mb-1">Access Role Tier</label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="Admin">Admin (Full write configurations)</option>
                    <option value="Manager">Manager (Task creation controls)</option>
                    <option value="Member">Member (General dashboard reading)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isInviting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow transition cursor-pointer"
                  id="btn-submit-invitation"
                >
                  {isInviting ? "Inviting Teammate..." : "Shoot Invitation Alert 📫"}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right column: Active Workspace Roster list */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm" id="card-workspace-roster-list">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-mono border-b pb-2 mb-4 flex items-center justify-between">
            <span>Workspace Teammate Roster ({activeWorkspace?.members.length})</span>
            <Users className="h-4.5 w-4.5 text-slate-400" />
          </h3>

          <div className="space-y-3" id="settings-roster-rows">
            {activeWorkspace?.members.map((member, idx) => (
              <div 
                key={idx} 
                className="flex items-center justify-between p-3.5 border border-slate-100/80 bg-slate-50 rounded-xl hover:bg-white hover:border-slate-200 transition"
                id={`roster-row-${idx}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={`https://images.unsplash.com/photo-${1500000000000 + (idx * 138472)}?w=100&h=100&fit=crop&crop=faces`}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-50"
                      alt={member.name}
                      referrerPolicy="no-referrer"
                    />
                    {member.role === "Owner" && (
                      <span className="absolute -top-1.5 -right-1.5 p-0.5 bg-amber-500 text-white rounded-full">
                        <Crown className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{member.name}</p>
                    <span className="text-[10px] text-slate-400 font-mono select-all font-medium block truncate mt-0.5">{member.email}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xxs font-bold uppercase tracking-wider border font-mono ${
                    member.role === "Owner" ? "bg-amber-100 text-amber-800 border-amber-200" :
                    member.role === "Admin" ? "bg-indigo-100 text-indigo-800 border-indigo-200" :
                    member.role === "Manager" ? "bg-sky-100 text-sky-800 border-sky-200" :
                    "bg-slate-100 text-slate-800 border-slate-200"
                  }`}>
                    {member.role}
                  </span>

                  {/* Disable removing owner or removing self unless owner/admin */}
                  {isOwnerOrAdmin && member.role !== "Owner" && member.userId !== currentUser?._id && (
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${member.name} from workspace? This denies access immediately.`)) {
                          onRemoveMember(member.userId);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 border border-transparent hover:border-rose-100 transition cursor-pointer"
                      title="Remove Member"
                      id={`btn-remove-roster-user-${member.userId}`}
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

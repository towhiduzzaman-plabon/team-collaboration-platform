import React, { useState } from "react";
import { User } from "../types";
import { 
  Lock, 
  Mail, 
  UserPlus, 
  Layers, 
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  HelpCircleIcon
} from "lucide-react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithPopup, 
  GoogleAuthProvider, 
  updateProfile 
} from "firebase/auth";
import { auth } from "../firebase";

interface AuthPageProps {
  onLoginSuccess: (user: User, token: string) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  // Input states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"Owner" | "Admin" | "Manager" | "Member">("Admin");

  // Error/Success state managers
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Quick select badges helper
  const handleQuickLogin = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword("testpass123");
    setErrorMsg("");
    setInfoMsg(`Selected quick-login credentials: ${presetEmail}`);
  };

  const handleGoogleLogin = async () => {
    setErrorMsg("");
    setInfoMsg("");
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const fbUser = userCredential.user;

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email: fbUser.email, 
          password: "firebase-oauth-placeholder",
          name: fbUser.displayName || undefined,
          avatar: fbUser.photoURL || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to sync Google user with database.");
      }

      if (data.user && data.token) {
        onLoginSuccess(data.user, data.token);
      }
    } catch (err: any) {
      console.error("Google Auth error:", err);
      setErrorMsg(err.message || "Google authentication transaction failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");
    setIsLoading(true);

    try {
      if (isForgotPassword) {
        try {
          await sendPasswordResetEmail(auth, email);
          setInfoMsg(`A Firebase verification reset email has been dispatched to "${email}".`);
        } catch (fbErr: any) {
          if (fbErr.code === "auth/operation-not-allowed") {
            setInfoMsg(`A mock verification reset email has been simulated and dispatched to "${email}". (Note: Firebase Email/Password provider is disabled, so a local simulation was completed)`);
          } else {
            throw fbErr;
          }
        }
        setIsForgotPassword(false);
        setIsLoading(false);
        return;
      }

      if (isRegister) {
        // 1. Create user in Firebase auth (graceful if provider is disabled)
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await updateProfile(userCredential.user, { displayName: name });
        } catch (fbErr: any) {
          if (fbErr.code === "auth/operation-not-allowed") {
            console.warn("Firebase Email/Password provider is disabled in the console. Falling back to backend server auth sync.");
            setInfoMsg("Note: Email/Password login is not enabled in your Firebase project. Successfully falling back to local database credentials.");
          } else {
            throw fbErr;
          }
        }

        // 2. Post to API to create DB record & default workspace
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, name, role })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Database registration sync failed.");
        }

        if (data.user && data.token) {
          // Adjust owner name if matching
          if (data.user.email === "owner@company.com" || data.user.name === "Alex Mercer") {
            data.user.name = "Towhiduzzaman PLabon";
          }
          onLoginSuccess(data.user, data.token);
        }
      } else {
        // 1. Sign in via Firebase auth with dynamic self-heal for mock/seed users
        let firebaseAuthSucceeded = false;
        try {
          await signInWithEmailAndPassword(auth, email, password);
          firebaseAuthSucceeded = true;
        } catch (fbErr: any) {
          const isUserNotFound = 
            fbErr.code === "auth/user-not-found" || 
            fbErr.code === "auth/invalid-credential" || 
            fbErr.message?.includes("invalid-credential") || 
            fbErr.message?.includes("user-not-found");
            
          const isOperationNotAllowed = 
            fbErr.code === "auth/operation-not-allowed" || 
            fbErr.message?.includes("operation-not-allowed");

          if (isOperationNotAllowed) {
            console.warn("Firebase Email/Password login disabled. Bypassing Firebase Auth login.");
            setInfoMsg("Note: Email/Password login is not enabled in your Firebase project. Successfully falling back to local database credentials.");
          } else if (isUserNotFound) {
            try {
              // Attempt to login to get server mock data
              const resCheck = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
              });
              const checkData = await resCheck.json();
              
              if (resCheck.ok && checkData.user) {
                // Seed this active user into Firebase Auth database if possible
                try {
                  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                  await updateProfile(userCredential.user, { displayName: checkData.user.name || email.split("@")[0] });
                  firebaseAuthSucceeded = true;
                } catch (seedFbErr: any) {
                  if (seedFbErr.code === "auth/operation-not-allowed") {
                    console.warn("Seeding user into Firebase Auth skipped (Email/Password disabled).");
                  } else {
                    console.error("Firebase auth seeding error:", seedFbErr);
                  }
                }
              } else {
                throw fbErr;
              }
            } catch (seedErr) {
              throw fbErr;
            }
          } else {
            throw fbErr;
          }
        }

        // 2. Post to login endpoint to sync DB user profile
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Database login sync failed.");
        }

        if (data.user && data.token) {
          // Adjust owner name if matching
          if (data.user.email === "owner@company.com" || data.user.name === "Alex Mercer") {
            data.user.name = "Towhiduzzaman PLabon";
          }
          onLoginSuccess(data.user, data.token);
        }
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setErrorMsg(err.message || "Authentication transaction failure.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-slate-100" id="auth-page">
      {/* Brand Header */}
      <div className="mb-8 text-center" id="auth-logo-brand">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 ai-gradient rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/15">
            <span className="text-white font-black text-xl">C</span>
          </div>
          <span className="font-sans font-extrabold text-2xl tracking-tight text-white">
            CollabSaaS AI
          </span>
        </div>
        <p className="text-slate-500 text-[10px] font-mono tracking-widest uppercase font-bold mt-1">MERN Enterprise Teamwork Hub</p>
      </div>

      {/* Main authentication card */}
      <div className="bg-slate-950/40 border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-2xl relative" id="auth-component-card">
        <h2 className="text-xl font-bold font-sans text-slate-100 mb-2">
          {isForgotPassword ? "Retrieve Credentials" : isRegister ? "Build Engineering Workspace" : "Access Platform Core"}
        </h2>
        <p className="text-slate-400 text-xs mb-6 leading-relaxed">
          {isForgotPassword ? "Submit register address to receive a password change link." : isRegister ? "Formulate a MERN squad, select access role badges and deploy cards." : "Login using preset test badges or live Firebase authentication."}
        </p>

        {errorMsg && (
          <p className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold p-3 rounded-xl mb-4" id="auth-error-block">
            {errorMsg}
          </p>
        )}

        {infoMsg && (
          <p className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold p-3 rounded-xl mb-4" id="auth-info-block">
            {infoMsg}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" id="auth-form">
          {isRegister && !isForgotPassword && (
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">Squad Teammate Name</label>
              <input
                type="text"
                required
                placeholder="E.g. Richard Hendricks"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none text-xs rounded-lg px-3 py-2.5 text-slate-100"
              />
            </div>
          )}

          <div>
            <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">E-mail Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                placeholder="developer@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none text-xs rounded-lg pl-10 pr-3 py-2.5 text-slate-100"
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">Security Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none text-xs rounded-lg pl-10 pr-3 py-2.5 text-slate-100"
                />
              </div>
            </div>
          )}

          {isRegister && !isForgotPassword && (
            <div>
              <label className="text-[10px] font-mono font-bold uppercase text-slate-400 block mb-1">RBAC Role Authority</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-indigo-500 outline-none text-xs rounded-lg px-3 py-2.5 text-slate-100 cursor-pointer"
              >
                <option value="Owner">Owner (Can delete whole workspace)</option>
                <option value="Admin">Admin (Full write rights)</option>
                <option value="Manager">Manager (Task creation rights)</option>
                <option value="Member">Member (Read timelines)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 mt-2 ai-gradient hover:opacity-95 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-md shadow-indigo-500/15 flex items-center justify-center gap-1 cursor-pointer"
            id="btn-execute-auth-form"
          >
            <span>{isLoading ? "Executing process..." : isForgotPassword ? "Send Password Recovery" : isRegister ? "Build Identity" : "Launch Engine"}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {!isForgotPassword && (
          <div className="mt-4" id="google-auth-login-wrapper">
            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-slate-800"></div>
              <span className="px-3 text-slate-500 text-xxs uppercase tracking-widest font-mono">or OAuth Identity</span>
              <div className="flex-1 border-t border-slate-800"></div>
            </div>
            <button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleLogin}
              className="w-full py-2.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 disabled:opacity-50 text-slate-100 font-bold text-xs uppercase tracking-wider rounded-lg transition shadow-md flex items-center justify-center gap-2 cursor-pointer"
              id="google-signin-btn-container"
            >
              <svg className="h-4 w-4 text-white shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
              </svg>
              <span>{isLoading ? "Executing..." : "Continue with Google"}</span>
            </button>
          </div>
        )}

        {/* Change auth mode triggers */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between text-xxs text-slate-400" id="auth-mode-triggers">
          {isForgotPassword ? (
            <button onClick={() => setIsForgotPassword(false)} className="hover:text-indigo-400 cursor-pointer text-left font-bold transition">
              ← Return to Login
            </button>
          ) : (
            <>
              <button 
                onClick={() => {
                  setIsRegister(!isRegister);
                  setErrorMsg("");
                  setInfoMsg("");
                }} 
                className="hover:text-indigo-400 cursor-pointer text-left font-bold transition"
              >
                {isRegister ? "Already matching roster? Sign In" : "Is New Hire? Build Workspace Core"}
              </button>
              {!isRegister && (
                <button onClick={() => setIsForgotPassword(true)} className="hover:text-rose-400 cursor-pointer text-right transition">
                  Forgot PIN?
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Preset quick login badges container (developer sandbox ease) */}
      {!isForgotPassword && (
        <div className="mt-8 bg-slate-950/20 border border-slate-800/60 rounded-xl p-5 max-w-sm text-center" id="quick-preset-badges-wrapper">
          <p className="text-xxs font-mono font-bold uppercase text-indigo-400 tracking-wider mb-3">
            Simulate Enterprise RBAC Profiles
          </p>
          <div className="grid grid-cols-2 gap-2" id="quick-badges-grid">
            {[
              { email: "owner@company.com", label: "Owner Profile", r: "Plabon" },
              { email: "admin@company.com", label: "Admin Profile", r: "Sarah" },
              { email: "manager@company.com", label: "Manager Profile", r: "Marcus" },
              { email: "member@company.com", label: "Member Profile", r: "Elena" }
            ].map((preset) => (
              <button
                key={preset.email}
                onClick={() => handleQuickLogin(preset.email)}
                className="p-2 border border-slate-800 hover:border-slate-700 bg-slate-900 rounded-lg text-left transition cursor-pointer hover:bg-slate-800 min-w-0"
                id={`btn-preset-${preset.r.toLowerCase()}`}
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-slate-100 truncate">{preset.label}</p>
                    <p className="text-[9px] text-slate-500 font-mono truncate">{preset.r}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

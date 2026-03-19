"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useMemo, cloneElement, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from 'react-markdown';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import {
  Activity,
  Heart,
  Moon,
  Battery,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  Brain,
  ShieldAlert,
  Zap,
  LayoutDashboard,
  LineChart,
  Search,
  MessageSquare,
  Settings,
  X,
  RefreshCw,
  Mail,
  Lock,
  Key,
} from "lucide-react";
import { HealthMetric, AiInsight, AiExpertInsight } from "@/lib/db";
import { MOCK_METRICS, MOCK_INSIGHTS } from "@/lib/mockData";

interface DashboardClientProps {
  metrics: HealthMetric[];
  insights: AiInsight[];
}

type TabType = "overview" | "analysis" | "trends";
type GarminLoginState = "initial" | "login" | "mfa";

export default function DashboardClient({
  metrics: initialMetrics,
  insights: initialInsights,
}: DashboardClientProps) {
  const [metrics, setMetrics] = useState<HealthMetric[]>(initialMetrics);
  const [insights, setInsights] = useState<AiInsight[]>(initialInsights);
  const [isDemo, setIsDemo] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [showSettings, setShowSettings] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | null>(null);

  // Garmin Login State
  const [garminLoginState, setGarminLoginState] = useState<GarminLoginState>("initial");
  const [garminEmail, setGarminEmail] = useState("");
  const [garminPassword, setGarminPassword] = useState("");
  const [garminMfaCode, setGarminMfaCode] = useState("");
  const [isGarminLoggingIn, setIsGarminLoggingIn] = useState(false);
  const [garminLoginError, setGarminLoginError] = useState<string | null>(null);

  // Use 7-day window for charts
  const chartData = useMemo(() => [...metrics].slice(0, 7).reverse(), [metrics]);

  const latestMetric = metrics[0] || null;
  const latestInsight = insights[0] || null;

  const loadDemoData = () => {
    setMetrics(MOCK_METRICS);
    setInsights(MOCK_INSIGHTS);
    setIsDemo(true);
  };

  const loadLiveData = () => {
    setMetrics(initialMetrics);
    setInsights(initialInsights);
    setIsDemo(false);
  };

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/auth/garmin/status');
        const data = await response.json();
        if (data.success && data.authenticated) {
          setIsAuthenticated(true);
          setAuthenticatedEmail(data.email || "Authenticated");
        }
      } catch (err) {
        console.error("Failed to check Garmin status:", err);
      }
    };
    checkStatus();
  }, []);

  const handleGarminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsGarminLoggingIn(true);
    setGarminLoginError(null);

    try {
      const response = await fetch('/api/auth/garmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: garminEmail,
          password: garminPassword,
          mfaCode: garminMfaCode || undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGarminLoginState("initial");
        setGarminEmail("");
        setGarminPassword("");
        setGarminMfaCode("");
        setIsAuthenticated(true);
        setAuthenticatedEmail(garminEmail || "Connected");
        // After successful login, trigger a sync
        syncGarminData();
      } else if (data.mfa_required) {
        setGarminLoginState("mfa");
        setGarminLoginError(null);
      } else {
        setGarminLoginError(data.error || "Authentication failed");
      }
    } catch (err) {
      setGarminLoginError("Network error occurred");
    } finally {
      setIsGarminLoggingIn(false);
    }
  };

  const syncGarminData = async () => {
    setIsSyncing(true);
    setSyncError(null);
    try {
      const response = await fetch('/api/sync/garmin', {
        method: 'POST',
      });
      const data = await response.json();
      if (data.success) {
        // Refresh the page to show latest data from DB
        window.location.reload();
      } else {
        setSyncError(data.error || 'Failed to sync data');
        setIsSyncing(false);
      }
    } catch (err) {
      setSyncError('Network error occurred during sync');
      setIsSyncing(false);
    }
  };

  // Recovery Architect Data preparation
  const recoveryData = useMemo(() => {
    return chartData.map(d => ({
      date: d.date,
      charge: d.body_battery_charge,
      drain: d.body_battery_drain
    }));
  }, [chartData]);

  return (
    <div className="min-h-screen text-[var(--color-theme-text)] pb-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12 pt-12">
        
        {/* HEADER SECTION */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center pb-8 border-b border-[var(--neu-border)]"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 overflow-hidden">
                <img src="/logo.png" alt="Health Signal Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-2xl md:text-4xl font-black tracking-tight italic px-2 py-1">
                Health<span className="text-gradient pr-1">Signal</span>
              </h1>
            </div>
            <p className="text-[var(--color-theme-muted)] text-sm md:text-md font-medium px-1">
              Multi-Agent Wellness Intelligence Hub
            </p>
          </div>
          
          <div className="mt-6 md:mt-0 flex flex-col items-start md:items-end gap-4">
            <div className="flex flex-col items-start md:items-end">
              <div className="neu-flat px-4 py-1.5 rounded-full flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${isDemo ? 'bg-[var(--color-theme-primary)]' : 'bg-[var(--color-theme-secondary)]'} animate-pulse`} />
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-90">
                  {isDemo ? 'Demo Mode Active' : 'Deep Synthesis Active'}
                </span>
              </div>
              <span className="text-xl font-medium text-[var(--color-theme-text)] opacity-90 pt-2">
                {latestMetric
                  ? new Date(latestMetric.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })
                  : "Awaiting Sync..."}
              </span>
            </div>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                aria-label={showSettings ? "Close Settings" : "Open Settings"}
                aria-expanded={showSettings}
                className="neu-convex p-3 rounded-2xl text-[var(--color-theme-muted)] hover:text-[var(--color-theme-primary)] transition-all duration-300 relative z-50 focus:outline-none"
              >
                {showSettings ? <X className="w-5 h-5" aria-hidden="true" /> : <Settings className="w-5 h-5" aria-hidden="true" />}
              </motion.button>

              <AnimatePresence>
                {showSettings && (
                  <>
                    {/* Backdrop */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => setShowSettings(false)}
                      className="fixed inset-0 z-40"
                    />
                    
                    {/* Popover */}
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-4 w-72 neu-flat rounded-[30px] p-6 z-50 border border-white/20 shadow-2xl overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-theme-primary)]/5 to-transparent opacity-50" />
                      
                      <div className="relative z-10 space-y-6">
                        <div className="flex items-center justify-between pb-3 border-b border-[var(--neu-border)]">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-theme-muted)]">Configuration</span>
                        </div>
                        
                        <div className="space-y-4">
                          {!isDemo ? (
                            <div className="space-y-4">
                              {garminLoginState === "initial" && (
                                <>
                                  <p className="text-[10px] font-bold text-[var(--color-theme-muted)] leading-relaxed italic opacity-70">
                                    Experience the complete insight dashboard by populating simulated biometric data streams or syncing from Garmin.
                                  </p>
                                  
                                  <button
                                    onClick={() => setGarminLoginState("login")}
                                    className="w-full neu-convex px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-theme-secondary)] hover:neu-convex-active transition-all duration-300 flex items-center justify-center gap-2"
                                  >
                                    <Activity className="w-3 h-3" />
                                    <span>Connect Garmin</span>
                                  </button>

                                  <button
                                    onClick={syncGarminData}
                                    disabled={isSyncing}
                                    className="w-full neu-convex px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-theme-secondary)] hover:neu-convex-active transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                                    aria-label={isSyncing ? "Syncing metrics" : "Sync metrics from Garmin"}
                                    aria-busy={isSyncing}
                                  >
                                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">
                                      {isSyncing ? 'Syncing...' : (isAuthenticated ? 'Sync Health Data' : 'Sync Metric')}
                                    </span>
                                  </button>
                                  
                                  {isAuthenticated && (
                                    <div className="flex flex-col items-center gap-1 opacity-60">
                                      <p className="text-[8px] font-bold text-[var(--color-theme-secondary)] italic">
                                        Connected as {authenticatedEmail}
                                      </p>
                                      <button 
                                        onClick={() => setGarminLoginState("login")}
                                        className="text-[7px] font-black uppercase tracking-widest underline hover:text-[var(--color-theme-primary)]"
                                      >
                                        Switch Account
                                      </button>
                                    </div>
                                  )}

                                  {syncError && (
                                    <p className="text-[8px] font-bold text-red-600 italic px-2" role="alert">
                                      Error: {syncError}
                                    </p>
                                  )}
                                </>
                              )}

                              {garminLoginState === "login" && (
                                <form onSubmit={handleGarminLogin} className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl neu-convex-active border border-white/10">
                                      <Mail className="w-3 h-3 text-[var(--color-theme-muted)]" />
                                      <input 
                                        type="email" 
                                        placeholder="Garmin Email"
                                        value={garminEmail}
                                        onChange={(e) => setGarminEmail(e.target.value)}
                                        className="bg-transparent text-[10px] w-full focus:outline-none font-bold"
                                        required
                                      />
                                    </div>
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl neu-convex-active border border-white/10">
                                      <Lock className="w-3 h-3 text-[var(--color-theme-muted)]" />
                                      <input 
                                        type="password" 
                                        placeholder="Password"
                                        value={garminPassword}
                                        onChange={(e) => setGarminPassword(e.target.value)}
                                        className="bg-transparent text-[10px] w-full focus:outline-none font-bold"
                                        required
                                      />
                                    </div>
                                  </div>

                                  {garminLoginError && (
                                    <p className="text-[8px] font-bold text-red-500 italic px-1">{garminLoginError}</p>
                                  )}

                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() => setGarminLoginState("initial")}
                                      className="flex-1 neu-convex py-3 rounded-xl text-[8px] font-black uppercase tracking-widest opacity-60 hover:opacity-100"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="submit"
                                      disabled={isGarminLoggingIn}
                                      className="flex-[2] neu-convex py-3 rounded-xl text-[8px] font-black uppercase tracking-widest text-[var(--color-theme-primary)] disabled:opacity-50"
                                    >
                                      {isGarminLoggingIn ? 'Connecting...' : 'Login'}
                                    </button>
                                  </div>
                                </form>
                              )}

                              {garminLoginState === "mfa" && (
                                <form onSubmit={handleGarminLogin} className="space-y-3 animate-in fade-in slide-in-from-right-2 duration-300">
                                  <div className="space-y-1">
                                    <p className="text-[9px] font-bold text-[var(--color-theme-muted)] italic text-center mb-2">
                                      Enter the code sent to your email
                                    </p>
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl neu-convex-active border border-white/10">
                                      <Key className="w-3 h-3 text-[var(--color-theme-primary)] scale-110" />
                                      <input 
                                        type="text" 
                                        placeholder="MFA Code (e.g. 123456)"
                                        value={garminMfaCode}
                                        onChange={(e) => setGarminMfaCode(e.target.value)}
                                        className="bg-transparent text-[10px] w-full focus:outline-none font-black tracking-[0.5em] text-center"
                                        required
                                        autoFocus
                                      />
                                    </div>
                                  </div>

                                  {garminLoginError && (
                                    <p className="text-[8px] font-bold text-red-500 italic px-1">{garminLoginError}</p>
                                  )}

                                  <button
                                    type="submit"
                                    disabled={isGarminLoggingIn}
                                    className="w-full neu-convex py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[var(--color-theme-secondary)] hover:neu-convex-active disabled:opacity-50 transition-all"
                                  >
                                    {isGarminLoggingIn ? 'Verifying...' : 'Verify Code'}
                                  </button>
                                </form>
                              )}

                              {isDemo ? (
                                <button
                                  onClick={() => {
                                    loadLiveData();
                                    setShowSettings(false);
                                  }}
                                  className="w-full neu-convex px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-theme-secondary)] hover:neu-convex-active transition-all duration-300 border border-[var(--color-theme-secondary)]/20"
                                >
                                  Load Live Data
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    loadDemoData();
                                    setShowSettings(false);
                                  }}
                                  className="w-full neu-convex px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-theme-primary)] hover:neu-convex-active transition-all duration-300"
                                >
                                  Sync Mock Data
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col gap-4 p-4 rounded-2xl neu-convex-active">
                              <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-[var(--color-theme-primary)] animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-theme-primary)] opacity-90">
                                  Demo Active
                                </span>
                              </div>
                              <button
                                onClick={() => {
                                  loadLiveData();
                                  setShowSettings(false);
                                }}
                                className="w-full neu-convex px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest text-[var(--color-theme-secondary)] hover:neu-convex-active transition-all duration-300"
                              >
                                Switch to Live Data
                              </button>
                            </div>
                          )}
                        </div>
                        
                        <div className="pt-2">
                          <div className="text-[8px] font-black text-[var(--color-theme-muted)] uppercase tracking-[0.5em] opacity-60 text-center">
                            Stability Index
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.header>

        {/* TAB CONTENT */}
        <div className="relative overflow-hidden min-h-[600px]">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="space-y-12 pb-12"
              >
                {/* HERO: HEALTH SCORE & KEY METRICS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  {/* Main Score Card */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="lg:col-span-5 neu-flat rounded-[60px] p-12 flex flex-col items-center justify-center relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-theme-primary)]/5 to-transparent opacity-100 group-hover:opacity-40 transition-opacity duration-700" />
                    
                    <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-[var(--color-theme-secondary)] mb-12">
                      Composite Index
                    </h2>
                    
                    <div className="relative">
                      <svg className="w-64 h-64 transform -rotate-90">
                        <circle
                          cx="128" cy="128" r="110"
                          stroke="var(--neu-shadow-light)"
                          strokeWidth="20"
                          fill="transparent"
                        />
                        <motion.circle
                          cx="128" cy="128" r="110"
                          stroke="var(--color-theme-primary)"
                          strokeWidth="20"
                          fill="transparent"
                          strokeDasharray={691} // 2 * pi * 110
                          initial={{ strokeDashoffset: 691 }}
                          animate={{ strokeDashoffset: 691 - (691 * (latestInsight?.health_score || 0)) / 100 }}
                          transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                          strokeLinecap="round"
                          className="drop-shadow-[0_0_15px_rgba(var(--color-theme-primary-rgb),0.3)]"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-8xl font-black tracking-tighter text-[var(--color-theme-text)] italic">
                          {latestInsight?.health_score || "--"}
                        </span>
                        <span className="text-[var(--color-theme-secondary)] text-[9px] font-black tracking-[0.3em] uppercase mt-2">Points</span>
                      </div>
                    </div>

                    <div className="mt-12 flex items-center gap-3 neu-convex-active px-8 py-4 rounded-3xl cursor-default">
                      <Sparkles className="w-5 h-5 text-[var(--color-theme-secondary)]" aria-hidden="true" />
                      <span className="text-xs font-black uppercase tracking-widest text-[var(--color-theme-secondary)]">Stability: High</span>
                    </div>
                  </motion.div>

                  {/* Quick Metrics Grid */}
                  <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <MetricTile
                      label="Heart Rate"
                      value={latestMetric?.resting_heart_rate || "--"}
                      unit="BPM"
                      icon={<Heart className="w-6 h-6" />}
                      color="text-[var(--color-status-danger)]"
                      delay={0.3}
                    />
                    <MetricTile
                      label="Recovery Rank"
                      value={latestMetric?.readiness_score || "--"}
                      unit="/ 100"
                      icon={<Zap className="w-6 h-6" />}
                      color="text-[var(--color-status-warning)]"
                      delay={0.4}
                    />
                    <MetricTile
                      label="Sleep Efficiency"
                      value={latestMetric?.sleep_score || "--"}
                      unit="Points"
                      icon={<Moon className="w-6 h-6" />}
                      color="text-[var(--color-theme-secondary)]"
                      delay={0.5}
                    />
                    <MetricTile
                      label="Metabolic Load"
                      value={latestMetric?.active_calories || 0}
                      unit="kcal"
                      icon={<Activity className="w-6 h-6" />}
                      color="text-[var(--color-theme-primary)]"
                      delay={0.6}
                    />
                  </div>
                </div>

                {/* RECOVERY ARCHITECT CAROUSEL (NEW) */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-black tracking-[0.3em] uppercase text-[var(--color-theme-muted)]">Recovery Symphony</h2>
                    <div className="h-px flex-grow bg-[var(--neu-border)]" />
                  </div>

                  <div className="neu-flat rounded-[50px] p-8 md:p-12 h-[500px] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 space-y-2 text-right">
                      <div className="text-[10px] font-black uppercase tracking-[0.5em] text-[var(--color-theme-muted)] opacity-50">Flux Analysis</div>
                      <div className="text-xs font-black italic text-[var(--color-theme-primary)] uppercase tracking-widest">Charge vs Drain</div>
                    </div>
                    
                    <div className="h-full w-full pt-16 min-h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <div className="sr-only">
                          <h4>Recovery Symphony Data Description</h4>
                          <p>This area chart displays your body battery charge and drain over the last 7 days. Higher charge values indicate better recovery, while higher drain values indicate physical exertion.</p>
                        </div>
                        <AreaChart data={recoveryData}>
                          <defs>
                            <linearGradient id="colorCharge" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-theme-secondary)" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="var(--color-theme-secondary)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorDrain" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--color-theme-primary)" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="var(--color-theme-primary)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--neu-shadow-light)" opacity={0.5} />
                          <XAxis 
                            dataKey="date" 
                            tickFormatter={(str) => str.slice(5, 10)} 
                            stroke="var(--color-theme-muted)" 
                            fontSize={10} 
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                          />
                          <YAxis stroke="var(--color-theme-muted)" fontSize={10} axisLine={false} tickLine={false} dx={-10} />
                          <Tooltip content={<JapandiTooltip />} />
                          <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.2em' }} />
                          <Area 
                            type="monotone" 
                            dataKey="charge" 
                            name="Charge"
                            stroke="var(--color-theme-secondary)" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorCharge)" 
                          />
                          <Area 
                            type="monotone" 
                            dataKey="drain" 
                            name="Drain"
                            stroke="var(--color-theme-primary)" 
                            strokeWidth={4}
                            fillOpacity={1} 
                            fill="url(#colorDrain)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === "analysis" && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="space-y-12 pb-12"
              >
                {/* DEEP SYNTHESIS */}
                <motion.div 
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="neu-flat rounded-[60px] p-10 md:p-16 relative overflow-hidden"
                >
                  <div className="relative z-10 flex flex-col lg:flex-row gap-16">
                    <div className="lg:w-2/3 space-y-10">
                      <div className="flex items-center gap-5 text-[var(--color-theme-secondary)]">
                        <div className="neu-convex p-4 rounded-2xl">
                          <Brain className="w-8 h-8" />
                        </div>
                        <h3 className="text-3xl font-black italic tracking-tight">Synthesis Report</h3>
                      </div>
                      
                      <div className="text-xl md:text-2xl font-bold leading-relaxed text-[var(--color-theme-text)] italic">
                        <ReactMarkdown>{latestInsight?.summary}</ReactMarkdown>
                      </div>
                      
                      <div className="text-[var(--color-theme-muted)] text-lg leading-relaxed font-medium whitespace-pre-line border-l-4 border-[var(--color-theme-primary)]/10 pl-10 markdown-content">
                        <ReactMarkdown>{latestInsight?.synthesis_report}</ReactMarkdown>
                      </div>
                    </div>

                    <div className="lg:w-1/3 neu-convex rounded-[40px] p-10 space-y-10">
                      <div className="flex items-center gap-3 text-[var(--color-theme-primary)]">
                        <Zap className="w-6 h-6" aria-hidden="true" />
                        <h4 className="text-sm font-black tracking-[0.2em] uppercase text-[var(--color-theme-primary)]">Tactical Strategy</h4>
                      </div>
                      
                      <ul className="space-y-8">
                        {latestInsight?.recommendations?.map((rec, i) => (
                          <motion.li 
                            key={i} 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i }}
                            className="flex gap-5 group cursor-default"
                          >
                            <div className="mt-2 w-2 h-2 rounded-full shrink-0 bg-[var(--color-theme-secondary)] neu-convex shadow-[0_0_15px_rgba(var(--color-theme-secondary-rgb),0.5)]" />
                            <span className="text-md text-[var(--color-theme-text)]/90 font-bold group-hover:text-[var(--color-theme-primary)] transition-colors">{rec.replace(/^[-•*]\s*/, '')}</span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>

                {/* WELLNESS GUARDIAN SECTION */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-black tracking-[0.3em] uppercase text-[var(--color-theme-muted)]">Multi-Agent Counsel</h2>
                    <div className="h-px flex-grow bg-[var(--neu-border)]" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {latestInsight?.expert_insights?.map((expert, idx) => (
                      <ExpertCard 
                        key={expert.expert}
                        expert={expert}
                        delay={0.1 * idx}
                      />
                    ))}
                  </div>
                </section>
              </motion.div>
            )}

            {activeTab === "trends" && (
              <motion.div
                key="trends"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.5, ease: "circOut" }}
                className="space-y-12 pb-12"
              >
                {/* TRENDS SECTION */}
                <section className="space-y-8">
                  <div className="flex items-center gap-4">
                    <h2 className="text-sm font-black tracking-[0.3em] uppercase text-[var(--color-theme-muted)]">Signal Trends</h2>
                    <div className="h-px flex-grow bg-[var(--neu-border)]" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <TrendsCard title="Biometric Flow" icon={<Activity aria-hidden="true" />}>
                      <div className="w-full h-[350px]" role="img" aria-label="Area chart showing heart rate trends over the last 7 days">
                        <ResponsiveContainer width="100%" height="100%">
                          <div className="sr-only">
                            <h4>Biometric Flow Data Description</h4>
                            <p>This area chart shows your resting heart rate over the last 7 days. A lower resting heart rate generally indicates better cardiovascular fitness and recovery.</p>
                          </div>
                          <AreaChart data={chartData}>
                            {/* ... defs ... */}
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--neu-shadow-light)" opacity={0.5} />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(str) => str.slice(5, 10)} 
                              stroke="var(--color-theme-muted)" 
                              fontSize={10} 
                              axisLine={false}
                              tickLine={false}
                              dy={10}
                            />
                            <YAxis stroke="var(--color-theme-muted)" fontSize={10} axisLine={false} tickLine={false} dx={-10} />
                            <Tooltip content={<JapandiTooltip />} />
                            <Area 
                              type="monotone" 
                              dataKey="resting_heart_rate" 
                              name="Heart Rate"
                              stroke="var(--color-theme-primary)" 
                              strokeWidth={4}
                              fillOpacity={1} 
                              fill="url(#colorBio)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </TrendsCard>

                    <TrendsCard title="Stress Indices" icon={<Brain aria-hidden="true" />}>
                      <div className="w-full h-[350px]" role="img" aria-label="Bar chart showing average stress levels over the last 7 days">
                        <ResponsiveContainer width="100%" height="100%">
                          <div className="sr-only">
                            <h4>Stress Indices Data Description</h4>
                            <p>This bar chart illustrates your average stress levels over the last 7 days. Lower bars indicate periods of relaxation and recovery, while higher bars reflect physical or mental stress.</p>
                          </div>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--neu-shadow-light)" opacity={0.5} />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(str) => str.slice(5, 10)} 
                              stroke="var(--color-theme-muted)" 
                              fontSize={10} 
                              axisLine={false}
                              tickLine={false}
                              dy={10}
                            />
                            <YAxis stroke="var(--color-theme-muted)" fontSize={10} axisLine={false} tickLine={false} dx={-10} />
                            <Tooltip content={<JapandiTooltip />} />
                            <Bar 
                              dataKey="avg_stress" 
                              name="Stress Level"
                              fill="var(--color-theme-primary)" 
                              radius={[12, 12, 0, 0]} 
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </TrendsCard>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* PERSISTENT TAB NAVIGATION */}
      <div className="fixed bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-fit">
        <nav className="neu-flat rounded-full p-1.5 md:p-2 flex items-center justify-between gap-1 md:gap-2 backdrop-blur-xl border border-white/20 shadow-2xl whitespace-nowrap overflow-x-auto no-scrollbar">
          <TabButton 
            active={activeTab === "overview"} 
            onClick={() => setActiveTab("overview")}
            icon={<LayoutDashboard className="w-5 h-5 sm:w-5 sm:h-5" />}
            label="Home"
          />
          <TabButton 
            active={activeTab === "analysis"} 
            onClick={() => setActiveTab("analysis")}
            icon={<Search className="w-5 h-5 sm:w-5 sm:h-5" />}
            label="Analysis"
          />
          <TabButton 
            active={activeTab === "trends"} 
            onClick={() => setActiveTab("trends")}
            icon={<LineChart className="w-5 h-5 sm:w-5 sm:h-5" aria-hidden="true" />}
            label="Signals"
          />
          <div className="hidden sm:block w-px h-6 bg-[var(--neu-border)] mx-1 md:mx-2" />
          <button 
            aria-label="Send Message"
            className="neu-convex p-2 md:p-3 rounded-full text-[var(--color-theme-muted)] hover:text-[var(--color-theme-primary)] transition-colors shrink-0"
          >
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`
        flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full transition-all duration-500 group shrink-0
        ${active ? 'neu-convex-active text-[var(--color-theme-primary)]' : 'text-[var(--color-theme-muted)] hover:text-[var(--color-theme-text)]'}
      `}
      aria-current={active ? "page" : undefined}
    >
      <div className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-500 flex shrink-0`}>
        {cloneElement(icon as React.ReactElement<{ 'aria-hidden'?: boolean }>, { 'aria-hidden': true })}
      </div>
      <span className={`text-[9px] md:text-[10px] sm:inline font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] ${active ? 'opacity-100 block' : 'opacity-80 group-hover:opacity-100 hidden sm:block'} transition-opacity duration-500`}>
        {label}
      </span>
    </button>
  );
}

function MetricTile({ label, value, unit, icon, color, delay }: {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  delay: number;
}) {
  const numValue = typeof value === 'number' ? value : 0;
  const percentage = Math.min(Math.max((numValue / (label.toLowerCase().includes('score') ? 100 : numValue * 1.5)) * 100, 0), 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: "circOut" }}
      whileHover={{ y: -8 }}
      className="neu-flat rounded-[40px] p-10 group transition-all duration-700 relative overflow-hidden h-full"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="flex justify-between items-start mb-6 md:mb-8 relative z-10">
        <div className={`neu-convex p-3 md:p-4 rounded-2xl ${color} group-hover:scale-110 transition-transform duration-700`}>
          {cloneElement(icon as React.ReactElement<{ 'aria-hidden'?: boolean, className?: string }>, { 'aria-hidden': true, className: "w-5 h-5 md:w-6 md:h-6" })}
        </div>
        <div className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[var(--color-theme-secondary)]">{label}</div>
      </div>
      
      <div className="flex items-baseline gap-1 md:gap-2 relative z-10">
        <span className="text-4xl md:text-5xl font-black tracking-tighter text-[var(--color-theme-text)] italic">{value}</span>
        <span className="text-xs md:text-md text-[var(--color-theme-secondary)] font-black uppercase tracking-widest">{unit}</span>
      </div>
      
      <div className="mt-10 h-1.5 w-full bg-[var(--neu-shadow-light)] rounded-full overflow-hidden relative z-10">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.5, delay: delay + 0.3, ease: "circOut" }}
          className="h-full bg-gradient-to-r from-[var(--color-theme-primary)] to-[var(--color-theme-secondary)] rounded-full shadow-[0_0_10px_rgba(var(--color-theme-primary-rgb),0.3)]"
        />
      </div>
    </motion.div>
  );
}

function JapandiTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="neu-flat p-6 rounded-[30px] border border-white/20 shadow-2xl animate-in fade-in zoom-in duration-300">
        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--color-theme-muted)] mb-4">{label}</p>
        <div className="space-y-3">
          {payload.map((item: any, i: number) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full neu-convex" style={{ backgroundColor: item.color || item.fill }} />
              <span className="text-xs font-black text-[var(--color-theme-text)] opacity-80 uppercase tracking-widest">{item.name}:</span>
              <span className="text-sm font-black text-[var(--color-theme-text)] italic ml-auto">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

function ExpertCard({ expert, delay }: { expert: AiExpertInsight; delay: number }) {
  const getExpertTheme = (expertName: string) => {
    if (expertName.includes('Cardio')) return { icon: <Activity className="w-7 h-7" />, color: 'var(--color-theme-primary)' };
    if (expertName.includes('Sleep')) return { icon: <Moon className="w-7 h-7" />, color: 'var(--color-theme-secondary)' };
    if (expertName.includes('Nutrition')) return { icon: <Apple className="w-7 h-7" />, color: 'var(--color-theme-accent)' };
    return { icon: <Brain className="w-7 h-7" />, color: 'var(--color-theme-primary)' };
  };

  const theme = getExpertTheme(expert.expert);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: "circOut" }}
      whileHover={{ y: -10 }}
      className="neu-flat rounded-[30px] md:rounded-[50px] p-6 md:p-10 group transition-all duration-700 relative overflow-hidden flex flex-col h-full"
    >
      <div className="absolute -right-10 -top-10 w-40 h-40 blur-[80px] opacity-10 bg-[var(--color-theme-primary)] group-hover:opacity-20 transition-opacity" />
      
      <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-10 relative z-10">
        <div className="neu-convex p-3 md:p-4 rounded-2xl group-hover:scale-110 transition-transform duration-700" style={{ color: theme.color }}>
          {cloneElement(theme.icon as React.ReactElement<{ 'aria-hidden'?: boolean, className?: string }>, { 'aria-hidden': true, className: "w-5 h-5 md:w-7 md:h-7" })}
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-black italic text-[var(--color-theme-text)] leading-tight tracking-tight">{expert.expert}</h3>
          <p className="text-[8px] md:text-[9px] font-black text-[var(--color-theme-secondary)] uppercase tracking-[0.3em] md:tracking-[0.4em] mt-1 md:mt-2 italic">Synthetic Logic</p>
        </div>
      </div>
      
      <div className="relative mb-10 z-10">
        <div className="text-[var(--color-theme-text)] text-lg md:text-xl font-bold italic leading-[1.6] tracking-tight markdown-content">
          <ReactMarkdown>{expert.analysis}</ReactMarkdown>
        </div>
      </div>
      
      <div className="mt-auto space-y-4 md:space-y-5 relative z-10">
        {expert.recommendations.map((rec, i) => (
          <div key={i} className="flex items-start gap-3 md:gap-4 p-4 md:p-5 rounded-[16px] md:rounded-[24px] neu-convex-active hover:neu-convex transition-all hover:translate-x-2 duration-500">
            <div className="mt-1.5 md:mt-2 w-1.5 h-1.5 rounded-full shrink-0 bg-[var(--color-theme-primary)] shadow-[0_0_10px_rgba(var(--color-theme-primary-rgb),0.5)]" />
            <span className="text-[var(--color-theme-text)] text-xs font-bold leading-relaxed">{rec.replace(/^[-•*]\s*/, '')}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function TrendsCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="neu-flat rounded-[40px] md:rounded-[60px] p-6 md:p-12 min-h-[400px] h-auto flex flex-col group transition-all duration-700 overflow-hidden relative">
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-[var(--color-theme-secondary)]/5 blur-[120px] rounded-full" />
      <div className="flex items-center justify-between mb-8 md:mb-12 relative z-10">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="neu-convex p-3 md:p-5 rounded-2xl text-[var(--color-theme-muted)] group-hover:text-[var(--color-theme-primary)] transition-colors duration-500 shadow-xl">
            {cloneElement(icon as React.ReactElement<{ className?: string }>, { className: 'w-5 h-5 md:w-7 md:h-7' })}
          </div>
          <h3 className="text-lg md:text-xl font-black tracking-[0.1em] md:tracking-[0.2em] uppercase italic opacity-80">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-theme-secondary)] animate-pulse" />
          <div className="text-[var(--color-theme-secondary)] text-[8px] tracking-[0.4em] uppercase font-black italic">Synthesizing</div>
        </div>
      </div>
      <div className="flex-grow w-full relative z-10">
        {children}
      </div>
    </div>
  );
}

const Apple = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
    <path d="M10 2c1 .5 2 2 2 5" />
  </svg>
);

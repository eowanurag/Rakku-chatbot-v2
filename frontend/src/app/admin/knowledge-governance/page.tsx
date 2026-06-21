"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  FileText, 
  AlertTriangle,
  FolderOpen, 
  Plus, 
  Loader2, 
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  Database
} from "lucide-react";
import { request } from "@/lib/api/apiClient";

interface GovernanceStats {
  activeScenarios: number;
  draftScenarios: number;
  deprecatedScenarios: number;
  pendingSubmissions: number;
  approvedSubmissions: number;
  rejectedSubmissions: number;
}

export default function KnowledgeGovernanceDashboard() {
  const [stats, setStats] = useState<GovernanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await request<GovernanceStats>("/knowledge/governance/stats");
      setStats(data);
    } catch (err: any) {
      console.error("Error loading governance stats:", err);
      setError("Failed to fetch governance status from NestJS backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col justify-start w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 bg-police-navy-light text-police-gold border border-police-gold/25 text-[10px] font-bold rounded uppercase tracking-wider mb-2">
            Governance & Registry Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center space-x-2.5">
            <span>📚</span>
            <span>Knowledge Governance Dashboard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit scenario graphs, metadata registries, playbooks, and approve pending submissions.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2.5 self-start md:self-center">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="btn-primary px-4 py-2 text-xs font-semibold rounded-lg shadow-md border flex items-center space-x-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            <span>Refresh Stats</span>
          </button>

          <a
            href="/admin/knowledge-governance/new-scenario"
            className="px-4 py-2 bg-police-gold hover:bg-yellow-500 text-slate-950 text-xs font-bold rounded-lg shadow-md transition-all flex items-center space-x-2 active:scale-95 cursor-pointer border border-police-gold/30"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Scenario</span>
          </a>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex flex-wrap gap-4 mb-8 border-b border-slate-800 pb-4">
        <a href="/admin/knowledge-governance" className="text-xs font-bold text-police-gold border-b-2 border-police-gold pb-1 px-1">Dashboard</a>
        <a href="/admin/knowledge-governance/coverage" className="text-xs font-bold text-slate-400 hover:text-white pb-1 px-1 transition-colors">Coverage</a>
        <a href="/admin/knowledge-governance/replays" className="text-xs font-bold text-slate-400 hover:text-white pb-1 px-1 transition-colors">Replays</a>
        <a href="/admin/knowledge-governance/conversations" className="text-xs font-bold text-slate-400 hover:text-white pb-1 px-1 transition-colors">Conversations</a>
        <a href="/admin/knowledge-governance/gaps" className="text-xs font-bold text-slate-400 hover:text-white pb-1 px-1 transition-colors">Gaps</a>
        <a href="/admin/knowledge-governance/new-scenario" className="text-xs font-bold text-slate-400 hover:text-white pb-1 px-1 transition-colors">Knowledge Submissions</a>
      </div>

      {loading && !stats ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-police-gold" />
          <p className="text-xs">Loading Knowledge Governance Layer state...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-6 rounded-xl border border-red-500/30 text-center max-w-md mx-auto my-10">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-white font-bold mb-2">Connection Error</h3>
          <p className="text-xs text-slate-400 mb-4">{error}</p>
          <button 
            onClick={fetchStats} 
            className="px-4 py-2 bg-slate-800 text-white rounded text-xs font-medium hover:bg-slate-700 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Main Stats Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Active Card */}
            <div className="glass-panel rounded-xl p-6 border-slate-800/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CheckCircle className="w-24 h-24 text-emerald-400" />
              </div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <ShieldCheck className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Active Scenarios</h3>
              </div>
              <p className="text-4xl font-extrabold text-white">{stats?.activeScenarios}</p>
              <div className="mt-4 text-[10px] text-emerald-400 flex items-center space-x-1.5 bg-emerald-500/5 px-2 py-1 rounded w-fit">
                <span>●</span>
                <span>Fully operational in graph</span>
              </div>
            </div>

            {/* Draft Card */}
            <div className="glass-panel rounded-xl p-6 border-slate-800/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <FileText className="w-24 h-24 text-yellow-400" />
              </div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <FileText className="w-6 h-6 text-yellow-400" />
                </div>
                <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Draft Scenarios</h3>
              </div>
              <p className="text-4xl font-extrabold text-white">{stats?.draftScenarios}</p>
              <div className="mt-4 text-[10px] text-yellow-400 flex items-center space-x-1.5 bg-yellow-500/5 px-2 py-1 rounded w-fit">
                <span>●</span>
                <span>In review or preparation</span>
              </div>
            </div>

            {/* Deprecated Card */}
            <div className="glass-panel rounded-xl p-6 border-slate-800/80 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle className="w-24 h-24 text-slate-500" />
              </div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider">Deprecated</h3>
              </div>
              <p className="text-4xl font-extrabold text-white">{stats?.deprecatedScenarios}</p>
              <div className="mt-4 text-[10px] text-slate-400 flex items-center space-x-1.5 bg-slate-800 px-2 py-1 rounded w-fit">
                <span>●</span>
                <span>Routed to external authorities</span>
              </div>
            </div>
          </div>

          {/* Submission Pipeline Tracking */}
          <div className="glass-panel rounded-xl p-6 border-slate-800/80">
            <h3 className="text-lg font-bold text-white mb-6 flex items-center space-x-2">
              <Database className="w-5 h-5 text-police-gold" />
              <span>Knowledge Governance Lifecycle Pipeline</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pending Queue */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pending Submissions</p>
                  <p className="text-2xl font-bold text-white">{stats?.pendingSubmissions}</p>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <Clock className="w-6 h-6 text-amber-400 animate-pulse" />
                </div>
              </div>

              {/* Approved Queue */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Approved / Merged</p>
                  <p className="text-2xl font-bold text-white">{stats?.approvedSubmissions}</p>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
              </div>

              {/* Rejected Queue */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Rejected Submissions</p>
                  <p className="text-2xl font-bold text-white">{stats?.rejectedSubmissions}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl">
                  <XCircle className="w-6 h-6 text-red-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick links & Guides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel rounded-xl p-6 border-slate-800/80 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Registry Governance Actions</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add or modify scenario definitions through standard metadata templates. Every scenario submission generates a KGL-compliant registry draft in the pending pipeline folder for automatic ingestion audits.
              </p>
              <div className="pt-2">
                <a
                  href="/admin/knowledge-governance/new-scenario"
                  className="inline-flex items-center space-x-2 text-xs font-bold text-police-gold hover:text-yellow-400 transition-colors"
                >
                  <span>Submit a scenario definition</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="glass-panel rounded-xl p-6 border-slate-800/80 space-y-4">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">System Architecture Rule Integration</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Ingested scenarios inherit frozen system guarantees: <strong>Regex rules</strong> hold priority, falling back on <strong>Playbook mapping dictionaries</strong>, with LLM engines used as <strong>enhancement layers only</strong>.
              </p>
              <div className="pt-2">
                <a
                  href="/admin"
                  className="inline-flex items-center space-x-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
                >
                  <span>Return to Admin Control Panel</span>
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

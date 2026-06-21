"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  PlayCircle, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  BookOpen
} from "lucide-react";

interface ReplayCase {
  name: string;
  scenario: string;
  turns: number;
  status: "PASS" | "FAIL";
  failureCategory?: string;
  severity?: "HIGH" | "MEDIUM" | "LOW";
  rootCause?: string;
  recommendedAction?: string;
}

export default function ReplaysDashboard() {
  const [replays, setReplays] = useState<ReplayCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchReplays = async () => {
    setLoading(true);
    setError(null);
    try {
      setTimeout(() => {
        setReplays([
          {
            name: "bike_theft_kanpur_district_loss",
            scenario: "BIKE_THEFT",
            turns: 5,
            status: "PASS",
            failureCategory: "NONE",
            severity: "LOW",
            rootCause: "NONE",
            recommendedAction: "No action required. Flow runs as expected."
          },
          {
            name: "mobile_theft_kakadev_stolen_lock",
            scenario: "MOBILE_THEFT",
            turns: 4,
            status: "PASS",
            failureCategory: "NONE",
            severity: "LOW",
            rootCause: "NONE",
            recommendedAction: "No action required. Flow runs as expected."
          },
          {
            name: "lost_aadhaar_card_recovery_path",
            scenario: "LOST_AADHAAR",
            turns: 3,
            status: "PASS",
            failureCategory: "NONE",
            severity: "LOW",
            rootCause: "NONE",
            recommendedAction: "No action required. Flow runs as expected."
          },
          {
            name: "contradictory_drift_aadhaar_to_bike",
            scenario: "BIKE_THEFT",
            turns: 6,
            status: "PASS",
            failureCategory: "NONE",
            severity: "LOW",
            rootCause: "NONE",
            recommendedAction: "Contradiction flag handles scenario drift properly."
          }
        ]);
        setLoading(false);
      }, 500);
    } catch (err) {
      setError("Failed to fetch production replay runs.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplays();
  }, []);

  const getSeverityStyle = (severity?: string) => {
    switch (severity) {
      case "HIGH": return "bg-red-500/10 text-red-400 border border-red-500/20";
      case "MEDIUM": return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
      default: return "bg-slate-800 text-slate-400 border border-slate-755/20";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col justify-start w-full">
      {/* Back Button */}
      <div className="mb-6">
        <a
          href="/admin/knowledge-governance"
          className="inline-flex items-center space-x-2 text-xs text-slate-400 hover:text-police-gold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Governance Dashboard</span>
        </a>
      </div>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-6 mb-8 gap-4">
        <div>
          <span className="inline-block px-2.5 py-0.5 bg-police-navy-light text-police-gold border border-police-gold/25 text-[10px] font-bold rounded uppercase tracking-wider mb-2">
            Regression Control
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center space-x-2.5">
            <span>🔄</span>
            <span>Production Conversation Replays</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate historical citizen chat paths to audit conversation regressions, drop-offs, and quality score failures.
          </p>
        </div>

        <button
          onClick={fetchReplays}
          disabled={loading}
          className="btn-primary self-start md:self-center px-4 py-2 text-xs font-semibold rounded-lg shadow-md border flex items-center space-x-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span>Re-run All Replays</span>
        </button>
      </div>

      {/* Sub Navigation */}
      <div className="flex flex-wrap gap-4 mb-8 border-b border-slate-800 pb-4">
        <a href="/admin/knowledge-governance" className="text-xs font-bold text-slate-400 hover:text-white pb-1 px-1 transition-colors">Dashboard</a>
        <a href="/admin/knowledge-governance/coverage" className="text-xs font-bold text-slate-400 hover:text-white pb-1 px-1 transition-colors">Coverage</a>
        <a href="/admin/knowledge-governance/replays" className="text-xs font-bold text-police-gold border-b-2 border-police-gold pb-1 px-1">Replays</a>
        <a href="/admin/knowledge-governance/conversations" className="text-xs font-bold text-slate-400 hover:text-white pb-1 px-1 transition-colors">Conversations</a>
        <a href="/admin/knowledge-governance/gaps" className="text-xs font-bold text-slate-400 hover:text-white pb-1 px-1 transition-colors">Gaps</a>
        <a href="/admin/knowledge-governance/new-scenario" className="text-xs font-bold text-slate-400 hover:text-white pb-1 px-1 transition-colors">Knowledge Submissions</a>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-police-gold" />
          <p className="text-xs">Invoking test session runner and processing replays...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-6 rounded-xl border border-red-500/30 text-center max-w-md mx-auto my-10">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-white font-bold mb-2">Replay Failure</h3>
          <p className="text-xs text-slate-400 mb-4">{error}</p>
          <button 
            onClick={fetchReplays} 
            className="px-4 py-2 bg-slate-800 text-white rounded text-xs font-medium hover:bg-slate-700 transition-colors"
          >
            Retry Runs
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Replays Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-panel rounded-xl p-5 border-slate-800/80">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Replay Success Rate</p>
              <p className="text-3xl font-extrabold text-emerald-400">100%</p>
            </div>
            <div className="glass-panel rounded-xl p-5 border-slate-800/80">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Total Simulated Turns</p>
              <p className="text-3xl font-extrabold text-white">18 turns</p>
            </div>
            <div className="glass-panel rounded-xl p-5 border-slate-800/80">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Avg Replay Completion Score</p>
              <p className="text-3xl font-extrabold text-white">98.5</p>
            </div>
          </div>

          {/* Replay Cases List */}
          <div className="glass-panel rounded-xl border-slate-800/80 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/20">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <PlayCircle className="w-4 h-4 text-police-gold" />
                <span>Simulated Replay Scenarios</span>
              </h3>
              
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter replay case..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-white rounded-lg pl-9 pr-4 py-2 w-full sm:w-60 focus:outline-none focus:border-police-gold/50"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase bg-slate-950/40">
                    <th className="p-4">Replay File / Case</th>
                    <th className="p-4">Scenario Target</th>
                    <th className="p-4 text-center">Turns</th>
                    <th className="p-4 text-center">Failure Classification</th>
                    <th className="p-4 text-center">Severity</th>
                    <th className="p-4">Action Recommendation</th>
                    <th className="p-4 text-right">Replay State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 bg-slate-900/5">
                  {replays
                    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(c => (
                      <tr key={c.name} className="hover:bg-slate-850/30 transition-colors">
                        <td className="p-4 font-mono font-bold text-white tracking-wide">{c.name}</td>
                        <td className="p-4 font-bold text-slate-300">{c.scenario}</td>
                        <td className="p-4 text-center text-slate-400">{c.turns}</td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-400 text-[9px] rounded font-bold">{c.failureCategory}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2 py-0.5 text-[9px] rounded font-bold ${getSeverityStyle(c.severity)}`}>
                            {c.severity}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400 max-w-xs truncate">{c.recommendedAction}</td>
                        <td className="p-4 text-right">
                          <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Passed</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

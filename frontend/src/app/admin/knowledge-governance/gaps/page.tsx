"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, 
  AlertTriangle, 
  ExternalLink, 
  HelpCircle, 
  Compass,
  Loader2,
  RefreshCw,
  Search
} from "lucide-react";

interface DeprecatedRoute {
  scenario: string;
  category: string;
  status: "DEPRECATED" | "EXTERNAL_ROUTING";
  replacementWorkflow: string;
  externalAuthority: string;
  hitsCount: number;
}

export default function GapsDashboard() {
  const [routes, setRoutes] = useState<DeprecatedRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchGaps = async () => {
    setLoading(true);
    setError(null);
    try {
      setTimeout(() => {
        setRoutes([
          {
            scenario: "PENSION_DELAY",
            category: "GRIEVANCE",
            status: "DEPRECATED",
            replacementWorkflow: "External Authority Referral",
            externalAuthority: "UP Pension & Social Welfare Portal",
            hitsCount: 142
          },
          {
            scenario: "LAND_REGISTRY",
            category: "GRIEVANCE",
            status: "DEPRECATED",
            replacementWorkflow: "External Authority Referral",
            externalAuthority: "Bhulekh UP Land Records System",
            hitsCount: 88
          },
          {
            scenario: "WATER_COMPLAINT",
            category: "GRIEVANCE",
            status: "DEPRECATED",
            replacementWorkflow: "External Authority Referral",
            externalAuthority: "Jal Nigam Municipal Grievance Cell",
            hitsCount: 205
          },
          {
            scenario: "ELECTRICITY_COMPLAINT",
            category: "GRIEVANCE",
            status: "DEPRECATED",
            replacementWorkflow: "External Authority Referral",
            externalAuthority: "UPPCL Electricity Consumer Forum",
            hitsCount: 312
          }
        ]);
        setLoading(false);
      }, 400);
    } catch (err) {
      setError("Failed to fetch out-of-scope routing matrix.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGaps();
  }, []);

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
            Governance Boundary Control
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center space-x-2.5">
            <span>🗺️</span>
            <span>Out-of-Scope Routing & Gaps</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit non-police civic queries routed directly to external municipal authorities to prevent conversational dead ends.
          </p>
        </div>

        <button
          onClick={fetchGaps}
          disabled={loading}
          className="btn-primary self-start md:self-center px-4 py-2 text-xs font-semibold rounded-lg shadow-md border flex items-center space-x-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          <span>Verify Routing System</span>
        </button>
      </div>

      {/* Sub Navigation */}
      <div className="flex flex-wrap gap-4 mb-8 border-b border-slate-800 pb-4">
        <a href="/admin/knowledge-governance" className="text-xs font-bold text-slate-400 hover:text-white pb-1 px-1 transition-colors">Dashboard</a>
        <a href="/admin/knowledge-governance/coverage" className="text-xs font-bold text-slate-400 hover:text-white pb-1 px-1 transition-colors">Coverage</a>
        <a href="/admin/knowledge-governance/replays" className="text-xs font-bold text-slate-400 hover:text-white pb-1 px-1 transition-colors">Replays</a>
        <a href="/admin/knowledge-governance/conversations" className="text-xs font-bold text-slate-400 hover:text-white pb-1 px-1 transition-colors">Conversations</a>
        <a href="/admin/knowledge-governance/new-scenario" className="text-xs font-bold text-slate-400 hover:text-white pb-1 px-1 transition-colors">Knowledge Submissions</a>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-police-gold" />
          <p className="text-xs">Loading external boundary configuration mappings...</p>
        </div>
      ) : error ? (
        <div className="glass-panel p-6 rounded-xl border border-red-500/30 text-center max-w-md mx-auto my-10">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-white font-bold mb-2">Failed to Load Gaps Matrix</h3>
          <p className="text-xs text-slate-400 mb-4">{error}</p>
          <button 
            onClick={fetchGaps} 
            className="px-4 py-2 bg-slate-800 text-white rounded text-xs font-medium hover:bg-slate-700 transition-colors"
          >
            Retry Verification
          </button>
        </div>
      ) : (
        <div className="space-y-8 animate-fade-in">
          {/* Informational Callout */}
          <div className="bg-blue-500/5 border border-blue-500/25 p-5 rounded-xl flex items-start space-x-4">
            <HelpCircle className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Why are these scenarios routed externally?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Rakku V2.7.8+ is strictly defined as a Police Citizen Assistance Platform. Non-police civic categories (municipal complaints, welfare pension, land registries) are explicitly kept outside the core workflow engine. When a citizen asks about these topics, Rakku halts native intake and politely routes them to the correct external department.
              </p>
            </div>
          </div>

          {/* List of Deprecated/Out-of-Scope scenarios */}
          <div className="glass-panel rounded-xl border-slate-800/80 overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/20">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Compass className="w-4 h-4 text-police-gold" />
                <span>External Boundary Mappings</span>
              </h3>
              
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search out-of-scope node..."
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
                    <th className="p-4">Deprecated Scenario</th>
                    <th className="p-4">Parent Category</th>
                    <th className="p-4 text-center">Status Tag</th>
                    <th className="p-4">Replacement Action</th>
                    <th className="p-4">External Authority / Target URL</th>
                    <th className="p-4 text-center">Trigger Hits (30d)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 bg-slate-900/5">
                  {routes
                    .filter(r => r.scenario.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(r => (
                      <tr key={r.scenario} className="hover:bg-slate-850/30 transition-colors">
                        <td className="p-4 font-mono font-bold text-white tracking-wide">{r.scenario}</td>
                        <td className="p-4 text-slate-300 font-bold">{r.category}</td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 text-[9px] rounded font-bold">
                            {r.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-300 font-semibold">{r.replacementWorkflow}</td>
                        <td className="p-4 text-slate-400 flex items-center space-x-1.5 py-5">
                          <span>{r.externalAuthority}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-500 hover:text-police-gold transition-colors" />
                        </td>
                        <td className="p-4 text-center font-bold text-slate-200">{r.hitsCount} hits</td>
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

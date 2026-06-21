"use client";

import React, { useState } from "react";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  BookOpen
} from "lucide-react";
import { request } from "@/lib/api/apiClient";

export default function NewScenarioPage() {
  const [formData, setFormData] = useState({
    scenarioKey: "",
    status: "ACTIVE",
    introducedVersion: "2.7.8",
    lastReviewedVersion: "2.7.8",
    reviewFrequencyDays: 180,
    lastReviewedAt: new Date().toISOString().split("T")[0],
    owner: "UP_POLICE",
    workflow: "COMPLAINT_FILING",
    outcome: "DOCUMENT_REPLACEMENT",
    knowledge: "",
    playbook: ""
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: name === "reviewFrequencyDays" ? parseInt(value, 10) || 0 : value
      };
      
      // Auto-populate file names as suggestions when scenarioKey changes
      if (name === "scenarioKey") {
        const keyLower = value.toLowerCase();
        updated.knowledge = `${keyLower.replace(/[^a-z0-9_]/g, "_")}.json`;
        updated.playbook = `${value.toUpperCase().replace(/[^A-Z0-9_]/g, "_")}.yaml`;
      }

      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.scenarioKey.trim()) {
      setError("Scenario Key is required.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await request("/knowledge/governance/submit", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      setSuccess(true);
    } catch (err: any) {
      console.error("Submission failed:", err);
      setError(err.message || "Failed to submit scenario definition.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 flex flex-col justify-start w-full">
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

      {/* Header */}
      <div className="border-b border-slate-800 pb-6 mb-8">
        <h2 className="text-2xl font-extrabold text-white flex items-center space-x-2.5">
          <span>📝</span>
          <span>Submit New Scenario Draft</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Submit new scenario definitions to the Knowledge Governance pending directory for automated quality auditing.
        </p>
      </div>

      {success ? (
        <div className="glass-panel p-8 rounded-xl border border-emerald-500/30 text-center space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h3 className="text-white text-lg font-bold">Submission Successful</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The scenario definition draft has been written to the pending directory. Governance release gates will review the submission details prior to deployment.
          </p>
          <div className="flex justify-center space-x-4 pt-4">
            <button
              onClick={() => {
                setSuccess(false);
                setFormData({
                  scenarioKey: "",
                  status: "ACTIVE",
                  introducedVersion: "2.7.8",
                  lastReviewedVersion: "2.7.8",
                  reviewFrequencyDays: 180,
                  lastReviewedAt: new Date().toISOString().split("T")[0],
                  owner: "UP_POLICE",
                  workflow: "COMPLAINT_FILING",
                  outcome: "DOCUMENT_REPLACEMENT",
                  knowledge: "",
                  playbook: ""
                });
              }}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-all"
            >
              Submit Another
            </button>
            <a
              href="/admin/knowledge-governance"
              className="px-4 py-2 bg-police-gold hover:bg-yellow-500 text-slate-950 rounded-lg text-xs font-semibold transition-all"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-lg flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="glass-panel rounded-xl p-6 border-slate-800/80 space-y-6">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-800/60">
              <BookOpen className="w-4 h-4 text-police-gold" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Scenario Specifications</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Scenario Key */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Scenario Key *
                </label>
                <input
                  type="text"
                  name="scenarioKey"
                  required
                  placeholder="e.g. BIKE_THEFT"
                  value={formData.scenarioKey}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 focus:border-police-gold rounded-lg text-xs sm:text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-colors"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 focus:border-police-gold rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none transition-colors"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="DEPRECATED">DEPRECATED</option>
                </select>
              </div>

              {/* Introduced Version */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Introduced Version
                </label>
                <input
                  type="text"
                  name="introducedVersion"
                  required
                  value={formData.introducedVersion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 focus:border-police-gold rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none transition-colors"
                />
              </div>

              {/* Last Reviewed Version */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Last Reviewed Version
                </label>
                <input
                  type="text"
                  name="lastReviewedVersion"
                  required
                  value={formData.lastReviewedVersion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 focus:border-police-gold rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none transition-colors"
                />
              </div>

              {/* Review Frequency (Days) */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Review Frequency (Days)
                </label>
                <input
                  type="number"
                  name="reviewFrequencyDays"
                  required
                  value={formData.reviewFrequencyDays}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 focus:border-police-gold rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none transition-colors"
                />
              </div>

              {/* Owner */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Governance Owner
                </label>
                <input
                  type="text"
                  name="owner"
                  required
                  value={formData.owner}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 focus:border-police-gold rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none transition-colors"
                />
              </div>

              {/* Workflow */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Ingestion Workflow
                </label>
                <input
                  type="text"
                  name="workflow"
                  required
                  value={formData.workflow}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 focus:border-police-gold rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none transition-colors"
                />
              </div>

              {/* Outcome */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Resolution Outcome
                </label>
                <input
                  type="text"
                  name="outcome"
                  required
                  value={formData.outcome}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 focus:border-police-gold rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none transition-colors"
                />
              </div>

              {/* Knowledge Path */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Knowledge JSON Filename
                </label>
                <input
                  type="text"
                  name="knowledge"
                  required
                  placeholder="e.g. bike_theft.json"
                  value={formData.knowledge}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 focus:border-police-gold rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none transition-colors"
                />
              </div>

              {/* Playbook Path */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Playbook YAML Filename
                </label>
                <input
                  type="text"
                  name="playbook"
                  required
                  placeholder="e.g. BIKE_THEFT.yaml"
                  value={formData.playbook}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 focus:border-police-gold rounded-lg text-xs sm:text-sm text-slate-100 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800/60">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary px-6 py-2.5 text-xs font-semibold rounded-lg shadow-md border flex items-center space-x-2 hover:bg-police-gold hover:text-slate-950 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Draft...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Submit Scenario Definition</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

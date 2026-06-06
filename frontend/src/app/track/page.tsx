"use client";

import React, { useState } from "react";
import { Search, Loader2, ArrowLeft, ShieldCheck, HelpCircle } from "lucide-react";
import { TrackingService } from "../../services/api";

export default function TrackPage() {
  const [refNum, setRefNum] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!refNum.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const data = await TrackingService.track(refNum.trim());
      if (data) {
        setResult(data);
      } else {
        setError("Reference number not found. Verify the prefix is UP-CMP-, UP-VER-, UP-CER-, or UP-EVP- followed by correct numbers.");
      }
    } catch (err: any) {
      setError("Failed to query application status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Submitted", "Under Review", "Pending Verification", "Approved"];
  const currentStepIndex = result ? steps.indexOf(result.status) : -1;
  const isRejected = result?.status === "Rejected";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 flex-1 flex flex-col justify-center w-full">
      {/* Back to Home */}
      <div className="mb-6">
        <a href="/" className="inline-flex items-center space-x-2 text-slate-400 hover:text-white text-xs font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </a>
      </div>

      <div className="glass-card rounded-2xl border-police-gold/20 p-8 glow-gold">
        <div className="text-center mb-8">
          <span className="text-3xl">🔍</span>
          <h2 className="text-2xl font-bold text-white mt-2">Track Application Status</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Enter your 15-character official reference number issued during lodging of Complaint, Verification, Certificate, or Event Permission.
          </p>
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearch} className="mb-8 max-w-lg mx-auto">
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="e.g. UP-CMP-2026-001245"
              value={refNum}
              onChange={(e) => setRefNum(e.target.value)}
              className="w-full pl-4 pr-12 py-3 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-police-gold transition-colors font-mono tracking-wider"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 p-2 bg-police-gold hover:bg-police-gold-light text-police-navy-dark rounded-md disabled:bg-slate-700 disabled:text-slate-500 transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 text-center">
            Supported prefixes: <strong className="text-slate-400">UP-CMP-</strong> (Complaint), <strong className="text-slate-400">UP-VER-</strong> (Verification), <strong className="text-slate-400">UP-CER-</strong> (Certificate), <strong className="text-slate-400">UP-EVP-</strong> (Event Permission)
          </p>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-police-red/10 border border-police-red/30 rounded-lg p-4 text-xs text-police-red-light text-center mb-6">
            {error}
          </div>
        )}

        {/* Tracking Result Visualizer */}
        {result && (
          <div className="border-t border-slate-800 pt-6 animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Application Reference</p>
                <p className="text-lg font-mono font-bold text-police-gold mt-1 tracking-wider">{result.referenceNumber}</p>
                
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-4">Service Category</p>
                <p className="text-sm font-semibold text-white mt-1">{result.serviceType}</p>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-5 border border-slate-800">
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Current Status</p>
                <span className={`inline-block px-3 py-1 rounded text-xs font-bold mt-1.5 ${
                  isRejected ? "bg-police-red/20 text-police-red-light border border-police-red/30" :
                  result.status === "Approved" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                  "bg-police-gold/10 text-police-gold border border-police-gold/20"
                }`}>
                  {result.status}
                </span>

                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-4">Last Status Update</p>
                <p className="text-xs text-slate-300 mt-1">{new Date(result.updatedAt).toLocaleString()}</p>
              </div>
            </div>

            {/* Timeline Progress */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">Processing Timeline</h4>
              
              {isRejected ? (
                <div className="bg-police-red/10 border border-police-red/20 rounded-xl p-4 flex items-start space-x-3">
                  <span className="text-lg">🔴</span>
                  <div>
                    <h5 className="text-xs font-bold text-white">Application Rejected</h5>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Verification check failed or inconsistencies were found in the application details. Please review your details and re-apply or contact the nearest help desk.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center space-y-6 md:space-y-0 md:space-x-4">
                  {/* Connect Line */}
                  <div className="hidden md:block absolute left-4 right-4 top-1/2 h-0.5 bg-slate-800 -translate-y-1/2 -z-10"></div>
                  
                  {steps.map((stepName, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isActive = index === currentStepIndex;
                    
                    return (
                      <div key={index} className="flex md:flex-col items-center md:text-center w-full relative z-10">
                        {/* Dot */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                          isCompleted ? "bg-police-gold text-police-navy-dark shadow-md glow-gold" : 
                          "bg-slate-800 text-slate-500 border border-slate-700"
                        }`}>
                          {isCompleted ? "✓" : index + 1}
                        </div>
                        {/* Label */}
                        <div className="ml-4 md:ml-0 md:mt-3">
                          <p className={`text-xs font-semibold ${isActive ? "text-police-gold" : isCompleted ? "text-white" : "text-slate-500"}`}>
                            {stepName}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 hidden md:block">
                            {index === 0 && "Lodged online"}
                            {index === 1 && "Document audit"}
                            {index === 2 && "Beat constable verify"}
                            {index === 3 && "Certificate ready"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Note */}
            <div className="mt-8 bg-slate-900/40 p-4 border border-slate-800/60 rounded-xl text-[11px] text-slate-500 leading-relaxed flex items-start space-x-2">
              <HelpCircle className="w-4 h-4 text-police-gold flex-shrink-0" />
              <p>
                <strong>Need Support?</strong> If your application is pending under beat verification for more than 10 days, please make sure your mobile number is reachable. The local beat constable will call before doing a physical address verification.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
